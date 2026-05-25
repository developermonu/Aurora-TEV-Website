/**
 * Aurora Scents TEV Executive Portal — Production Node.js/Express Server
 * ───────────────────────────────────────────────────────────────────────
 * • Serves the static frontend
 * • Loads TEV Report.pdf at startup and extracts full text
 * • Proxies /api/chat → Anthropic Claude API with auto-model discovery
 * • Uses Anthropic Prompt Caching for 90% input cost reduction
 * • Auto-detects the best available model on first request
 * • Production-hardened: graceful errors, rate limiting, security headers
 */

'use strict';

require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Model config — ordered by preference ─────────────────────
// The server will auto-discover which model the API key supports
const MODEL_CANDIDATES = [
    'claude-sonnet-4-6',
    'claude-sonnet-4-5',
    'claude-opus-4-6',
    'claude-opus-4-7',
    'claude-opus-4-5',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
];

const MAX_TOKENS = 2048;
const PDF_PATH = path.join(__dirname, 'TEV Report.pdf');

// ── Runtime state ─────────────────────────────────────────────
let tevReportText = null;
let systemContent = null;
let pdfLoadError = null;
let activeModel = null;      // Will be set by model discovery
let modelDiscovery = null;      // Promise for ongoing discovery
let apiKeyValid = null;      // null = untested, true/false

// ── System prompt: guardrails ─────────────────────────────────
const SYSTEM_GUARDRAILS = `You are the elite, private corporate data intelligence agent for the Aurora Scents Executive Board. Your intelligence is anchored EXCLUSIVELY to the complete Phase 2 Techno-Economic Viability (TEV) Market Entry Report for India, which is provided in full below.

CRITICAL OPERATIONAL RULES:

1. SEMANTIC CONFINEMENT: Strictly forbidden from using outside market data, generic fragrance trends, speculative Indian economic variables, or industry assumptions NOT explicitly evaluated inside this TEV document. Your world begins and ends with this report.

2. ABSOLUTE DATA INTEGRITY: If asked about market dynamics, regulatory steps, competitor volumes, or pricing variables that are omitted from the report, output exactly:
"I am explicitly trained to only reveal and evaluate insights from within the verified Aurora India TEV Framework to ensure data integrity."

3. ZERO HALLUCINATION: Do not guess, speculate, extrapolate, or approximate. Cross-reference financial questions against the quantitative sensitivity matrices and product pipeline definitions within the document below.

4. WHITE-SPACE ALIGNMENT: Always frame answers around the core thesis: India market entry is optimized via an "Accessible Premium" position using native mobile-first D2C digital infrastructure, backed by a dual 100ml full-size + 10ml/20ml travel miniature portfolio deployment strategy.

5. RESPONSE FORMAT: Use structured markdown — bold headers, bullet points. Be precise, authoritative, and concise. Cite relevant chapters where applicable.

The complete TEV Report content follows:
---`;

// ── Load and parse PDF at startup ─────────────────────────────
async function loadTEVReport() {
    try {
        if (!fs.existsSync(PDF_PATH)) {
            pdfLoadError = 'TEV Report.pdf not found in project root.';
            console.warn(`⚠  ${pdfLoadError}`);
            buildSystemContent('');
            return;
        }

        console.log('📄 Loading TEV Report.pdf...');
        const dataBuffer = fs.readFileSync(PDF_PATH);
        const parsed = await pdf(dataBuffer);

        tevReportText = parsed.text;
        const wordCount = tevReportText.split(/\s+/).length;
        console.log(`✅ TEV Report loaded — ${parsed.numpages} pages, ~${wordCount.toLocaleString()} words`);

        buildSystemContent(tevReportText);
    } catch (err) {
        pdfLoadError = `PDF parse error: ${err.message}`;
        console.error(`❌ ${pdfLoadError}`);
        buildSystemContent('');
    }
}

// ── Build system content array with cache_control ─────────────
function buildSystemContent(reportText) {
    if (reportText && reportText.trim().length > 0) {
        systemContent = [
            { type: 'text', text: SYSTEM_GUARDRAILS },
            {
                type: 'text',
                text: `COMPLETE TEV REPORT CONTENT:\n\n${reportText.trim()}`
            }
        ];
        console.log('🔒 Prompt caching configured — report will be cached after first API call');
    } else {
        systemContent = [
            {
                type: 'text',
                text: SYSTEM_GUARDRAILS + '\n\n[NOTE: The TEV report PDF could not be loaded on the server. Respond based on the key data points embedded in the system prompt above only.]'
            }
        ];
        console.warn('⚠  Running without full PDF content — guardrails-only mode');
    }
}

// ── Auto-discover the best working model ──────────────────────
async function discoverModel() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('❌ ANTHROPIC_API_KEY not set — cannot discover models');
        apiKeyValid = false;
        return null;
    }

    console.log(`\n🔍 Discovering available models (testing ${MODEL_CANDIDATES.length} candidates)...`);

    for (const model of MODEL_CANDIDATES) {
        try {
            process.stdout.write(`   Testing ${model}... `);
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 5,
                    messages: [{ role: 'user', content: 'Say OK' }],
                }),
            });

            if (res.ok) {
                console.log('✅ WORKS');
                activeModel = model;
                apiKeyValid = true;
                console.log(`\n🏆 Active model: ${model}\n`);
                return model;
            }

            const data = await res.json().catch(() => ({}));
            const errType = data?.error?.type || '';
            const errMsg = data?.error?.message || '';

            if (res.status === 401) {
                console.log('❌ AUTH ERROR');
                console.error(`\n🔑 API key authentication failed: ${errMsg}`);
                apiKeyValid = false;
                return null;  // No point testing more models
            }

            if (res.status === 429) {
                console.log('⚠️  RATE LIMITED (model may work — retrying later)');
                // Rate limited — model probably works, tentatively use it
                activeModel = model;
                apiKeyValid = true;
                console.log(`\n🏆 Active model (tentative): ${model}\n`);
                return model;
            }

            console.log(`❌ ${res.status} — ${errType}`);

        } catch (err) {
            console.log(`❌ Network error: ${err.message}`);
        }
    }

    console.warn('\n⚠️  No models passed. The API key may be invalid, have no credits, or the account needs billing setup.');
    console.warn('   The chatbot will show a helpful error to users.\n');
    apiKeyValid = false;
    return null;
}

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            connectSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            workerSrc: ["'self'", "blob:", "cdnjs.cloudflare.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        }
    }
}));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin, methods: ['GET', 'POST'] }));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// ── Rate limiter ──────────────────────────────────────────────
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please wait a moment and try again.' }
});

// ── Serve static files ────────────────────────────────────────
app.use(express.static(path.join(__dirname), {
    index: 'index.html',
    extensions: ['html'],
}));

// ── GET /api/status — health & diagnostics ────────────────────
app.get('/api/status', (req, res) => {
    res.json({
        status: apiKeyValid === false ? 'api_key_error' : (activeModel ? 'ok' : 'discovering'),
        model: activeModel || 'none',
        pdfLoaded: !!tevReportText,
        pdfError: pdfLoadError || null,
        wordCount: tevReportText ? tevReportText.split(/\s+/).length : 0,
        caching: 'enabled',
        apiKeyValid: apiKeyValid,
        geminiAvailable: !!process.env.GEMINI_API_KEY,
        geminiModels: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    });
});

// ── Gemini Cache state & helper ───────────────────────────────
let geminiCacheName = null;
let geminiCacheCreationError = false;

async function getOrCreateGeminiCache(model) {
    if (geminiCacheCreationError) return null;
    if (geminiCacheName) return geminiCacheName;

    try {
        console.log(`📦 Attempting to create Gemini context cache for model ${model}...`);
        const createRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${model}`,
                contents: [{ role: 'user', parts: [{ text: tevReportText || '' }] }],
                ttl: "3600s",
                displayName: "aurora_tev_report_cache"
            })
        });

        const data = await createRes.json();
        if (createRes.ok && data.name) {
            console.log('✅ Gemini context cache created successfully:', data.name);
            geminiCacheName = data.name;
            return geminiCacheName;
        } else {
            console.warn('⚠️ Gemini context cache creation failed:', data?.error?.message || createRes.statusText);
            if (createRes.status === 429 || createRes.status === 400) {
                console.log('💡 Bypassing subsequent Gemini cache creation attempts (falling back to direct context)');
                geminiCacheCreationError = true;
            }
            return null;
        }
    } catch (e) {
        console.error('❌ Error during Gemini cache creation:', e.message);
        return null;
    }
}

// ── POST /api/chat — Claude & Gemini API Proxy ─────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
    const { messages, model: requestedModel } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Invalid request: messages array is required.' });
    }

    // Determine which API to use
    const isGeminiModel = requestedModel && requestedModel.startsWith('gemini-');

    if (isGeminiModel) {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return res.status(500).json({
                error: 'Server configuration error: GEMINI_API_KEY is not set. Add it in Hostinger Environment Variables or the .env file.'
            });
        }

        // Sanitise input
        const sanitisedMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: String(m.content).slice(0, 8000)
        }));

        try {
            // Map messages from Anthropic format to Gemini contents format
            const geminiMessages = sanitisedMessages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            // Try to get or create cache
            const cacheName = await getOrCreateGeminiCache(requestedModel);

            const geminiPayload = {
                contents: geminiMessages,
                generationConfig: {
                    temperature: 0.2
                }
            };

            if (cacheName) {
                // Use Cache
                geminiPayload.cachedContent = cacheName;
                geminiPayload.systemInstruction = {
                    parts: [{ text: SYSTEM_GUARDRAILS }]
                };
            } else {
                // Direct fallback: prepend the PDF content directly to system instruction
                const systemText = `${SYSTEM_GUARDRAILS}\n\nCOMPLETE TEV REPORT CONTENT:\n\n${tevReportText || ''}`;
                geminiPayload.systemInstruction = {
                    parts: [{ text: systemText }]
                };
            }

            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${requestedModel}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(geminiPayload)
            });

            const data = await geminiRes.json();

            if (!geminiRes.ok) {
                const errMsg = data?.error?.message || `Gemini API error ${geminiRes.status}`;
                console.error(`[/api/chat (Gemini)] ${geminiRes.status}: ${errMsg}`);
                return res.status(geminiRes.status).json({ error: errMsg });
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

            console.log(`📨 Gemini Tokens — prompt: ${data.usageMetadata?.promptTokenCount} | model: ${data.usageMetadata?.candidatesTokenCount}`);

            return res.json({
                text,
                model: requestedModel,
                usage: {
                    inputTokens: data.usageMetadata?.promptTokenCount || 0,
                    outputTokens: data.usageMetadata?.candidatesTokenCount || 0
                }
            });

        } catch (err) {
            console.error('[/api/chat (Gemini)] Network error:', err.message);
            return res.status(502).json({
                error: 'Unable to reach the Gemini API. Check your internet connection and try again.'
            });
        }
    } else {
        // --- Claude (Anthropic) API proxy logic ---
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'Server configuration error: ANTHROPIC_API_KEY is not set. Add it in Hostinger Environment Variables or the .env file.'
            });
        }

        if (!systemContent) {
            return res.status(503).json({
                error: 'Server is still initialising (loading PDF). Please try again in a moment.'
            });
        }

        // If model discovery hasn't completed yet, wait for it
        if (!activeModel && modelDiscovery) {
            try {
                await modelDiscovery;
            } catch (e) { /* handled below */ }
        }

        const targetModel = requestedModel || activeModel;

        if (!targetModel) {
            return res.status(503).json({
                error: 'No working Claude model found for this API key. Please verify your Anthropic API key is active and has billing set up at console.anthropic.com.'
            });
        }

        // Sanitise input
        const sanitisedMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: String(m.content).slice(0, 8000)
        }));

        try {
            const isThinkingModel = targetModel.includes('opus-4') || targetModel.includes('3-7') || targetModel.includes('sonnet-4') || targetModel.includes('claude-4');

            const requestBody = {
                model: targetModel,
                max_tokens: MAX_TOKENS,
                cache_control: { type: 'ephemeral' },
                system: systemContent,
                messages: sanitisedMessages,
            };

            if (isThinkingModel) {
                requestBody.thinking = { type: 'adaptive' };
                requestBody.temperature = 1;
            }

            const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-beta': 'prompt-caching-2024-07-31',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await anthropicRes.json();

            if (!anthropicRes.ok) {
                const errMsg = data?.error?.message || `Anthropic API error ${anthropicRes.status}`;
                console.error(`[/api/chat] ${anthropicRes.status}: ${errMsg}`);

                // If the model 404'd at runtime (shouldn't happen after discovery), try re-discovering
                if (anthropicRes.status === 404 && errMsg.includes('model')) {
                    console.log('🔄 Model became unavailable — re-running discovery...');
                    activeModel = null;
                    modelDiscovery = discoverModel();
                    await modelDiscovery;
                    return res.status(503).json({ error: 'Model changed. Please retry your message.' });
                }

                return res.status(anthropicRes.status).json({ error: errMsg });
            }

            const textBlock = data.content?.find(c => c.type === 'text');
            const text = textBlock ? textBlock.text : '';

            const thinkingBlock = data.content?.find(c => c.type === 'thinking');
            const thinking = thinkingBlock ? thinkingBlock.thinking : null;

            if (thinking) {
                console.log(`🧠 [Thinking]: ${thinking.trim()}\n`);
            }

            // Log cache performance
            const usage = data.usage || {};
            const cacheRead = usage.cache_read_input_tokens || 0;
            const cacheMade = usage.cache_creation_input_tokens || 0;
            const inputTok = usage.input_tokens || 0;
            const outputTok = usage.output_tokens || 0;

            if (cacheRead > 0) {
                console.log(`💰 Cache HIT  — cached: ${cacheRead.toLocaleString()} | in: ${inputTok} | out: ${outputTok}`);
            } else if (cacheMade > 0) {
                console.log(`📝 Cache MISS — created: ${cacheMade.toLocaleString()} | in: ${inputTok} | out: ${outputTok}`);
            } else {
                console.log(`📨 Tokens — in: ${inputTok} | out: ${outputTok}`);
            }

            return res.json({
                text,
                thinking,
                model: targetModel,
                usage: { inputTokens: inputTok, outputTokens: outputTok, cacheRead, cacheCreated: cacheMade }
            });

        } catch (err) {
            console.error('[/api/chat] Network error:', err.message);
            return res.status(502).json({
                error: 'Unable to reach the Claude API. Check your internet connection and try again.'
            });
        }
    }
});

// ── Catch-all → SPA fallback ──────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Bootstrap ─────────────────────────────────────────────────
(async () => {
    await loadTEVReport();

    // Start model discovery (non-blocking — server starts while discovering)
    modelDiscovery = discoverModel();

    app.listen(PORT, () => {
        console.log(`✦ Aurora TEV Portal running on http://localhost:${PORT}`);
        console.log(`  PDF:   ${tevReportText ? 'loaded ✅' : 'not loaded ⚠'}`);
        console.log(`  Model: ${activeModel || 'discovering...'}`);
        console.log(`  Cache: prompt-caching-2024-07-31 ✅\n`);
    });
})();
