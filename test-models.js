/**
 * Model Discovery Script — finds which Claude models your API key can access
 */
require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.ANTHROPIC_API_KEY;

const MODELS_TO_TEST = [
    // Claude 4 / Opus 4 / Sonnet 4
    'claude-opus-4-6',
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-5-20250514',
    
    // Claude 3.5 Sonnet variants
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-5-sonnet-v2-20241022',
    
    // Claude 3.5 Haiku
    'claude-3-5-haiku-latest',
    'claude-3-5-haiku-20241022',
    
    // Claude 3 variants
    'claude-3-opus-latest',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    
    // Aliases
    'claude-3-5-sonnet',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
];

async function testModel(model) {
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type':      'application/json',
                'x-api-key':         API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Say OK' }],
            }),
        });

        const data = await res.json();
        
        if (res.ok) {
            const tokens = data.usage?.input_tokens || '?';
            return { model, status: '✅ WORKS', code: res.status, tokens };
        } else {
            const errType = data?.error?.type || 'unknown';
            const errMsg  = data?.error?.message || '';
            return { model, status: '❌ FAIL', code: res.status, error: `${errType}: ${errMsg.slice(0, 80)}` };
        }
    } catch (e) {
        return { model, status: '❌ ERROR', code: 0, error: e.message };
    }
}

(async () => {
    console.log(`\nAPI Key: ${API_KEY.slice(0, 20)}...${API_KEY.slice(-6)}`);
    console.log(`Testing ${MODELS_TO_TEST.length} model strings...\n`);
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
        console.log('\n⚠️  No models worked. Check if your API key is valid and has credits.\n');
    }
})();
