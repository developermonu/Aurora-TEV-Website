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

        // --- Layer 1: Initial Paper Snap ---
        const snapBuffer = this.createSnapBuffer();
        const snapSource = this.audioCtx.createBufferSource();
        snapSource.buffer = snapBuffer;

        const snapFilter = this.audioCtx.createBiquadFilter();
        snapFilter.type = 'highpass';
        snapFilter.frequency.value = 2000;

        const snapGain = this.audioCtx.createGain();
        snapGain.gain.value = 0.4;

        snapSource.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(this.masterGain);
        snapSource.start(now);

        // --- Layer 2: Paper Rustle (main body) ---
        const rustleBuffer = this.createNoiseBuffer(0.25);
        const rustleSource = this.audioCtx.createBufferSource();
        rustleSource.buffer = rustleBuffer;

        const rustleFilter = this.audioCtx.createBiquadFilter();
        rustleFilter.type = 'bandpass';
        rustleFilter.frequency.value = 3500;
        rustleFilter.Q.value = 0.8;

        const rustleGain = this.audioCtx.createGain();
        rustleGain.gain.setValueAtTime(0, now);
        rustleGain.gain.linearRampToValueAtTime(0.5, now + 0.02);
        rustleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        rustleSource.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(this.masterGain);
        rustleSource.start(now + 0.01);

        // --- Layer 3: Settling Thud ---
        const thudBuffer = this.createNoiseBuffer(0.08);
        const thudSource = this.audioCtx.createBufferSource();
        thudSource.buffer = thudBuffer;

        const thudFilter = this.audioCtx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.value = 400;

        const thudGain = this.audioCtx.createGain();
        thudGain.gain.setValueAtTime(0.3, now + 0.2);
        thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        thudSource.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(this.masterGain);
        thudSource.start(now + 0.2);

        // Cleanup
        setTimeout(() => {
            snapSource.disconnect();
            rustleSource.disconnect();
            thudSource.disconnect();
        }, 500);
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
