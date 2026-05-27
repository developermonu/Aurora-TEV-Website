// Aurora Scents — Video Blueprint Module
// Implements custom HTML5 video player with sleek control bar, play/pause, seek, volume, speed, and fullscreen overrides

export class VideoBlueprint {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.isPlaying = false;
        this.isFullscreen = false;
        this.playbackRate = 1.0;
        this.isMuted = false;

        this.render();
        this.initVideo();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="video-player-wrapper" id="video-wrapper">
                <!-- Video Element -->
                <div class="video-display-area" id="video-display-area">
                    <video 
                        class="video-element" 
                        id="video-element"
                        src="Podcasts/Cover Images/Aurora_Scents_TEV_Blueprint.mp4" 
                        preload="metadata"
                        playsinline
                    ></video>
                    
                    <!-- Center Play/Pause overlay for easy interaction -->
                    <div class="video-overlay-play" id="video-overlay-play">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                </div>

                <!-- Custom Control Bar -->
                <div class="video-control-bar">
                    <!-- Progress Seek Range -->
                    <div class="video-seek-container">
                        <input type="range" class="video-seek" id="video-seek" min="0" max="100" value="0" step="0.1">
                        <div class="video-seek-progress" id="video-seek-progress"></div>
                    </div>

                    <div class="video-controls-row">
                        <!-- Play/Pause & Time Indicators -->
                        <div class="video-control-group">
                            <button class="video-ctrl-btn" id="video-btn-play" title="Play / Pause (Space)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" id="video-icon-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </button>
                            <div class="video-time-display">
                                <span id="video-time-current">0:00</span>
                                <span class="video-time-separator">/</span>
                                <span id="video-time-total">0:00</span>
                            </div>
                        </div>

                        <!-- Spacer -->
                        <div class="video-spacer"></div>

                        <!-- Speed, Volume, and Fullscreen controls -->
                        <div class="video-control-group">
                            <!-- Speed Control -->
                            <div class="video-speed-menu-container">
                                <button class="video-ctrl-btn text-btn" id="video-btn-speed" title="Playback Speed">1.0×</button>
                                <div class="video-speed-dropdown" id="video-speed-dropdown">
                                    <div class="speed-opt" data-speed="0.5">0.5×</div>
                                    <div class="speed-opt" data-speed="0.75">0.75×</div>
                                    <div class="speed-opt active" data-speed="1.0">1.0×</div>
                                    <div class="speed-opt" data-speed="1.25">1.25×</div>
                                    <div class="speed-opt" data-speed="1.5">1.5×</div>
                                    <div class="speed-opt" data-speed="2.0">2.0×</div>
                                </div>
                            </div>

                            <div class="video-control-divider"></div>

                            <!-- Volume Button & slider slider -->
                            <div class="video-volume-container">
                                <button class="video-ctrl-btn" id="video-btn-volume" title="Mute / Unmute (M)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="video-icon-volume"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                </button>
                                <div class="video-volume-slider-wrapper">
                                    <input type="range" class="video-volume-slider" id="video-volume-slider" min="0" max="100" value="80">
                                </div>
                            </div>

                            <div class="video-control-divider"></div>

                            <!-- Fullscreen button -->
                            <button class="video-ctrl-btn" id="video-btn-fullscreen" title="Toggle Fullscreen (F)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="video-icon-fullscreen"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.wrapper = document.getElementById('video-wrapper');
        this.video = document.getElementById('video-element');
        this.playBtn = document.getElementById('video-btn-play');
        this.playIcon = document.getElementById('video-icon-play');
        this.overlayPlay = document.getElementById('video-overlay-play');
        this.seekEl = document.getElementById('video-seek');
        this.seekProgress = document.getElementById('video-seek-progress');
        this.timeCurrent = document.getElementById('video-time-current');
        this.timeTotal = document.getElementById('video-time-total');
        this.speedBtn = document.getElementById('video-btn-speed');
        this.speedDropdown = document.getElementById('video-speed-dropdown');
        this.volumeBtn = document.getElementById('video-btn-volume');
        this.volumeIcon = document.getElementById('video-icon-volume');
        this.volumeSlider = document.getElementById('video-volume-slider');
        this.fullscreenBtn = document.getElementById('video-btn-fullscreen');
        this.fullscreenIcon = document.getElementById('video-icon-fullscreen');
    }

    initVideo() {
        this.video.volume = 0.8;
    }

    bindEvents() {
        // Toggle play/pause on play button click
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Toggle play/pause on clicking the display area
        this.video.addEventListener('click', () => this.togglePlay());
        this.overlayPlay.addEventListener('click', () => this.togglePlay());

        // Video state event listeners
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.onPause());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('loadedmetadata', () => {
            this.timeTotal.textContent = this.formatTime(this.video.duration);
        });

        // Seek input handler
        this.seekEl.addEventListener('input', () => {
            if (this.video.duration) {
                const percentage = parseFloat(this.seekEl.value);
                this.video.currentTime = (percentage / 100) * this.video.duration;
                this.seekProgress.style.width = percentage + '%';
            }
        });

        // Speed Menu display toggling
        this.speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speedDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            this.speedDropdown.classList.remove('show');
        });

        // Playback speed option handlers
        this.speedDropdown.querySelectorAll('.speed-opt').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const speed = parseFloat(opt.dataset.speed);
                this.playbackRate = speed;
                this.video.playbackRate = speed;
                this.speedBtn.textContent = speed.toFixed(1) + '×';

                this.speedDropdown.querySelectorAll('.speed-opt').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            });
        });

        // Volume click mute toggle
        this.volumeBtn.addEventListener('click', () => this.toggleMute());

        // Volume slider drag handler
        this.volumeSlider.addEventListener('input', () => {
            const vol = parseFloat(this.volumeSlider.value) / 100;
            this.video.volume = vol;
            this.isMuted = (vol === 0);
            this.updateVolumeUI();
        });

        // Fullscreen toggle handler
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.video.addEventListener('dblclick', () => this.toggleFullscreen());

        // Shortcut keyboard listener (only active when Video section is active)
        document.addEventListener('keydown', (e) => {
            const section = document.getElementById('section-blueprint-video');
            if (!section?.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === ' ') {
                e.preventDefault();
                this.togglePlay();
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggleFullscreen();
            } else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                this.toggleMute();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 5);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.video.currentTime = Math.max(0, this.video.currentTime - 5);
            }
        });
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play().catch(err => console.warn("Video playback blocked:", err));
        } else {
            this.video.pause();
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        this.playBtn.title = "Pause (Space)";
        this.overlayPlay.classList.add('hidden');
    }

    onPause() {
        this.isPlaying = false;
        this.playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        this.playBtn.title = "Play (Space)";
        this.overlayPlay.classList.remove('hidden');
    }

    onTimeUpdate() {
        if (!this.video.duration) return;
        
        const current = this.video.currentTime;
        const total = this.video.duration;
        const percentage = (current / total) * 100;
        
        this.seekEl.value = percentage;
        this.seekProgress.style.width = percentage + '%';
        this.timeCurrent.textContent = this.formatTime(current);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.video.muted = this.isMuted;
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        const vol = this.video.volume;
        if (this.isMuted || vol === 0) {
            this.volumeIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
            this.volumeSlider.value = 0;
        } else {
            this.volumeSlider.value = Math.floor(vol * 100);
            if (vol < 0.5) {
                this.volumeIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
            } else {
                this.volumeIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
            }
        }
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.wrapper.classList.toggle('fullscreen', this.isFullscreen);

        if (this.isFullscreen) {
            this.fullscreenIcon.innerHTML = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>';
            document.body.style.overflow = 'hidden';
        } else {
            this.fullscreenIcon.innerHTML = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
            document.body.style.overflow = '';
        }
    }

    formatTime(secs) {
        if (!secs || isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }
}
