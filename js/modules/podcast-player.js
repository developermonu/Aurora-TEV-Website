// Aurora Scents — Podcast Player v3
// Desktop: 3-column landscape (Playlist | Cover+Info | Controls)
// Mobile:  Vertical stack with playlist as slide-up drawer

export class PodcastPlayer {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.currentTrack = 0;
        this.isPlaying = false;
        this.playlistOpen = false;
        this.playbackRate = 1.0;
        this.waveAnimFrame = null;
        this.audio = null;

        this.chapters = [
            { num: 1,  title: 'Executive Summary & Strategic Overview',    src: 'Podcasts/Podcast Audio Files/chapter_1.mp3',  cover: 'Podcasts/Cover Images/chapter 1.png', hasCover: true  },
            { num: 2,  title: 'Study Background, Scope & Methodology',      src: 'Podcasts/Podcast Audio Files/Chapter_2.mp3',  cover: 'Podcasts/Cover Images/chapter 2.png', hasCover: true  },
            { num: 3,  title: 'India Fragrance Market Overview',            src: 'Podcasts/Podcast Audio Files/Chapter_3.mp3',  cover: 'Podcasts/Cover Images/chapter 3.png', hasCover: true  },
            { num: 4,  title: 'Market Opportunity Assessment',              src: 'Podcasts/Podcast Audio Files/chapter_4.mp3',  cover: 'Podcasts/Cover Images/chapter 4.png', hasCover: true  },
            { num: 5,  title: 'Consumer Insights & Demand Analysis',        src: 'Podcasts/Podcast Audio Files/chapter_5.mp3',  cover: 'Podcasts/Cover Images/chapter 5.png', hasCover: true  },
            { num: 6,  title: 'Competitive Landscape & Benchmarking',       src: 'Podcasts/Podcast Audio Files/chapter_6.mp3',  cover: 'Podcasts/Cover Images/chapter 6.png', hasCover: true  },
            { num: 7,  title: 'Aurora Portfolio Assessment & Positioning',  src: 'Podcasts/Podcast Audio Files/chapter_7.mp3',  cover: 'Podcasts/Cover Images/Chapter 7.png', hasCover: true  },
            { num: 8,  title: 'Product Strategy for India Market Entry',    src: 'Podcasts/Podcast Audio Files/chapter_8.mp3',  cover: 'Podcasts/Cover Images/Chapter 8.png', hasCover: true  },
            { num: 9,  title: 'Pricing Strategy & Value Architecture',      src: 'Podcasts/Podcast Audio Files/chapter_9.mp3',  cover: 'Podcasts/Cover Images/Chapter 9.png', hasCover: true  },
            { num: 10, title: 'Go-To-Market Strategy & Channel Roadmap',    src: 'Podcasts/Podcast Audio Files/chapter_10.mp3', cover: 'Podcasts/Cover Images/Chapter  10.png', hasCover: true },
            { num: 11, title: 'Digital Strategy & E-commerce Approach',     src: 'Podcasts/Podcast Audio Files/chapter_11.mp3', cover: 'Podcasts/Cover Images/chapter 11.png', hasCover: true },
            { num: 12, title: 'Supply Chain & Operations Feasibility',      src: 'Podcasts/Podcast Audio Files/Chapter_12.mp3', cover: 'Podcasts/Cover Images/chapter 12.png', hasCover: true },
            { num: 13, title: 'Regulatory Environment & Compliance',        src: 'Podcasts/Podcast Audio Files/chapter_13.mp3', cover: 'Podcasts/Cover Images/chapter 13.png', hasCover: true },
            { num: 14, title: 'Cost Structure & Financial Considerations',  src: 'Podcasts/Podcast Audio Files/chapter_14.mp3', cover: 'Podcasts/Cover Images/chapter 14.png', hasCover: true },
            { num: 15, title: 'Financial Projections & Commercial Modeling',src: 'Podcasts/Podcast Audio Files/chapter_15.mp3', cover: 'Podcasts/Cover Images/chapter 15.png', hasCover: true },
            { num: 16, title: 'Risk Assessment & Mitigation Strategy',      src: 'Podcasts/Podcast Audio Files/chapter_16.mp3', cover: 'Podcasts/Cover Images/chapter 16.png', hasCover: true },
            { num: 17, title: 'Implementation Roadmap & Phased Rollout Plan',src: 'Podcasts/Podcast Audio Files/chapter_17.mp3', cover: 'Podcasts/Cover Images/chapter 17.png', hasCover: true },
            { num: 18, title: 'Conclusion & Strategic Recommendations',     src: 'Podcasts/Podcast Audio Files/Chapter_18.mp3', cover: 'Podcasts/Cover Images/chapter 18.png', hasCover: true },
        ];

        this.speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

        this.render();
        this.initAudio();
        this.bindEvents();
    }

    /* ── Gradient fallback for chapters without a cover image ─── */
    getCoverGradient(num) {
        const g = [
            'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)',
            'linear-gradient(135deg,#2d1b69 0%,#11998e 100%)',
            'linear-gradient(135deg,#0d0d0d 0%,#a8810a 100%)',
            'linear-gradient(135deg,#141e30 0%,#243b55 100%)',
            'linear-gradient(135deg,#360033 0%,#0b8793 100%)',
            'linear-gradient(135deg,#1c1c1c 0%,#8b6914 100%)',
            'linear-gradient(135deg,#0f2027 0%,#2c5364 100%)',
            'linear-gradient(135deg,#16222a 0%,#3a6186 100%)',
            'linear-gradient(135deg,#232526 0%,#414345 100%)',
            'linear-gradient(135deg,#1f1c2c 0%,#928dab 100%)',
            'linear-gradient(135deg,#093028 0%,#237a57 100%)',
            'linear-gradient(135deg,#2c1654 0%,#7a1fa2 100%)',
            'linear-gradient(135deg,#2d3436 0%,#d4af37 100%)',
            'linear-gradient(135deg,#0a0a0a 0%,#3d2b1f 100%)',
        ];
        return g[(num - 1) % g.length];
    }

    /* ── Build cover HTML ─── */
    buildCoverHtml(ch) {
        return ch.hasCover
            ? `<img src="${ch.cover}" alt="Chapter ${ch.num} Cover" class="pod-cover-img">`
            : `<div class="pod-cover-placeholder" style="background:${this.getCoverGradient(ch.num)};"><span class="pod-cover-num">${String(ch.num).padStart(2,'0')}</span></div>`;
    }

    /* ── Build one playlist item ─── */
    buildPlaylistItem(c, i) {
        const thumb = c.hasCover
            ? `<img src="${c.cover}" alt="Chapter ${c.num}">`
            : `<div class="pod-pitem-thumb-gradient" style="background:${this.getCoverGradient(c.num)};"><span>${String(c.num).padStart(2,'0')}</span></div>`;
        return `
            <div class="pod-playlist-item ${i === this.currentTrack ? 'active' : ''}" data-track="${i}" id="pod-pitem-${i}">
                <div class="pod-pitem-thumb">
                    ${thumb}
                    <div class="pod-pitem-playing-indicator" id="pod-pitem-indicator-${i}">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <div class="pod-pitem-info">
                    <div class="pod-pitem-num">Chapter ${c.num}</div>
                    <div class="pod-pitem-title">${c.title}</div>
                </div>
            </div>`;
    }

    /* ── Full render ─── */
    render() {
        const ch = this.chapters[this.currentTrack];

        this.container.innerHTML = `
        <div class="pod-player-shell" id="pod-player-shell">

            <!-- ████ COL 1 — PLAYLIST (always visible desktop / drawer mobile) ████ -->
            <div class="pod-col-playlist" id="pod-col-playlist">
                <div class="pod-playlist-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-gold);flex-shrink:0"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
                    <span class="pod-playlist-title">All Chapters</span>
                    <button class="pod-playlist-close" id="pod-playlist-close" title="Close playlist">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="pod-playlist-list" id="pod-playlist-list">
                    ${this.chapters.map((c, i) => this.buildPlaylistItem(c, i)).join('')}
                </div>
            </div>

            <!-- ████ COL 2 — MAIN PLAYER (COVER + CONTROLS STACKED) ████ -->
            <div class="pod-col-main-player">
                <!-- Cover art & track info -->
                <div class="pod-col-cover">
                    <div class="pod-cover-area">
                        <div class="pod-cover-frame" id="pod-cover-frame">
                            ${this.buildCoverHtml(ch)}
                        </div>
                        <div class="pod-cover-ring" id="pod-cover-ring"></div>
                    </div>
                    <div class="pod-info-area">
                        <div class="pod-chapter-badge" id="pod-chapter-badge">CHAPTER ${ch.num} OF ${this.chapters.length}</div>
                        <div class="pod-track-title" id="pod-track-title">${ch.title}</div>
                        <div class="pod-track-series">Aurora Scents TEV Intelligence Briefing</div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="pod-col-controls">
                    <!-- Waveform -->
                    <div class="pod-waveform-area">
                        <canvas class="pod-waveform" id="pod-waveform" height="56"></canvas>
                    </div>

                    <!-- Seek Bar -->
                    <div class="pod-seek-area">
                        <input type="range" class="pod-seek" id="pod-seek" min="0" max="100" value="0" step="0.1">
                        <div class="pod-times">
                            <span id="pod-time-current">0:00</span>
                            <span id="pod-time-total">—:——</span>
                        </div>
                    </div>

                    <!-- Transport -->
                    <div class="pod-transport">
                        <button class="pod-btn pod-btn-sm" id="pod-prev" title="Previous Chapter">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                        </button>
                        <button class="pod-btn pod-btn-sm" id="pod-skip-back" title="Rewind 15s">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                            <span class="pod-btn-badge">15</span>
                        </button>
                        <button class="pod-btn pod-btn-play" id="pod-play" title="Play / Pause">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" id="pod-play-icon"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                        <button class="pod-btn pod-btn-sm" id="pod-skip-fwd" title="Forward 15s">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                            <span class="pod-btn-badge">15</span>
                        </button>
                        <button class="pod-btn pod-btn-sm" id="pod-next" title="Next Chapter">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                        </button>
                    </div>

                    <!-- Speed Pills -->
                    <div class="pod-speed-group">
                        <span class="pod-speed-label">Speed</span>
                        <div class="pod-speed-pills" id="pod-speed-pills">
                            ${this.speedOptions.map(s =>
                                `<button class="pod-speed-pill ${s === 1 ? 'active' : ''}" data-speed="${s}">${s}×</button>`
                            ).join('')}
                        </div>
                    </div>

                    <!-- Volume + mobile playlist toggle -->
                    <div class="pod-side-controls">
                        <div class="pod-volume-group">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            <input type="range" class="pod-volume" id="pod-volume" min="0" max="100" value="80">
                        </div>
                        <!-- Playlist toggle — visible on mobile only (hidden via CSS on desktop) -->
                        <button class="pod-btn pod-btn-sm pod-playlist-toggle" id="pod-playlist-toggle" title="Show Playlist">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Dark backdrop for mobile playlist drawer -->
            <div class="pod-backdrop" id="pod-backdrop"></div>

            <!-- Floating Chapters Selector Button on Mobile -->
            <button class="pod-floating-btn" id="pod-floating-btn" title="Open Chapter Playlist" aria-label="Open Chapter Playlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <span>Chapters</span>
            </button>
        </div>`;

        // Cache frequently-accessed DOM refs
        this.playBtn      = document.getElementById('pod-play');
        this.playIcon     = document.getElementById('pod-play-icon');
        this.seekEl       = document.getElementById('pod-seek');
        this.timeCurrent  = document.getElementById('pod-time-current');
        this.timeTotal    = document.getElementById('pod-time-total');
        this.trackTitle   = document.getElementById('pod-track-title');
        this.chapterBadge = document.getElementById('pod-chapter-badge');
        this.coverFrame   = document.getElementById('pod-cover-frame');
        this.coverRing    = document.getElementById('pod-cover-ring');
        this.waveCanvas   = document.getElementById('pod-waveform');
        this.playlistCol  = document.getElementById('pod-col-playlist');
        this.backdrop     = document.getElementById('pod-backdrop');

        this.resizeWaveCanvas();
        this.drawStaticWaveform();
    }

    resizeWaveCanvas() {
        if (!this.waveCanvas) return;
        const w = this.waveCanvas.parentElement?.clientWidth || 600;
        this.waveCanvas.width = w;
    }

    /* ── Audio init ─── */
    initAudio() {
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        this.audio.volume  = 0.8;
        this.loadTrack(this.currentTrack, false);
    }

    loadTrack(index, autoPlay = false) {
        const ch = this.chapters[index];
        this.currentTrack = index;
        this.audio.src = ch.src;
        this.audio.playbackRate = this.playbackRate;

        // Update cover art
        this.coverFrame.innerHTML = this.buildCoverHtml(ch);

        // Update text info
        this.trackTitle.textContent   = ch.title;
        this.chapterBadge.textContent = `CHAPTER ${ch.num} OF ${this.chapters.length}`;
        this.seekEl.value             = 0;
        this.timeCurrent.textContent  = '0:00';
        this.timeTotal.textContent    = '—:——';

        // Update playlist highlight
        document.querySelectorAll('.pod-playlist-item').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
        document.querySelectorAll('.pod-pitem-playing-indicator').forEach(el => el.classList.remove('active'));

        // On mobile, close the drawer after selecting. On desktop, scroll active item into view.
        if (this.isMobile()) {
            this.togglePlaylist(false);
        } else {
            const activeEl = document.getElementById(`pod-pitem-${index}`);
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }

        if (autoPlay) {
            this.audio.play().catch(() => {});
            this.isPlaying = true;
            this.updatePlayState();
        } else {
            this.isPlaying = false;
            this.updatePlayState();
        }
    }

    /* ── Is the viewport currently mobile? ─── */
    isMobile() {
        return window.innerWidth < 769;
    }

    /* ── Event bindings ─── */
    bindEvents() {
        // Play / Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Prev / Next
        document.getElementById('pod-prev').addEventListener('click', () => this.prevTrack());
        document.getElementById('pod-next').addEventListener('click', () => this.nextTrack());

        // Skip ±15 s
        document.getElementById('pod-skip-back').addEventListener('click', () => {
            if (this.audio) this.audio.currentTime = Math.max(0, this.audio.currentTime - 15);
        });
        document.getElementById('pod-skip-fwd').addEventListener('click', () => {
            if (this.audio) this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + 15);
        });

        // Seek
        this.seekEl.addEventListener('input', () => {
            if (this.audio && this.audio.duration) {
                this.audio.currentTime = (parseFloat(this.seekEl.value) / 100) * this.audio.duration;
            }
        });

        // Volume
        document.getElementById('pod-volume').addEventListener('input', e => {
            if (this.audio) this.audio.volume = parseInt(e.target.value) / 100;
        });

        // Speed pills
        document.getElementById('pod-speed-pills').addEventListener('click', e => {
            const pill = e.target.closest('.pod-speed-pill');
            if (!pill) return;
            const speed = parseFloat(pill.dataset.speed);
            this.playbackRate = speed;
            if (this.audio) this.audio.playbackRate = speed;
            document.querySelectorAll('.pod-speed-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });

        // Playlist toggle (mobile drawer open/close)
        document.getElementById('pod-playlist-toggle').addEventListener('click', () => this.togglePlaylist());
        document.getElementById('pod-playlist-close').addEventListener('click', () => this.togglePlaylist(false));
        this.backdrop.addEventListener('click', () => this.togglePlaylist(false));

        const floatingPodBtn = document.getElementById('pod-floating-btn');
        if (floatingPodBtn) {
            floatingPodBtn.addEventListener('click', () => this.togglePlaylist(true));
        }

        // Playlist item clicks
        document.getElementById('pod-playlist-list').addEventListener('click', e => {
            const item = e.target.closest('.pod-playlist-item');
            if (!item) return;
            this.loadTrack(parseInt(item.dataset.track), true);
        });

        // Audio events
        this.audio.addEventListener('timeupdate',    () => this.onTimeUpdate());
        this.audio.addEventListener('loadedmetadata', () => {
            this.timeTotal.textContent = this.formatTime(this.audio.duration);
        });
        this.audio.addEventListener('ended', () => {
            if (this.currentTrack < this.chapters.length - 1) {
                this.loadTrack(this.currentTrack + 1, true);
            } else {
                this.isPlaying = false;
                this.updatePlayState();
            }
        });
        this.audio.addEventListener('play',  () => { this.isPlaying = true;  this.updatePlayState(); this.startWaveAnimation(); });
        this.audio.addEventListener('pause', () => { this.isPlaying = false; this.updatePlayState(); this.stopWaveAnimation(); });

        // Keyboard shortcuts (only when podcast section is active)
        document.addEventListener('keydown', e => {
            const section = document.getElementById('section-podcast-player');
            if (!section?.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === ' ')           { e.preventDefault(); this.togglePlay(); }
            if (e.key === 'ArrowRight')  { e.preventDefault(); document.getElementById('pod-skip-fwd').click(); }
            if (e.key === 'ArrowLeft')   { e.preventDefault(); document.getElementById('pod-skip-back').click(); }
        });

        // Resize observer — redraw waveform when column resizes
        if (window.ResizeObserver && this.waveCanvas?.parentElement) {
            const ro = new ResizeObserver(() => { this.resizeWaveCanvas(); this.drawStaticWaveform(); });
            ro.observe(this.waveCanvas.parentElement);
        }
    }

    /* ── Playback controls ─── */
    togglePlay() {
        if (!this.audio) return;
        this.isPlaying ? this.audio.pause() : this.audio.play().catch(err => console.warn('Audio play blocked:', err));
    }

    prevTrack() {
        if (this.audio && this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
        if (this.currentTrack > 0) this.loadTrack(this.currentTrack - 1, this.isPlaying);
    }

    nextTrack() {
        if (this.currentTrack < this.chapters.length - 1) this.loadTrack(this.currentTrack + 1, this.isPlaying);
    }

    /* ── UI state updates ─── */
    updatePlayState() {
        if (this.isPlaying) {
            this.playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            this.playBtn.classList.add('playing');
            this.coverRing.classList.add('active');
            const ind = document.getElementById(`pod-pitem-indicator-${this.currentTrack}`);
            if (ind) ind.classList.add('active');
        } else {
            this.playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
            this.playBtn.classList.remove('playing');
            this.coverRing.classList.remove('active');
            document.querySelectorAll('.pod-pitem-playing-indicator').forEach(el => el.classList.remove('active'));
        }
    }

    onTimeUpdate() {
        if (!this.audio?.duration) return;
        this.seekEl.value = (this.audio.currentTime / this.audio.duration) * 100;
        this.timeCurrent.textContent = this.formatTime(this.audio.currentTime);
    }

    formatTime(secs) {
        if (!secs || isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    /* ── Playlist drawer (mobile only) ─── */
    togglePlaylist(forceState) {
        // On desktop the playlist column is always visible — only act on mobile
        if (!this.isMobile() && forceState !== false) return;

        this.playlistOpen = forceState !== undefined ? forceState : !this.playlistOpen;
        this.playlistCol.classList.toggle('drawer-open', this.playlistOpen);
        this.backdrop.classList.toggle('active', this.playlistOpen);
        document.body.style.overflow = this.playlistOpen ? 'hidden' : '';

        // Hide floating chapters FAB when playlist is open, restore on close
        const floatingPodBtn = document.getElementById('pod-floating-btn');
        if (floatingPodBtn) {
            floatingPodBtn.style.display = this.playlistOpen ? 'none' : 'flex';
        }

        if (this.playlistOpen) {
            setTimeout(() => {
                const active = this.playlistCol.querySelector('.pod-playlist-item.active');
                if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 350);
        }
    }

    /* ── Waveform animation ─── */
    startWaveAnimation() {
        if (this.waveAnimFrame) return;
        const tick = () => {
            if (!this.isPlaying) return;
            const pct = this.audio?.duration ? this.audio.currentTime / this.audio.duration : 0;
            this.drawPlayingWaveform(pct);
            this.waveAnimFrame = requestAnimationFrame(tick);
        };
        this.waveAnimFrame = requestAnimationFrame(tick);
    }

    stopWaveAnimation() {
        if (this.waveAnimFrame) { cancelAnimationFrame(this.waveAnimFrame); this.waveAnimFrame = null; }
        this.drawStaticWaveform();
    }

    drawStaticWaveform() {
        const pct = this.audio?.duration ? this.audio.currentTime / this.audio.duration : 0;
        this.drawPlayingWaveform(pct);
    }

    drawPlayingWaveform(progress) {
        const canvas = this.waveCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const seed     = this.chapters[this.currentTrack].num * 23 + 7;
        const barCount = Math.floor(w / 4);
        const barW     = 2;
        const gap      = barCount > 1 ? (w - barCount * barW) / (barCount - 1) : 0;

        for (let i = 0; i < barCount; i++) {
            const t      = i / barCount;
            const pseudo = Math.abs(
                Math.sin(seed + i * 0.55) * 0.45 +
                Math.cos(i * 0.29 + seed * 0.3) * 0.35 +
                Math.sin(i * 0.13) * 0.2
            ) * 0.9 + 0.1;

            let barH = pseudo * (h - 8);
            if (this.isPlaying && Math.abs(t - progress) < 0.04) {
                barH *= 1 + 0.35 * Math.sin(Date.now() / 100 + i * 0.8);
            }
            barH = Math.min(barH, h - 4);

            const x = i * (barW + gap);
            const y = (h - barH) / 2;

            if (t <= progress) {
                const grad = ctx.createLinearGradient(0, y, 0, y + barH);
                grad.addColorStop(0, 'rgba(212,175,55,1)');
                grad.addColorStop(1, 'rgba(212,175,55,0.4)');
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.09)';
            }

            if (ctx.roundRect) {
                ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 1); ctx.fill();
            } else {
                ctx.fillRect(x, y, barW, barH);
            }
        }
    }
}
