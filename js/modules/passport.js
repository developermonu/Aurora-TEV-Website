// Aurora Scents — STATE 1: Passport Confidentiality Shield
// Full-screen frosted glass authentication gate

export class PassportShield {

    constructor({ onAuthenticated }) {
        this.onAuthenticated = onAuthenticated;
        this.TOKEN = 'AuroraScents#IndiaPhase2TEV!2026';
        this.attempts = 0;

        this.shield = document.getElementById('passport-shield');
        this.input = document.getElementById('passport-token');
        this.submitBtn = document.getElementById('passport-submit');
        this.errorMsg = document.getElementById('passport-error');

        if (!this.shield || !this.input) return;

        this.bindEvents();
    }

    bindEvents() {
        // Submit button click
        this.submitBtn.addEventListener('click', () => this.validate());

        // Enter key on input
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.validate();
            }
        });

        // Clear error on typing
        this.input.addEventListener('input', () => {
            this.input.classList.remove('error');
            this.errorMsg.classList.remove('visible');
        });
    }

    validate() {
        const value = this.input.value.trim();

        if (value === this.TOKEN) {
            this.onSuccess();
        } else {
            this.onFailure();
        }
    }

    onSuccess() {
        // Visual success feedback
        this.input.style.borderBottomColor = '#10B981';
        this.input.disabled = true;
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'ACCESS GRANTED';
        this.submitBtn.style.borderColor = '#10B981';
        this.submitBtn.style.color = '#10B981';

        // Trigger portal reveal after brief pause
        setTimeout(() => {
            this.onAuthenticated();
        }, 600);
    }

    onFailure() {
        this.attempts++;
        this.input.classList.add('error');
        this.errorMsg.classList.add('visible');

        // Escalating error messages
        if (this.attempts >= 3) {
            this.errorMsg.textContent = 'Multiple failed attempts detected. Contact administrator.';
        } else {
            this.errorMsg.textContent = 'Access Denied — Invalid Credentials';
        }

        // Shake and refocus
        setTimeout(() => {
            this.input.focus();
            this.input.select();
        }, 500);
    }
}
