// Aurora Scents — STATE 7: Gemini AI Chatbot — Production Client
// Communicates with Express proxy at /api/chat. API key + PDF + system prompt all live server-side.

export class ChatBot {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.messages = [];
        this.isProcessing = false;
        this.proxyEndpoint = '/api/chat';
        this.serverStatus = null;
        this.selectedModel = 'gemini-2.5-flash-lite';

        // Chips — pre-built strategy inquiries
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
        this.checkServerStatus();
    }

    render() {
        this.container.innerHTML = `
            <div class="chat-layout">
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="chat-header-title">TEV Strategy Assistant</div>
                    <button class="chat-close-btn" id="chat-close" title="Exit Chat" aria-label="Exit Chat">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <!-- Messages Area -->
                <div class="chat-messages" id="chat-messages"></div>

                <!-- Input Area -->
                <div class="chat-input-area">
                    <!-- Input -->
                    <div class="chat-input-wrapper">
                        <select id="model-selector" class="chat-model-selector-left">
                            <option value="gemini-2.5-flash-lite" selected>Gemini 2.5 Flash-Lite</option>
                        </select>
                        <textarea class="chat-input" id="chat-input" placeholder="Ask a strategic question about the TEV report..." rows="1"></textarea>
                        <button class="chat-send-btn" id="chat-send" title="Send message">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>

                    <!-- Model indicator -->
                    <div class="chat-model-badge" id="chat-model-badge">
                        <span class="model-dot" id="model-dot"></span>
                        <span id="model-badge-text">Connecting to server...</span>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer = document.getElementById('chat-messages');
        this.inputEl = document.getElementById('chat-input');
    }

    async checkServerStatus() {
        const badge = document.getElementById('model-badge-text');
        const dot   = document.getElementById('model-dot');
        const selector = document.getElementById('model-selector');

        try {
            const res  = await fetch('/api/status');
            const data = await res.json();
            this.serverStatus = data;

            // Populate selector options if available
            if (selector) {
                selector.innerHTML = '';
                
                // Add Gemini options if available
                if (data.geminiAvailable && data.geminiModels) {
                    data.geminiModels.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m;
                        opt.textContent = m === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Gemini 2.5 Flash-Lite';
                        selector.appendChild(opt);
                    });
                } else {
                    const opt1 = document.createElement('option');
                    opt1.value = 'gemini-2.5-flash-lite';
                    opt1.textContent = 'Gemini 2.5 Flash-Lite';
                    selector.appendChild(opt1);
                    const opt2 = document.createElement('option');
                    opt2.value = 'gemini-2.5-flash';
                    opt2.textContent = 'Gemini 2.5 Flash';
                    selector.appendChild(opt2);
                }

                selector.value = this.selectedModel;
            }

            if (data.status === 'ok') {
                const modelName = this.formatModelName(this.selectedModel);
                if (data.pdfLoaded) {
                    badge.textContent = `${modelName} — TEV Report Cached (${(data.wordCount || 0).toLocaleString()} words)`;
                } else {
                    badge.textContent = `${modelName} — Live (PDF not loaded)`;
                }
                dot.style.background = 'var(--accent-emerald)';
                dot.style.boxShadow  = '0 0 6px var(--accent-emerald)';
                
                if (this.messages.length === 0 && this.messagesContainer.children.length === 0) {
                    this.addWelcomeMessage(modelName, data.pdfLoaded, data.wordCount);
                }

            } else if (data.status === 'api_key_error') {
                badge.textContent = 'API Key Error — Check server configuration';
                dot.style.background = '#ef4444';
                dot.style.boxShadow  = '0 0 6px #ef4444';
                this.addMessage('assistant', `⚠️ **API Key Configuration Issue**

The server could not authenticate with the Gemini API. This means the API key is either invalid, expired, or the account needs billing setup.

**To fix this:**
1. Go to Google AI Studio or your Gemini Console.
2. Verify the key is active and has credits.
3. Update the key \`GEMINI_API_KEY\` in Hostinger Environment Variables (or the \`.env\` file).
4. Restart the server.

The TEV Report (${(data.wordCount || 0).toLocaleString()} words) is loaded and ready — just the API key needs fixing.`);

            } else {
                badge.textContent = 'Server status unknown';
                if (this.messages.length === 0 && this.messagesContainer.children.length === 0) {
                    this.addWelcomeMessage('Gemini', data.pdfLoaded, data.wordCount);
                }
            }

        } catch (e) {
            badge.textContent = 'Server offline — check that Node.js is running';
            dot.style.background = '#ef4444';
            dot.style.boxShadow  = '0 0 6px #ef4444';
            this.addMessage('assistant', `⚠️ **Cannot reach the server**

Make sure the Node.js server is running:
\`\`\`
node server.js
\`\`\`

Then refresh this page.`);
        }
    }

    formatModelName(modelId) {
        if (modelId.includes('gemini-2.5-flash-lite')) return 'Gemini 2.5 Flash-Lite';
        if (modelId.includes('gemini-2.5-flash'))      return 'Gemini 2.5 Flash';
        return modelId;
    }

    addWelcomeMessage(modelName = 'Gemini', pdfLoaded = false, wordCount = 0) {
        const pdfNote = pdfLoaded
            ? `I have been loaded with the complete **TEV Report** (~${(wordCount || 0).toLocaleString()} words) cached server-side for fast, cost-efficient responses.`
            : `_Note: The TEV Report PDF could not be loaded on the server. Responses will be based on embedded key data points._`;

        this.addMessage('assistant', `Welcome to the **Aurora Scents TEV Intelligence Engine** — powered by **${modelName}**.

${pdfNote}

You may ask me about:
• **Regulatory & Compliance** — CDSCO registration, customs duties, DG logistics
• **Financial Modeling** — Landed costs, margins, break-even cross-referenced across chapters
• **Competitive Intelligence** — Ajmal, Armaf, Lattafa positioning analysis
• **Product Strategy** — Portfolio architecture, miniature deployment matrix
• **Launch Operations** — 90-day roadmap, milestones, dependencies

Select a pre-built strategy inquiry below, or type your question below.`);

        this.renderStrategyChips();
    }

    bindEvents() {
        document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());

        const closeBtn = document.getElementById('chat-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.auroraApp) {
                    window.auroraApp.navigateTo(window.auroraApp.previousSection || 'book-viewer');
                }
            });
        }

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

        const selector = document.getElementById('model-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.selectedModel = e.target.value;
                console.log('Selected model changed to:', this.selectedModel);
                
                // Update badge indicator text
                const badge = document.getElementById('model-badge-text');
                if (this.serverStatus) {
                    const modelName = this.formatModelName(this.selectedModel);
                    if (this.serverStatus.pdfLoaded) {
                        badge.textContent = `${modelName} — TEV Report Cached (${(this.serverStatus.wordCount || 0).toLocaleString()} words)`;
                    } else {
                        badge.textContent = `${modelName} — Live (PDF not loaded)`;
                    }
                }
            });
        }
    }

    async sendMessage() {
        const text = this.inputEl.value.trim();
        if (!text || this.isProcessing) return;

        this.removeStrategyChips();

        this.addMessage('user', text);
        this.inputEl.value = '';
        this.inputEl.style.height = 'auto';

        this.messages.push({ role: 'user', content: text });

        this.isProcessing = true;
        this.showTyping();

        try {
            const response = await this.callAPI();
            this.hideTyping();
            this.addMessage('assistant', response);
            this.messages.push({ role: 'assistant', content: response });
            this.renderStrategyChips();
        } catch (err) {
            this.hideTyping();
            console.error('API error:', err);
            this.addMessage('assistant', this.buildErrorMessage(err));
            this.messages.pop();
            this.renderStrategyChips();
        } finally {
            this.isProcessing = false;
        }
    }

    async callAPI() {
        const response = await fetch(this.proxyEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: this.messages,
                model: this.selectedModel || (this.serverStatus ? this.serverStatus.model : null)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || `Server error (HTTP ${response.status})`);
        }

        return data.text || '_(No response received)_';
    }

    buildErrorMessage(err) {
        const msg = err.message || String(err);

        if (msg.includes('GEMINI_API_KEY')) {
            return `⚠️ **Server Configuration Error**\n\nThe API key is not configured on the server. Add \`GEMINI_API_KEY\` to your environment variables and restart the server.`;
        }
        if (msg.includes('401') || msg.includes('authentication') || msg.includes('auth')) {
            return `⚠️ **Authentication Error**\n\nThe API key is invalid or expired. Update it in Hostinger Environment Variables or the \`.env\` file and restart the server.`;
        }
        if (msg.includes('429') || msg.includes('rate') || msg.includes('Too many')) {
            return `⚠️ **Rate Limit Reached**\n\nToo many requests. Please wait 30 seconds and try again.`;
        }
        if (msg.includes('overloaded') || msg.includes('529')) {
            return `⚠️ **API Overloaded**\n\nThe Gemini API is experiencing high demand. Please retry in a few seconds.`;
        }
        if (msg.includes('initialising') || msg.includes('503')) {
            return `⚠️ **Server Starting Up**\n\nThe server is still loading the TEV Report. Please wait a moment and try again.`;
        }
        if (msg.includes('502') || msg.includes('Unable to reach')) {
            return `⚠️ **Network Error**\n\nThe server cannot reach the Gemini API. Check the server's internet connection.`;
        }
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
            return `⚠️ **Connection Lost**\n\nCannot reach the server. Make sure the Node.js server is running (\`node server.js\`) and refresh the page.`;
        }
        return `⚠️ **Error**\n\n${msg}\n\nPlease try again or contact your administrator.`;
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
        let formatted = text;
        
        // Regex for markdown tables
        const tableRegex = /((?:\|[^\n]+\|\r?\n?)+)/g;
        formatted = formatted.replace(tableRegex, (match) => {
            const lines = match.trim().split('\n');
            if (lines.length < 2) return match;
            
            // Check if it's a separator line like |---|---|
            const hasSeparator = lines[1].includes('|-') || lines[1].includes('-|');
            if (!hasSeparator) return match;
            
            let tableHtml = '<table class="tev-chat-table" style="width:100%; border-collapse: collapse; margin: 12px 0; border: 1px solid rgba(212,175,55,0.2); background: rgba(0,0,0,0.2); font-size: 0.85rem;">';
            
            lines.forEach((line, index) => {
                if (index === 1) return; // Skip separator line
                
                const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
                const isHeader = index === 0;
                
                tableHtml += '<tr style="' + (isHeader ? 'border-bottom: 2px solid var(--accent-gold); background: rgba(212,175,55,0.1);' : 'border-bottom: 1px solid var(--border-subtle);') + '">';
                
                cells.forEach(cell => {
                    const tag = isHeader ? 'th' : 'td';
                    const style = isHeader 
                       ? 'padding: 8px 12px; text-align: left; font-weight: 600; color: var(--accent-gold);' 
                       : 'padding: 8px 12px; text-align: left;';
                    tableHtml += `<${tag} style="${style}">${cell}</${tag}>`;
                });
                
                tableHtml += '</tr>';
            });
            
            tableHtml += '</table>';
            return tableHtml;
        });

        return formatted
            .replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;overflow-x:auto;font-size:0.82rem"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.2);padding:1px 5px;border-radius:3px;font-size:0.85em">$1</code>')
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

    removeStrategyChips() {
        const existingContainer = this.messagesContainer.querySelector('.chat-strategy-chips-container');
        if (existingContainer) {
            existingContainer.remove();
        }
    }

    renderStrategyChips() {
        this.removeStrategyChips();

        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'chat-strategy-chips-container strategy-chips';
        chipsContainer.innerHTML = this.chips.map(chip => `
            <button class="strategy-chip" data-chip="${chip}">${chip}</button>
        `).join('');

        chipsContainer.querySelectorAll('.strategy-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.inputEl.value = chip.dataset.chip;
                this.sendMessage();
            });
        });

        this.messagesContainer.appendChild(chipsContainer);
        this.scrollToBottom();
    }
}
