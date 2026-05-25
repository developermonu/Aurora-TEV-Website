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

// ── Model config ─────────────────────────────────────────────
const MAX_TOKENS = 2048;
const PDF_PATH = path.join(__dirname, 'TEV Report.pdf');

// ── Runtime state ─────────────────────────────────────────────
let tevReportText = null;
let systemContent = null;
let pdfLoadError = null;

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
    const geminiKey = process.env.GEMINI_API_KEY;
    res.json({
        status: geminiKey ? 'ok' : 'api_key_error',
        model: 'gemini-2.5-flash-lite',
        pdfLoaded: !!tevReportText,
        pdfError: pdfLoadError || null,
        wordCount: tevReportText ? tevReportText.split(/\s+/).length : 0,
        caching: 'enabled',
        apiKeyValid: !!geminiKey,
        geminiAvailable: !!geminiKey,
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

// ── POST /api/chat — Gemini API Proxy ─────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
    const { messages, model: requestedModel } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Invalid request: messages array is required.' });
    }

    const targetModel = requestedModel || 'gemini-2.5-flash-lite';
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
        const cacheName = await getOrCreateGeminiCache(targetModel);

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

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${geminiKey}`, {
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
            model: targetModel,
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
});

// ── Catch-all → SPA fallback ──────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Bootstrap ─────────────────────────────────────────────────
(async () => {
    await loadTEVReport();

    app.listen(PORT, () => {
        console.log(`✦ Aurora TEV Portal running on http://localhost:${PORT}`);
        console.log(`  PDF:    ${tevReportText ? 'loaded ✅' : 'not loaded ⚠'}`);
        console.log(`  Engine: Gemini 2.5 Live ✅\n`);
    });
})();
