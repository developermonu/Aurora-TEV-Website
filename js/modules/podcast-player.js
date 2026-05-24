// Aurora Scents — STATE 3: Chapter Audio Podcast Player
// Split viewport with metrics blocks and custom HTML5 audio player

export class PodcastPlayer {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.currentTrack = 0;
        this.isPlaying = false;
        this.audioCtx = null;
        this.analyser = null;
        this.canvasAnimFrame = null;

        // Chapter data representing TEV report chapters
        this.chapters = [
            { num: 1, title: 'Executive Summary & Strategic Overview', duration: '12:34', durationSec: 754 },
            { num: 2, title: 'India Fragrance Market Landscape', duration: '18:45', durationSec: 1125 },
            { num: 3, title: 'Regulatory & Compliance Framework', duration: '14:22', durationSec: 862 },
            { num: 4, title: 'CDSCO Registration & Import Protocol', duration: '11:08', durationSec: 668 },
            { num: 5, title: 'Competitive Intelligence Analysis', duration: '16:51', durationSec: 1011 },
            { num: 6, title: 'Aurora Brand Architecture & DNA', duration: '09:33', durationSec: 573 },
            { num: 7, title: 'Product Portfolio & SKU Strategy', duration: '15:17', durationSec: 917 },
            { num: 8, title: 'Miniature Trial Gateway Framework', duration: '08:42', durationSec: 522 },
            { num: 9, title: 'D2C Digital Infrastructure Blueprint', duration: '13:29', durationSec: 809 },
            { num: 10, title: 'Supply Chain & DG Logistics', duration: '17:06', durationSec: 1026 },
            { num: 11, title: 'Consumer Psychology & Buyer Personas', duration: '11:55', durationSec: 715 },
            { num: 12, title: 'Digital Marketing & CAC Strategy', duration: '14:48', durationSec: 888 },
            { num: 13, title: 'Launch Timeline & Milestones', duration: '10:21', durationSec: 621 },
            { num: 14, title: 'Financial Sensitivity Modeling', duration: '19:33', durationSec: 1173 },
            { num: 15, title: 'Unit Economics & Margin Analysis', duration: '16:14', durationSec: 974 },
            { num: 16, title: 'Risk Assessment & Mitigation', duration: '12:07', durationSec: 727 },
            { num: 17, title: 'Operational Roadmap (90-Day)', duration: '13:45', durationSec: 825 },
            { num: 18, title: 'KPI Framework & Success Metrics', duration: '09:18', durationSec: 558 },
            { num: 19, title: 'Strategic Recommendations & Next Steps', duration: '11:42', durationSec: 702 }
        ];

        this.currentTime = 0;
        this.playInterval = null;

        this.render();
        this.bindEvents();
    }

    render() {
        const totalDuration = this.chapters.reduce((sum, ch) => sum + ch.durationSec, 0);
        const totalMin = Math.floor(totalDuration / 60);
        const totalHrs = Math.floor(totalMin / 60);
        const remainMin = totalMin % 60;

        const ch = this.chapters[this.currentTrack];

        this.container.innerHTML = `
            <div class="podcast-layout">
                <!-- Left: Metrics -->
                <div class="podcast-metrics">
                    <div class="metric-card">
                        <div class="metric-label">Total Chapters</div>
                        <div class="metric-value">${this.chapters.length}</div>
                        <div class="metric-detail">Comprehensive TEV Report Coverage</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Total Runtime</div>
                        <div class="metric-value">${totalHrs}h ${remainMin}m</div>
                        <div class="metric-detail">${totalDuration.toLocaleString()} seconds of executive briefing</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Current Chapter</div>
                        <div class="metric-value" id="current-chapter-display" style="font-size: 1.5rem;">${ch.title}</div>
                        <div class="metric-detail">Chapter ${ch.num} of ${this.chapters.length}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Chapters Covered</div>
                        <div class="metric-value" style="color: var(--accent-emerald);">—</div>
                        <div class="metric-detail">Track your progress through the report</div>
                    </div>

                    <!-- Track List -->
                    <div style="background: var(--gradient-card); border: 1px solid var(--border-subtle); border-radius: var(--border-radius-lg); padding: 16px;">
                        <div style="font-size: 0.68rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">Chapter Index</div>
                        <div class="track-list" id="track-list">
                            ${this.chapters.map((ch, i) => `
                                <div class="track-item ${i === this.currentTrack ? 'active' : ''}" data-track="${i}">
                                    <span class="track-num">${String(ch.num).padStart(2, '0')}</span>
                                    <span style="flex:1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ch.title}</span>
                                    <span class="track-duration">${ch.duration}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right: Audio Player -->
                <div class="audio-player-container">
                    <div class="player-track-info">
                        <div class="track-chapter" id="player-chapter-label">Chapter ${ch.num}</div>
                        <div class="track-title" id="player-track-title">${ch.title}</div>
                    </div>

                    <!-- Waveform visualization -->
                    <canvas class="player-waveform" id="player-waveform" width="600" height="64"></canvas>

                    <!-- Seek bar -->
                    <div class="player-seek-container">
                        <input type="range" class="player-seek" id="player-seek" min="0" max="${ch.durationSec}" value="0" step="1">
                        <div class="player-times">
                            <span id="player-time-current">0:00</span>
                            <span id="player-time-total">${ch.duration}</span>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div class="player-controls">
                        <button class="player-btn" id="player-prev" title="Previous chapter">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                        </button>
                        <button class="player-btn" id="player-skip-back" title="Rewind 15s">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><text x="12" y="16" font-size="8" fill="currentColor" text-anchor="middle" style="font-family:var(--font-sans)">15</text></svg>
                        </button>
                        <button class="player-btn player-btn-play" id="player-play" title="Play / Pause">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" id="play-icon"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                        <button class="player-btn" id="player-skip-fwd" title="Forward 15s">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/><text x="12" y="16" font-size="8" fill="currentColor" text-anchor="middle" style="font-family:var(--font-sans)">15</text></svg>
                        </button>
                        <button class="player-btn" id="player-next" title="Next chapter">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                        </button>
                    </div>

                    <!-- Volume & Speed -->
                    <div class="player-extras">
                        <div class="volume-control">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            <input type="range" class="volume-slider" id="player-volume" min="0" max="100" value="80" title="Volume">
                        </div>

                        <select class="speed-selector" id="player-speed" title="Playback speed">
                            <option value="0.75">0.75×</option>
                            <option value="1" selected>1.0×</option>
                            <option value="1.25">1.25×</option>
                            <option value="1.5">1.5×</option>
                            <option value="2">2.0×</option>
                        </select>
                    </div>

                    <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--border-radius-md); text-align: center;">
                        <p style="font-size: 0.75rem; color: var(--text-muted);">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Audio briefings simulate chapter narration. Connect actual audio files for production deployment.
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Draw initial waveform
        this.drawWaveform();
    }

    bindEvents() {
        // Play/Pause toggle
        document.getElementById('player-play').addEventListener('click', () => this.togglePlay());

        // Skip controls
        document.getElementById('player-skip-back').addEventListener('click', () => this.skipTime(-15));
        document.getElementById('player-skip-fwd').addEventListener('click', () => this.skipTime(15));

        // Next/Prev
        document.getElementById('player-prev').addEventListener('click', () => this.changeTrack(-1));
        document.getElementById('player-next').addEventListener('click', () => this.changeTrack(1));

        // Seek bar
        document.getElementById('player-seek').addEventListener('input', (e) => {
            this.currentTime = parseInt(e.target.value);
            this.updateTimeDisplay();
        });

        // Speed selector
        document.getElementById('player-speed').addEventListener('change', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
        });

        // Track list clicks
        const trackItems = this.container.querySelectorAll('.track-item');
        trackItems.forEach(item => {
            item.addEventListener('click', () => {
                const trackIdx = parseInt(item.dataset.track);
                this.currentTrack = trackIdx;
                this.currentTime = 0;
                this.updateTrackDisplay();
            });
        });
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const icon = document.getElementById('play-icon');

        if (this.isPlaying) {
            icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

            // Simulate playback progression
            this.playInterval = setInterval(() => {
                const speed = parseFloat(document.getElementById('player-speed').value) || 1;
                this.currentTime += speed;
                const maxTime = this.chapters[this.currentTrack].durationSec;

                if (this.currentTime >= maxTime) {
                    // Auto-advance to next chapter
                    if (this.currentTrack < this.chapters.length - 1) {
                        this.currentTrack++;
                        this.currentTime = 0;
                        this.updateTrackDisplay();
                    } else {
                        this.currentTime = maxTime;
                        this.togglePlay();
                    }
                }

                document.getElementById('player-seek').value = this.currentTime;
                this.updateTimeDisplay();
                this.drawWaveform();
            }, 1000);
        } else {
            icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
            clearInterval(this.playInterval);
        }
    }

    skipTime(delta) {
        const maxTime = this.chapters[this.currentTrack].durationSec;
        this.currentTime = Math.max(0, Math.min(maxTime, this.currentTime + delta));
        document.getElementById('player-seek').value = this.currentTime;
        this.updateTimeDisplay();
    }

    changeTrack(delta) {
        const newTrack = this.currentTrack + delta;
        if (newTrack < 0 || newTrack >= this.chapters.length) return;

        this.currentTrack = newTrack;
        this.currentTime = 0;
        this.updateTrackDisplay();
    }

    updateTrackDisplay() {
        const ch = this.chapters[this.currentTrack];

        document.getElementById('player-chapter-label').textContent = `Chapter ${ch.num}`;
        document.getElementById('player-track-title').textContent = ch.title;
        document.getElementById('player-seek').max = ch.durationSec;
        document.getElementById('player-seek').value = this.currentTime;
        document.getElementById('player-time-total').textContent = ch.duration;
        document.getElementById('current-chapter-display').textContent = ch.title;

        this.updateTimeDisplay();

        // Update track list active state
        const trackItems = this.container.querySelectorAll('.track-item');
        trackItems.forEach((item, i) => {
            item.classList.toggle('active', i === this.currentTrack);
        });

        this.drawWaveform();
    }

    updateTimeDisplay() {
        const mins = Math.floor(this.currentTime / 60);
        const secs = Math.floor(this.currentTime % 60);
        document.getElementById('player-time-current').textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    drawWaveform() {
        const canvas = document.getElementById('player-waveform');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const ch = this.chapters[this.currentTrack];
        const progress = this.currentTime / ch.durationSec;
        const barCount = 80;
        const barWidth = w / barCount - 1;

        // Seed pseudo-random bars based on chapter number for consistency
        const seed = ch.num * 17;

        for (let i = 0; i < barCount; i++) {
            const pseudo = Math.abs(Math.sin(seed + i * 0.7) * Math.cos(i * 0.3 + seed)) * 0.8 + 0.2;
            const barH = pseudo * (h - 8);
            const x = i * (barWidth + 1);
            const y = (h - barH) / 2;

            const isPast = (i / barCount) <= progress;

            ctx.fillStyle = isPast
                ? 'rgba(212, 175, 55, 0.8)'
                : 'rgba(255, 255, 255, 0.12)';

            ctx.fillRect(x, y, barWidth, barH);
        }
    }
}
