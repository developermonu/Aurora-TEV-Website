// Aurora Scents — STATE 7: Claude AI Chatbot — Live API Integration
// Calls Claude API directly from the browser with semantic confinement guardrails

export class ChatBot {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.messages = [];      // Chat history sent to the proxy
        this.isProcessing = false;
        this.proxyEndpoint = '/api/chat'; // Server-side proxy — API key never leaves the server

        // Cognitive guardrails — system prompt sent with every API call
        this.SYSTEM_PROMPT = `You are the elite, private corporate data intelligence agent for the Aurora Scents Executive Board. Your intelligence is anchored exclusively to the complete Phase 2 Techno-Economic Viability (TEV) Market Entry Report for India, compiled by eRoad Map Digital Solutions.

CRITICAL OPERATIONAL RULES:

1. SEMANTIC CONFINEMENT: You are strictly forbidden from utilizing outside market data, generic fragrance trends, speculative Indian economic variables, or industry assumptions not explicitly evaluated within the TEV document. Your world begins and ends with this report.

2. ABSOLUTE DATA INTEGRITY: If a question concerns market dynamics, regulatory steps, competitor volumes, or pricing variables that are omitted from the report framework, output this exact statement:
"I am explicitly trained to only reveal and evaluate insights from within the verified Aurora India TEV Framework to ensure data integrity."

3. ZERO HALLUCINATION: Do not guess, speculate, extrapolate, or approximate. Financial questions must be answered using the quantitative sensitivity matrices and product pipeline definitions in the report.

4. WHITE-SPACE ALIGNMENT: Always frame valid answers around the core thesis: India market entry is optimized via an "Accessible Premium" position using a native mobile-first D2C digital infrastructure, backed by a dual 100ml full-size + 10ml/20ml travel miniature portfolio deployment strategy.

KEY REPORT DATA FOR REFERENCE:
- HS Code: 3303.00 (Perfumes & Toilet Waters)
- Composite import duty: 38.5% (20% BCD + 10% SWS + 18% IGST)
- DG Classification: UN/NA 1266 — Class 3 Flammable Liquid (for fragrances >24% ABV)
- Default EXW: $18 USD, Exchange Rate: ₹85/USD
- Target MRP: ₹5,999 (full-size 100ml)
- Landed Cost at default: ~₹2,241
- Net Contribution Margin at default: ~₹158/unit (2.64% gross margin)
- Monthly Break-Even: ~9,485 units
- Critical EXW inflection point: $22 (margins compress below viable threshold at ₹5,999 MRP)
- 90-Day phased launch: Foundation (0–30) → Build (31–60) → Launch (61–90)
- 12 hero SKUs + miniature dual-format matrix
- Competitors: Ajmal (offline-legacy), Armaf/Sterling (value-clone), Lattafa (marketplace-dependent)
- Aurora's white-space: Accessible Premium × Native Digital D2C — unoccupied by all three competitors
- CDSCO importer registration required before customs clearance
- 3PL partner must hold Class 3 DG certification

Respond in clear, structured markdown with bold headers and bullet points. Be precise, authoritative, and brief. If a question is outside the report scope, refuse firmly and clearly.`;

        // Pre-baked strategy inquiry chips
        this.chips = [
            'What is our compliance timeline for launching?',
            'Explain how upstream cost increases alter our strategy',
            'Summarize the miniature portfolio deployment strategy',
            'What are Aurora\'s key competitive differentiators?',
            'Walk me through the 90-day launch roadmap',
            'What is the break-even analysis at default parameters?'
        ];

        this.render();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    render() {
        this.container.innerHTML = `
            <div class="chat-layout">
                <!-- Messages Area -->
                <div class="chat-messages" id="chat-messages"></div>

                <!-- Input Area -->
                <div class="chat-input-area">
                    <!-- Strategy Chips -->
                    <div class="strategy-chips" id="strategy-chips">
                        ${this.chips.map(chip => `
                            <button class="strategy-chip" data-chip="${chip}">${chip}</button>
                        `).join('')}
                    </div>

                    <!-- Input -->
                    <div class="chat-input-wrapper">
                        <textarea class="chat-input" id="chat-input" placeholder="Ask a strategic question about the TEV report..." rows="1"></textarea>
                        <button class="chat-send-btn" id="chat-send" title="Send message">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>

                    <!-- Model indicator -->
                    <div class="chat-model-badge" id="chat-model-badge">
                        <span class="model-dot"></span>
                        <span id="model-badge-text">Claude 3.5 Sonnet — Connecting...</span>
                    </div>

                    <!-- System Prompt Toggle -->
                    <div class="system-prompt-toggle" id="system-prompt-toggle">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        View System Guardrails
                    </div>
                    <div class="system-prompt-panel" id="system-prompt-panel">
                        <div class="system-prompt-content">${this.SYSTEM_PROMPT.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer = document.getElementById('chat-messages');
        this.inputEl = document.getElementById('chat-input');

        // Check server status and update badge
        this.checkServerStatus();
    }

    async checkServerStatus() {
        try {
            const res  = await fetch('/api/status');
            const data = await res.json();
            const badge = document.getElementById('model-badge-text');
            if (badge) {
                if (data.pdfLoaded) {
                    badge.textContent = `Claude 3.5 Sonnet — TEV Report Cached (${(data.wordCount || 0).toLocaleString()} words)`;
                } else {
                    badge.textContent = 'Claude 3.5 Sonnet — Live (PDF not loaded)';
                }
            }
        } catch (e) {
            const badge = document.getElementById('model-badge-text');
            if (badge) badge.textContent = 'Claude 3.5 Sonnet — Live TEV Intelligence';
        }
    }

    bindEvents() {
        document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.inputEl.addEventListener('input', () => {
            this.inputEl.style.height = 'auto';
            this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
        });

        this.container.querySelectorAll('.strategy-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.inputEl.value = chip.dataset.chip;
                this.sendMessage();
            });
        });

        document.getElementById('system-prompt-toggle').addEventListener('click', () => {
            const panel = document.getElementById('system-prompt-panel');
            panel.classList.toggle('expanded');
            const icon = document.getElementById('system-prompt-toggle').querySelector('svg');
            icon.style.transition = 'transform 0.3s ease';
            icon.style.transform = panel.classList.contains('expanded') ? 'rotate(180deg)' : '';
        });
    }

    addWelcomeMessage() {
        this.addMessage('assistant', `Welcome to the **Aurora Scents TEV Intelligence Engine** — powered by **Claude 3.5 Sonnet**.

I have been loaded with the complete **264-page TEV Report** and use Anthropic Prompt Caching — the document is cached server-side, making responses faster and more cost-efficient after the first query.

You may ask me about:
• **Regulatory & Compliance** — CDSCO registration, customs duties, DG logistics
• **Financial Modeling** — Landed costs, margins, break-even cross-referenced across chapters
• **Competitive Intelligence** — Ajmal, Armaf, Lattafa positioning analysis
• **Product Strategy** — Portfolio architecture, miniature deployment matrix
• **Launch Operations** — 90-day roadmap, milestones, dependencies

Select a pre-built strategy inquiry above, or type your question below.`);
    }

    async sendMessage() {
        const text = this.inputEl.value.trim();
        if (!text || this.isProcessing) return;

        this.addMessage('user', text);
        this.inputEl.value = '';
        this.inputEl.style.height = 'auto';

        // Add to conversation history
        this.messages.push({ role: 'user', content: text });

        this.isProcessing = true;
        this.showTyping();

        try {
            const response = await this.callClaudeAPI();
            this.hideTyping();
            this.addMessage('assistant', response);
            this.messages.push({ role: 'assistant', content: response });
        } catch (err) {
            this.hideTyping();
            console.error('Claude API error:', err);
            this.addMessage('assistant', this.buildErrorMessage(err));
            // Remove the last user message from history on error so it can be retried
            this.messages.pop();
        } finally {
            this.isProcessing = false;
        }
    }

    async callClaudeAPI() {
        // All requests go to our Express proxy — the API key stays on the server
        const response = await fetch(this.proxyEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: this.messages,
                system:   this.SYSTEM_PROMPT
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || `HTTP ${response.status}`);
        }

        return data.text || '_(No response received)_';
    }

    buildErrorMessage(err) {
        const msg = err.message || String(err);

        if (msg.includes('401') || msg.includes('authentication')) {
            return `⚠️ **Authentication Error**\n\nThe API key appears to be invalid or expired. Please contact your system administrator to update credentials.`;
        }
        if (msg.includes('429') || msg.includes('rate')) {
            return `⚠️ **Rate Limit Reached**\n\nToo many requests in a short period. Please wait a moment and try again.`;
        }
        if (msg.includes('overloaded') || msg.includes('529')) {
            return `⚠️ **API Temporarily Overloaded**\n\nThe Claude API is experiencing high demand. Please retry in a few seconds.`;
        }
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
            return `⚠️ **Network Error**\n\nUnable to reach the Claude API. This may be a CORS issue when running from a local file server — ensure the app is served over HTTP (not file://). If you see this consistently, a backend proxy may be needed.`;
        }
        return `⚠️ **API Error**\n\n${msg}\n\nPlease try again or contact support.`;
    }

    addMessage(role, content) {
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${role}`;
        const avatar = role === 'user' ? 'U' : 'AS';
        msgEl.innerHTML = `
            <div class="chat-avatar">${avatar}</div>
            <div class="chat-bubble">${this.formatContent(content)}</div>
        `;
        this.messagesContainer.appendChild(msgEl);
        this.scrollToBottom();
    }

    formatContent(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^[•☐━◆] /gm, '<span style="color:var(--accent-gold)">◆</span> ')
            .replace(/━+/g, '<hr style="border:none;border-top:1px solid var(--border-subtle);margin:8px 0">')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }

    showTyping() {
        const typing = document.createElement('div');
        typing.className = 'chat-message assistant';
        typing.id = 'typing-indicator';
        typing.innerHTML = `
            <div class="chat-avatar">AS</div>
            <div class="chat-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typing);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}
