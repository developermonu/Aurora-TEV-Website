/**
 * Aurora Scents TEV Executive Portal — Node.js/Express Server
 * ─────────────────────────────────────────────────────────────
 * • Serves the static frontend
 * • Loads TEV Report.pdf at startup and extracts full text
 * • Proxies /api/chat → Anthropic Claude 3.5 Sonnet (Latest)
 * • Uses Anthropic Prompt Caching: cached PDF content costs 10%
 *   of normal input price after the first API call per session
 */

'use strict';

require('dotenv').config();

const express   = require('express');
const fetch     = require('node-fetch');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const pdf       = require('pdf-parse');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Model config ──────────────────────────────────────────────
const CLAUDE_MODEL   = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS     = 2048;
const PDF_PATH       = path.join(__dirname, 'TEV Report.pdf');

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

// ── Runtime state: PDF content for caching ────────────────────
let tevReportText  = null;   // Extracted PDF text
let systemContent  = null;   // Anthropic system content array (with cache_control)
let pdfLoadError   = null;

// ── Load and parse PDF at startup ─────────────────────────────
async function loadTEVReport() {
    try {
        if (!fs.existsSync(PDF_PATH)) {
            pdfLoadError = 'TEV Report.pdf not found in project root.';
            console.warn(`⚠  ${pdfLoadError}`);
            // Fall back to guardrails-only system
            buildSystemContent('');
            return;
        }

        console.log('📄 Loading TEV Report.pdf...');
        const dataBuffer = fs.readFileSync(PDF_PATH);
        const parsed     = await pdf(dataBuffer, {
            // Limit to first 200 pages to stay within practical token limits
            max: 200
        });

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

// ── Build Anthropic system content array with cache_control ───
function buildSystemContent(reportText) {
    if (reportText && reportText.trim().length > 0) {
        // Two-block system: guardrails + full report text (cached)
        // The cache_control on the second block caches BOTH blocks together
        systemContent = [
            {
                type: 'text',
                text: SYSTEM_GUARDRAILS
            },
            {
                type: 'text',
                text: `COMPLETE TEV REPORT CONTENT:\n\n${reportText.trim()}`,
                cache_control: { type: 'ephemeral' }  // ← Anthropic Prompt Cache
            }
        ];
        console.log('🔒 Prompt caching enabled — TEV report will be cached after first API call');
    } else {
        // Fallback: guardrails only, no PDF content
        systemContent = [
            {
                type: 'text',
                text: SYSTEM_GUARDRAILS + '\n\n[NOTE: The TEV report PDF could not be loaded. Answer based on your built-in knowledge of the TEV framework only.]',
                cache_control: { type: 'ephemeral' }
            }
        ];
        console.warn('⚠  Running without PDF content — guardrails-only mode');
    }
}

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc:    ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc:     ["'self'", "fonts.gstatic.com"],
            connectSrc:  ["'self'"],
            imgSrc:      ["'self'", "data:", "blob:"],
            workerSrc:   ["'self'", "blob:", "cdnjs.cloudflare.com"],
            frameSrc:    ["'none'"],
            objectSrc:   ["'none'"],
        }
    }
}));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin, methods: ['GET', 'POST'] }));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// ── Rate limiter for chat endpoint ───────────────────────────
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
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

// ── GET /api/status — health + PDF load status ────────────────
app.get('/api/status', (req, res) => {
    res.json({
        status:      'ok',
        model:       CLAUDE_MODEL,
        pdfLoaded:   !!tevReportText,
        pdfError:    pdfLoadError || null,
        wordCount:   tevReportText ? tevReportText.split(/\s+/).length : 0,
        caching:     'enabled'
    });
});

// ── POST /api/chat — Claude 3.5 Sonnet proxy with caching ─────
app.post('/api/chat', chatLimiter, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: ANTHROPIC_API_KEY is not set.' });
    }

    if (!systemContent) {
        return res.status(503).json({ error: 'Server is still initialising. Please try again in a moment.' });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Invalid request: messages array required.' });
    }

    // Sanitise messages — only role/content string pairs, cap length
    const sanitisedMessages = messages.map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content).slice(0, 8000)
    }));

    try {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type':      'application/json',
                'x-api-key':         apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta':    'prompt-caching-2024-07-31',   // ← Enable caching
            },
            body: JSON.stringify({
                model:      CLAUDE_MODEL,
                max_tokens: MAX_TOKENS,
                system:     systemContent,   // Array with cache_control
                messages:   sanitisedMessages,
            }),
        });

        const data = await anthropicResponse.json();

        if (!anthropicResponse.ok) {
            const errMsg = data?.error?.message || `Anthropic API error ${anthropicResponse.status}`;
            console.error(`[/api/chat] API error ${anthropicResponse.status}:`, errMsg);
            return res.status(anthropicResponse.status).json({ error: errMsg });
        }

        const text = data.content?.[0]?.text ?? '';

        // Log cache performance (visible in server terminal)
        const usage = data.usage || {};
        const cacheRead    = usage.cache_read_input_tokens    || 0;
        const cacheCreated = usage.cache_creation_input_tokens || 0;
        const inputTokens  = usage.input_tokens               || 0;
        const outputTokens = usage.output_tokens              || 0;

        if (cacheRead > 0) {
            console.log(`💰 Cache HIT  — cached: ${cacheRead.toLocaleString()} | input: ${inputTokens} | output: ${outputTokens} (saved ~90% on ${cacheRead.toLocaleString()} tokens)`);
        } else if (cacheCreated > 0) {
            console.log(`📝 Cache MISS — created: ${cacheCreated.toLocaleString()} | input: ${inputTokens} | output: ${outputTokens} (next calls will use cache)`);
        } else {
            console.log(`📨 Tokens — input: ${inputTokens} | output: ${outputTokens}`);
        }

        return res.json({
            text,
            usage: { inputTokens, outputTokens, cacheRead, cacheCreated }
        });

    } catch (err) {
        console.error('[/api/chat] Fetch error:', err.message);
        return res.status(502).json({ error: 'Unable to reach the Claude API. Please try again.' });
    }
});

// ── Catch-all → SPA fallback ──────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Bootstrap: load PDF then start listening ──────────────────
loadTEVReport().then(() => {
    app.listen(PORT, () => {
        console.log(`\n✦ Aurora TEV Portal running on http://localhost:${PORT}`);
        console.log(`  Model:  ${CLAUDE_MODEL}`);
        console.log(`  PDF:    ${tevReportText ? 'loaded ✅' : 'not loaded ⚠'}`);
        console.log(`  Cache:  prompt-caching-2024-07-31 ✅\n`);
    });
});
