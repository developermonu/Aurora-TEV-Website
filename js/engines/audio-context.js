// Aurora Scents — Web Audio Context Engine
// Procedural paper-flip sound synthesis & audio pipeline management

export class AudioContextEngine {

    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.isEnabled = true;
        this.volume = 0.6;
        this.isInitialized = false;
    }

    /**
     * Initialize the AudioContext (must be called from a user gesture)
     */
    init() {
        if (this.isInitialized) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioCtx.destination);
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Resume audio context if suspended (browsers require user gesture)
     */
    async resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        }
    }

    /**
     * Toggle sound effects on/off
     */
    toggleSound() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    /**
     * Generate filtered white noise buffer for paper rustle simulation
     * @param {number} duration - Duration in seconds
     * @returns {AudioBuffer}
     */
    createNoiseBuffer(duration = 0.15) {
        const sampleRate = this.audioCtx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate shaped noise that mimics paper friction
        let lastValue = 0;
        for (let i = 0; i < length; i++) {
            const t = i / length;
            // Envelope: quick attack, sustained mid, gentle decay
            let envelope;
            if (t < 0.05) {
                envelope = t / 0.05; // 5% attack
            } else if (t < 0.4) {
                envelope = 1.0; // sustained
            } else {
                envelope = 1.0 - ((t - 0.4) / 0.6); // 60% decay
            }

            // Brown noise (smoother, more paper-like than white noise)
            const white = Math.random() * 2 - 1;
            lastValue = (lastValue + (0.02 * white)) / 1.02;
            data[i] = lastValue * 3.5 * envelope;
        }

        return buffer;
    }

    /**
     * Create a crisp paper snap/click buffer
     * @returns {AudioBuffer}
     */
    createSnapBuffer() {
        const sampleRate = this.audioCtx.sampleRate;
        const duration = 0.04;
        const length = sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / length;
            // Sharp transient with rapid exponential decay
            const envelope = Math.exp(-t * 30);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
        }

        return buffer;
    }

    /**
     * Trigger the complete mechanical page flip sound
     * Combines: initial snap + sustained rustle + settling thud
     */
    triggerMechanicalFlipSound() {
        if (!this.isEnabled || !this.isInitialized) return;
        this.resume();

        const now = this.audioCtx.currentTime;

        // --- Layer 1: Lift & Whoosh (Friction of page lifting through the air) ---
        // Duration ~0.45s, sweeping bandpass filter for movement / Doppler effect
        const whooshBuffer = this.createNoiseBuffer(0.45);
        const whooshSource = this.audioCtx.createBufferSource();
        whooshSource.buffer = whooshBuffer;

        const whooshFilter = this.audioCtx.createBiquadFilter();
        whooshFilter.type = 'bandpass';
        whooshFilter.Q.value = 1.2;
        // Sweep frequency: 500Hz -> 1400Hz -> 800Hz
        whooshFilter.frequency.setValueAtTime(500, now);
        whooshFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
        whooshFilter.frequency.exponentialRampToValueAtTime(800, now + 0.45);

        const whooshGain = this.audioCtx.createGain();
        whooshGain.gain.setValueAtTime(0, now);
        whooshGain.gain.linearRampToValueAtTime(0.35, now + 0.12);
        whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        whooshSource.connect(whooshFilter);
        whooshFilter.connect(whooshGain);
        whooshGain.connect(this.masterGain);
        whooshSource.start(now);

        // --- Layer 2: Paper Bending Crackles (Tension of paper fibers) ---
        // Triggers 3 micro-snaps in sequence as the page curves
        const snapTimes = [0.06, 0.16, 0.28];
        const snapSources = [];
        snapTimes.forEach((delay, idx) => {
            const snapBuffer = this.createSnapBuffer();
            const snapSource = this.audioCtx.createBufferSource();
            snapSource.buffer = snapBuffer;

            const snapFilter = this.audioCtx.createBiquadFilter();
            snapFilter.type = 'highpass';
            // Vary frequency slightly for natural variation
            snapFilter.frequency.value = 2400 - (idx * 300);

            const snapGain = this.audioCtx.createGain();
            // Vary gain for depth
            snapGain.gain.value = 0.28 - (idx * 0.05);

            snapSource.connect(snapFilter);
            snapFilter.connect(snapGain);
            snapGain.connect(this.masterGain);
            snapSource.start(now + delay);
            snapSources.push(snapSource);
        });

        // --- Layer 3: Paper Rustle (Friction of page body) ---
        const rustleBuffer = this.createNoiseBuffer(0.35);
        const rustleSource = this.audioCtx.createBufferSource();
        rustleSource.buffer = rustleBuffer;

        const rustleFilter = this.audioCtx.createBiquadFilter();
        rustleFilter.type = 'highpass';
        rustleFilter.frequency.value = 3200;

        const rustleGain = this.audioCtx.createGain();
        rustleGain.gain.setValueAtTime(0, now + 0.04);
        rustleGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
        rustleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

        rustleSource.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(this.masterGain);
        rustleSource.start(now + 0.04);

        // --- Layer 4: Page Landing "Slap" & Air Push ---
        // Dull thud (low frequency) + air release (high frequency) at ~0.48s
        const landingDelay = 0.44;

        // A. Low-frequency thud
        const thudBuffer = this.createNoiseBuffer(0.12);
        const thudSource = this.audioCtx.createBufferSource();
        thudSource.buffer = thudBuffer;

        const thudFilter = this.audioCtx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.value = 160;

        const thudGain = this.audioCtx.createGain();
        thudGain.gain.setValueAtTime(0, now + landingDelay);
        thudGain.gain.linearRampToValueAtTime(0.55, now + landingDelay + 0.01);
        thudGain.gain.exponentialRampToValueAtTime(0.005, now + landingDelay + 0.12);

        thudSource.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(this.masterGain);
        thudSource.start(now + landingDelay);

        // B. High-frequency air whisper
        const airBuffer = this.createNoiseBuffer(0.08);
        const airSource = this.audioCtx.createBufferSource();
        airSource.buffer = airBuffer;

        const airFilter = this.audioCtx.createBiquadFilter();
        airFilter.type = 'bandpass';
        airFilter.frequency.value = 4500;
        airFilter.Q.value = 0.6;

        const airGain = this.audioCtx.createGain();
        airGain.gain.setValueAtTime(0, now + landingDelay);
        airGain.gain.linearRampToValueAtTime(0.15, now + landingDelay + 0.005);
        airGain.gain.exponentialRampToValueAtTime(0.005, now + landingDelay + 0.08);

        airSource.connect(airFilter);
        airFilter.connect(airGain);
        airGain.connect(this.masterGain);
        airSource.start(now + landingDelay);

        // Cleanup
        setTimeout(() => {
            whooshSource.disconnect();
            snapSources.forEach(s => s.disconnect());
            rustleSource.disconnect();
            thudSource.disconnect();
            airSource.disconnect();
        }, 1000);
    }

    /**
     * Destroy the audio context
     */
    destroy() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
            this.isInitialized = false;
        }
    }
}
