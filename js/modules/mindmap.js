// Aurora Scents — Mind Map Module
// Interactive high-resolution mind map viewer with zoom, fullscreen, and click-and-drag panning

export class MindMap {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.zoomPercent = 100;
        this.isFullscreen = false;
        
        // Panning state
        this.isDown = false;
        this.startX = 0;
        this.startY = 0;
        this.scrollLeft = 0;
        this.scrollTop = 0;

        this.render();
        this.bindEvents();
        this.updateZoom();
    }

    render() {
        this.container.innerHTML = `
            <div class="mindmap-wrapper" id="mindmap-wrapper">
                <!-- Toolbar -->
                <div class="mindmap-toolbar">
                    <div class="mindmap-toolbar-group">
                        <span class="mindmap-toolbar-title">Strategy Mapping</span>
                    </div>

                    <div class="mindmap-toolbar-divider"></div>

                    <div class="mindmap-toolbar-group">
                        <button class="mindmap-btn" id="mm-btn-zoom-out" title="Zoom Out (−)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        </button>
                        <span class="mindmap-zoom-display" id="mm-zoom-display">100%</span>
                        <button class="mindmap-btn" id="mm-btn-zoom-in" title="Zoom In (+)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        </button>
                        <button class="mindmap-btn" id="mm-btn-reset" title="Reset Zoom">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
                        </button>
                    </div>

                    <div class="mindmap-spacer"></div>

                    <div class="mindmap-toolbar-group">
                        <button class="mindmap-btn" id="mm-btn-fullscreen" title="Toggle Fullscreen (F)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="mm-fullscreen-icon"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Scrollable Viewport -->
                <div class="mindmap-viewport" id="mindmap-viewport">
                    <div class="mindmap-canvas" id="mindmap-canvas">
                        <img 
                            src="Podcasts/New folder/NotebookLM Mind Map (1).png" 
                            alt="NotebookLM Strategy Mind Map" 
                            class="mindmap-img" 
                            id="mindmap-img"
                            draggable="false"
                        >
                    </div>
                </div>

                <!-- Floating panning instruction helper -->
                <div class="mindmap-helper-tip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 8 8 12 12 16"/><polyline points="16 12 12 12"/>
                    </svg>
                    <span>Click and drag to pan around the Mind Map</span>
                </div>
            </div>
        `;

        this.wrapper = document.getElementById('mindmap-wrapper');
        this.viewport = document.getElementById('mindmap-viewport');
        this.image = document.getElementById('mindmap-img');
        this.zoomDisplay = document.getElementById('mm-zoom-display');
    }

    bindEvents() {
        const btnIn = document.getElementById('mm-btn-zoom-in');
        const btnOut = document.getElementById('mm-btn-zoom-out');
        const btnReset = document.getElementById('mm-btn-reset');
        const btnFull = document.getElementById('mm-btn-fullscreen');

        btnIn.addEventListener('click', () => this.zoomIn());
        btnOut.addEventListener('click', () => this.zoomOut());
        btnReset.addEventListener('click', () => this.zoomReset());
        btnFull.addEventListener('click', () => this.toggleFullscreen());

        // Panning mouse events
        this.viewport.addEventListener('mousedown', (e) => {
            this.isDown = true;
            this.viewport.classList.add('grabbing');
            this.startX = e.pageX - this.viewport.offsetLeft;
            this.startY = e.pageY - this.viewport.offsetTop;
            this.scrollLeft = this.viewport.scrollLeft;
            this.scrollTop = this.viewport.scrollTop;
        });

        this.viewport.addEventListener('mouseleave', () => {
            this.isDown = false;
            this.viewport.classList.remove('grabbing');
        });

        this.viewport.addEventListener('mouseup', () => {
            this.isDown = false;
            this.viewport.classList.remove('grabbing');
        });

        this.viewport.addEventListener('mousemove', (e) => {
            if (!this.isDown) return;
            e.preventDefault();
            const x = e.pageX - this.viewport.offsetLeft;
            const y = e.pageY - this.viewport.offsetTop;
            const walkX = (x - this.startX) * 1.5;
            const walkY = (y - this.startY) * 1.5;
            this.viewport.scrollLeft = this.scrollLeft - walkX;
            this.viewport.scrollTop = this.scrollTop - walkY;
        });

        // Double click to zoom in at mouse position
        this.image.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.zoomIn();
        });

        // Key bindings
        document.addEventListener('keydown', (e) => {
            const section = document.getElementById('section-mindmap');
            if (!section?.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomIn(); }
            else if (e.key === '-') { e.preventDefault(); this.zoomOut(); }
            else if (e.key === '0') { e.preventDefault(); this.zoomReset(); }
            else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.toggleFullscreen(); }
            else if (e.key === 'Escape' && this.isFullscreen) { this.toggleFullscreen(); }
        });
    }

    zoomIn() {
        if (this.zoomPercent >= 300) return;
        this.zoomPercent += 25;
        this.updateZoom();
    }

    zoomOut() {
        if (this.zoomPercent <= 50) return;
        this.zoomPercent -= 25;
        this.updateZoom();
    }

    zoomReset() {
        this.zoomPercent = 100;
        this.updateZoom();
    }

    updateZoom() {
        this.zoomDisplay.textContent = this.zoomPercent + '%';
        
        // Use a baseline layout width in pixels (e.g. 1500px) scaled by zoomPercent.
        // This naturally triggers vertical/horizontal document overflow scrollbars on the parent.
        const baseWidth = 1500;
        const targetWidth = Math.floor(baseWidth * this.zoomPercent / 100);
        
        this.image.style.width = targetWidth + 'px';
        this.image.style.minWidth = targetWidth + 'px';
        this.image.style.maxWidth = 'none';
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.wrapper.classList.toggle('fullscreen', this.isFullscreen);

        const btn = document.getElementById('mm-btn-fullscreen');
        const icon = document.getElementById('mm-fullscreen-icon');
        btn.classList.toggle('active', this.isFullscreen);

        if (this.isFullscreen) {
            icon.innerHTML = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>';
            document.body.style.overflow = 'hidden';
        } else {
            icon.innerHTML = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
            document.body.style.overflow = '';
        }
    }
}
