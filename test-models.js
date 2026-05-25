/**
 * Model Discovery Script — finds which Gemini models your API key can access
 */
require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.GEMINI_API_KEY;

const MODELS_TO_TEST = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
];

async function testModel(model) {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }]
            }),
        });

        const data = await res.json();
        
        if (res.ok) {
            const tokens = data.usageMetadata?.promptTokenCount || '?';
            return { model, status: '✅ WORKS', code: res.status, tokens };
        } else {
            const errType = data?.error?.status || 'unknown';
            const errMsg  = data?.error?.message || '';
            return { model, status: '❌ FAIL', code: res.status, error: `${errType}: ${errMsg.slice(0, 80)}` };
        }
    } catch (e) {
        return { model, status: '❌ ERROR', code: 0, error: e.message };
    }
}

(async () => {
    if (!API_KEY) {
        console.error('❌ Error: GEMINI_API_KEY is not set in your environment or .env file.');
        process.exit(1);
    }
    console.log(`\nAPI Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
    console.log(`Testing ${MODELS_TO_TEST.length} Gemini model strings...\n`);
    console.log('─'.repeat(90));

    const working = [];

    for (const model of MODELS_TO_TEST) {
        process.stdout.write(`  Testing ${model.padEnd(40)}`);
        const result = await testModel(model);
        console.log(`${result.status}  (HTTP ${result.code})${result.error ? '  ' + result.error : ''}`);
        if (result.status === '✅ WORKS') working.push(model);
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('─'.repeat(90));
    
    if (working.length > 0) {
        console.log(`\n✅ Working models (${working.length}):`);
        working.forEach(m => console.log(`   → ${m}`));
        console.log(`\n🏆 Recommended for server.js: ${working[0]}\n`);
    } else {
        console.log('\n⚠️  No models worked. Check if your API key is valid and active.\n');
    }
})();
