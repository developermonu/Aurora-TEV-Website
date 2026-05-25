// Aurora Scents — TEV Book Viewer v3
// 3D Flipbook page-turn via StPageFlip + PDF.js rendering
// Features: real page-turn animation, clickable annotation links,
//           selectable text layer, TOC sidebar, zoom, fullscreen, download

import { AudioContextEngine } from '../engines/audio-context.js';

export class BookViewer {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.pdfDocument   = null;
        this.totalPages    = 0;
        this.currentPage   = 1;
        this.isRendering   = false;
        this.isFullscreen  = false;
        this.zoomLevel     = this.isMobile() ? 1.0 : 1.5; // lower on mobile for performance
        this.audioEngine   = new AudioContextEngine();
        this.soundEnabled  = true;
        this.pageTurnCount = 0;

        // StPageFlip instance
        this.flipBook = null;
        // Cache of rendered page canvases { pageNum → canvas }
        this.pageCanvases = {};
        // Map of page wrappers for annotation/text overlays
        this.pageWrappers = {};
        // Track rendering status per page (idle, rendering, rendered, error)
        this.renderedPagesStatus = {};
        this.nativeViewport = null;

        this.scrollPageCooldown = false;
        this.fullscreenToggleTime = 0; // Cooldown timer to prevent toggle loop crashes
        this._lastMobileState = this.isMobile(); // Track breakpoint crossing
        this._resizeDebounce = null;

        // Hardcoded TOC — Comprehensive 18-Chapter Manifest
        this.tableOfContents = [
            { title: 'Cover Page',                                                page: 1,   level: 'chapter' },
            { title: 'Confidentiality Notice',                                    page: 2,   level: 'chapter' },
            { title: 'Table of Contents',                                         page: 3,   level: 'chapter' },
            { title: 'Chapter 1. Executive Summary',                              page: 17,  level: 'chapter' },
            { title: '1.1 Purpose of the Study',                                  page: 17,  level: 'sub' },
            { title: '1.4 Entry Recommendation',                                  page: 21,  level: 'sub' },
            { title: 'Chapter 2. Study Background, Scope & Methodology',          page: 24,  level: 'chapter' },
            { title: '2.2 Objectives of the Study',                               page: 25,  level: 'sub' },
            { title: '2.6 Key Assumptions',                                       page: 34,  level: 'sub' },
            { title: 'Chapter 3. Brand Overview: Aurora Scents',                  page: 36,  level: 'chapter' },
            { title: '3.3 Brand Architecture & Portfolio Breadth',                page: 38,  level: 'sub' },
            { title: '3.7 Strategic Relevance of India',                          page: 42,  level: 'sub' },
            { title: 'Chapter 4. India Fragrance Market Overview',                page: 46,  level: 'chapter' },
            { title: '4.2 Market Size & Growth Outlook',                          page: 47,  level: 'sub' },
            { title: '4.5 Premium vs Non-Premium Dynamics',                       page: 51,  level: 'sub' },
            { title: 'Chapter 5. Indian Consumer Landscape & Demand Drivers',      page: 55,  level: 'chapter' },
            { title: '5.1 Fragrance-Buying Behavior in India',                    page: 55,  level: 'sub' },
            { title: '5.5 Men, Women, & Unisex Demand Patterns',                  page: 61,  level: 'sub' },
            { title: 'Chapter 6. Channel Landscape & Route-to-Market',            page: 65,  level: 'chapter' },
            { title: '6.2 D2C Opportunity',                                       page: 66,  level: 'sub' },
            { title: '6.7 Recommended Market-Entry Route',                        page: 72,  level: 'sub' },
            { title: 'Chapter 7. Competitive Landscape',                          page: 76,  level: 'chapter' },
            { title: '7.4 Competitor Analysis & Benchmarking',                    page: 80,  level: 'sub' },
            { title: '7.12 White-Space Opportunities',                            page: 114, level: 'sub' },
            { title: 'Chapter 8. Aurora Portfolio Assessment',                    page: 116, level: 'chapter' },
            { title: '8.2 Scent-Family Mapping',                                  page: 118, level: 'sub' },
            { title: '8.5 India Relevance of Existing Lines',                     page: 123, level: 'sub' },
            { title: 'Chapter 9. Launch SKU Selection Strategy',                  page: 127, level: 'chapter' },
            { title: '9.3 Recommended Hero SKU Architecture',                     page: 130, level: 'sub' },
            { title: '9.6 Launch Basket Selection',                               page: 132, level: 'sub' },
            { title: 'Chapter 10. India Positioning Strategy',                    page: 136, level: 'chapter' },
            { title: '10.3 Recommended Positioning for India',                    page: 139, level: 'sub' },
            { title: '10.4 Luxury vs Accessible Premium Decision',                page: 140, level: 'sub' },
            { title: 'Chapter 11. Pricing Strategy and Market Fit',               page: 149, level: 'chapter' },
            { title: '11.4 Recommended Pricing Architecture',                     page: 151, level: 'sub' },
            { title: '11.6 Price Ladder by SKU Tier',                             page: 155, level: 'sub' },
            { title: 'Chapter 12. Commercial Feasibility & Unit Economics',       page: 159, level: 'chapter' },
            { title: '12.5 India Landed-Cost Logic',                              page: 162, level: 'sub' },
            { title: '12.9 Gross Margin vs Contribution Margin',                  page: 165, level: 'sub' },
            { title: 'Chapter 13. Operations, Logistics & Compliance Feasibility', page: 172, level: 'chapter' },
            { title: '13.3 Importer & Authorised Agent Structure',                page: 173, level: 'sub' },
            { title: '13.4 CDSCO Registration Readiness',                         page: 174, level: 'sub' },
            { title: 'Chapter 14. Financial Outlook & Scenario Analysis',          page: 185, level: 'chapter' },
            { title: '14.7 Scenario Outlook (Low / Mid / High)',                  page: 188, level: 'sub' },
            { title: '14.10 Working-Capital Requirements',                        page: 191, level: 'sub' },
            { title: 'Chapter 15. Risk Identification, Mitigation & Decision Gates', page: 204, level: 'chapter' },
            { title: '15.2 Risk Framework & Prioritisation',                      page: 205, level: 'sub' },
            { title: '15.15 Decision Gates for India Entry',                      page: 222, level: 'sub' },
            { title: 'Chapter 16. TEV Conclusion & India Entry Recommendation',   page: 225, level: 'chapter' },
            { title: '16.3 Recommended Decision & Entry Format',                  page: 228, level: 'sub' },
            { title: '16.7 Conditions Before Launch',                             page: 238, level: 'sub' },
            { title: 'Chapter 17. Implementation Priorities & First 90 Days',     page: 251, level: 'chapter' },
            { title: '17.4 First 90-Day Action Plan & Workstreams',               page: 257, level: 'sub' },
            { title: '17.8 Recommended Ownership Structure',                      page: 274, level: 'sub' },
            { title: 'Chapter 18. Immediate Actions Required',                    page: 280, level: 'chapter' },
            { title: '18.4 Actions Required from Aurora',                         page: 283, level: 'sub' },
            { title: '18.8 Immediate Strategic Exclusions',                       page: 288, level: 'sub' }
        ];

        this.render();
        this.bindEvents();
        this.loadPDF('TEV Report.pdf');
    }

    /* ── Mobile detection helper ────────────────────────────── */
    isMobile() {
        return window.innerWidth <= 768;
    }

    /* ── DOM scaffold ──────────────────────────────────────── */
    render() {
        this.container.innerHTML = `
            <div class="book-container" id="book-container">
                <!-- TOC Sidebar -->
                <div class="book-toc-sidebar" id="book-toc-sidebar">
                    <div class="book-toc-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        Table of Contents
                        <button class="book-toc-close-btn" id="book-toc-close-btn" aria-label="Close Table of Contents">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <ul class="book-toc-list" id="book-toc-list"></ul>
                </div>

                <!-- Backdrop overlay for mobile TOC -->
                <div class="book-toc-backdrop" id="book-toc-backdrop"></div>

                <!-- Main viewer -->
                <div class="book-viewer-main">
                    <!-- Toolbar -->
                    <div class="book-toolbar">
                        <div class="book-toolbar-group">
                            <button class="book-toolbar-btn nav-btn" id="btn-prev" title="Previous Page (←)" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <div class="page-indicator">
                                <span id="page-current">0</span> / <span id="page-total">0</span>
                            </div>
                            <button class="book-toolbar-btn nav-btn" id="btn-next" title="Next Page (→)" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                        </div>

                        <div class="book-toolbar-divider"></div>

                        <div class="book-toolbar-group">
                            <button class="book-toolbar-btn" id="btn-zoom-out" title="Zoom Out (−)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <span class="zoom-display" id="zoom-display">100%</span>
                            <button class="book-toolbar-btn" id="btn-zoom-in" title="Zoom In (+)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button class="book-toolbar-btn" id="btn-zoom-fit" title="Fit Page">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                            </button>
                        </div>

                        <div class="toolbar-spacer"></div>

                        <div class="book-toolbar-group">
                            <!-- Download button -->
                            <button class="book-toolbar-btn book-toolbar-download" id="btn-download" title="Download TEV Report PDF">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span class="btn-download-label">Download</span>
                            </button>

                            <div class="book-toolbar-divider"></div>

                            <button class="book-toolbar-btn active" id="btn-sound" title="Toggle Sound">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="sound-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            </button>
                            <button class="book-toolbar-btn" id="btn-fullscreen" title="Toggle Fullscreen (F)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="fullscreen-icon"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Flipbook viewport -->
                    <div class="book-viewport" id="book-viewport">
                        <!-- Loading state -->
                        <div class="flipbook-loading" id="flipbook-loading">
                            <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
                            <div class="flipbook-loading-text">Preparing flipbook…</div>
                            <div class="flipbook-progress-bar"><div class="flipbook-progress-fill" id="flipbook-progress-fill"></div></div>
                            <div class="flipbook-progress-label" id="flipbook-progress-label">0 / 0 pages</div>
                        </div>
                        <!-- StPageFlip renders into this element -->
                        <div class="flipbook-stage" id="flipbook-stage"></div>
                    </div>

                    <!-- Swipe Helper Banner (Mobile Only) - Placed below viewport -->
                    <div class="book-swipe-helper" id="book-swipe-helper">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="swipe-helper-icon">
                            <polyline points="7 8 3 12 7 16"></polyline>
                            <polyline points="17 8 21 12 17 16"></polyline>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                        </svg>
                        <span>Swipe left or right to turn pages</span>
                    </div>
                </div>
                <!-- Floating TOC Button on Mobile -->
                <button class="book-toc-floating-btn" id="book-toc-floating-btn" title="Open Table of Contents" aria-label="Open Table of Contents">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <span>Chapters</span>
                </button>
            </div>
        `;

        this.bookContainer = document.getElementById('book-container');
        this.prevBtn       = document.getElementById('btn-prev');
        this.nextBtn       = document.getElementById('btn-next');
        this.pageCurrent   = document.getElementById('page-current');
        this.pageTotal     = document.getElementById('page-total');
        this.zoomDisplay   = document.getElementById('zoom-display');
        this.viewport      = document.getElementById('book-viewport');
        this.stage         = document.getElementById('flipbook-stage');
        this.loadingEl     = document.getElementById('flipbook-loading');
        this.progressFill  = document.getElementById('flipbook-progress-fill');
        this.progressLabel = document.getElementById('flipbook-progress-label');

        this.renderTOC();
    }

    renderTOC() {
        const list = document.getElementById('book-toc-list');
        list.innerHTML = this.tableOfContents.map(item => `
            <li class="book-toc-item ${item.level === 'chapter' ? 'toc-chapter' : 'toc-sub'}" data-page="${item.page}">
                <span style="flex:1">${item.title}</span>
                <span class="toc-page-num">p.${item.page}</span>
            </li>
        `).join('');

        list.querySelectorAll('.book-toc-item').forEach(el => {
            el.addEventListener('click', () => {
                const page = parseInt(el.dataset.page);
                if (page && page !== this.currentPage) this.goToPage(page);
                
                // Auto-close mobile drawer
                const sidebar = document.getElementById('book-toc-sidebar');
                const backdrop = document.getElementById('book-toc-backdrop');
                if (sidebar) sidebar.classList.remove('open');
                if (backdrop) backdrop.classList.remove('active');

                // Restore FAB display state on close
                const floatingTOCBtn = document.getElementById('book-toc-floating-btn');
                if (floatingTOCBtn) floatingTOCBtn.style.display = 'flex';
            });
        });
    }

    /* ── Event bindings ─────────────────────────────────────── */
    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());

        // Mobile TOC Trigger Event Listeners
        const floatingTOCBtn = document.getElementById('book-toc-floating-btn');
        const closeTOCBtn = document.getElementById('book-toc-close-btn');
        const backdropTOC = document.getElementById('book-toc-backdrop');
        const sidebarTOC = document.getElementById('book-toc-sidebar');

        if (floatingTOCBtn && sidebarTOC && backdropTOC) {
            floatingTOCBtn.addEventListener('click', () => {
                sidebarTOC.classList.add('open');
                backdropTOC.classList.add('active');
                
                // Hide floating trigger button when Table of Contents is open
                floatingTOCBtn.style.display = 'none';

                // Hide swipe helper banner when drawer is open
                const swipeHelper = document.getElementById('book-swipe-helper');
                if (swipeHelper) swipeHelper.style.display = 'none';
            });
        }

        const closeDrawer = () => {
            if (sidebarTOC) sidebarTOC.classList.remove('open');
            if (backdropTOC) backdropTOC.classList.remove('active');
            
            // Restore floating trigger button display state on close
            if (floatingTOCBtn) floatingTOCBtn.style.display = 'flex';

            // Restore swipe helper if less than 3 page turns have occurred
            const swipeHelper = document.getElementById('book-swipe-helper');
            if (swipeHelper && this.pageTurnCount < 3) {
                swipeHelper.style.display = 'flex';
            }
        };

        if (closeTOCBtn) {
            closeTOCBtn.addEventListener('click', closeDrawer);
        }

        if (backdropTOC) {
            backdropTOC.addEventListener('click', closeDrawer);
        }

        document.getElementById('btn-zoom-in').addEventListener('click',  () => this.zoomIn());
        document.getElementById('btn-zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-fit').addEventListener('click', () => this.zoomFit());
        document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btn-download').addEventListener('click', () => this.downloadPDF());

        document.getElementById('btn-sound').addEventListener('click', e => {
            this.soundEnabled = !this.soundEnabled;
            e.currentTarget.classList.toggle('active', this.soundEnabled);
            this.audioEngine.isEnabled = this.soundEnabled;
            const icon = document.getElementById('sound-icon');
            icon.innerHTML = this.soundEnabled
                ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
                : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
        });

        // Keyboard
        document.addEventListener('keydown', e => {
            const section = document.getElementById('section-book-viewer');
            if (!section?.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight')         { e.preventDefault(); this.nextPage(); }
            else if (e.key === 'ArrowLeft')     { e.preventDefault(); this.prevPage(); }
            else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomIn(); }
            else if (e.key === '-')             { e.preventDefault(); this.zoomOut(); }
            else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.toggleFullscreen(); }
            else if (e.key === 'Escape' && this.isFullscreen) { this.toggleFullscreen(); }
        });

        // Auto-fullscreen on parent scroll
        const viewportEl = document.getElementById('app-viewport');
        if (viewportEl) {
            viewportEl.addEventListener('scroll', () => {
                const section = document.getElementById('section-book-viewer');
                if (section?.classList.contains('active') && !this.isFullscreen) {
                    // Safety check: Ignore scroll trigger if we recently toggled fullscreen (within 1.5 seconds)
                    if (Date.now() - this.fullscreenToggleTime < 1500) {
                        return;
                    }
                    if (viewportEl.scrollTop > 15) {
                        this.toggleFullscreen();
                        viewportEl.scrollTop = 0;
                    }
                }
            });
        }

        this.bookContainer.addEventListener('wheel', e => {
            // Safety check: Ignore wheel trigger if we recently toggled fullscreen (within 1.5 seconds)
            if (Date.now() - this.fullscreenToggleTime < 1500) {
                return;
            }

            if (!this.isFullscreen && e.deltaY > 0) {
                e.preventDefault();
                this.toggleFullscreen();
            } else if (this.isFullscreen && e.deltaY < 0) {
                e.preventDefault();
                this.toggleFullscreen();
            }
        }, { passive: false });

        // Responsive resize — rebuild flipbook when crossing mobile/desktop breakpoint
        window.addEventListener('resize', () => {
            clearTimeout(this._resizeDebounce);
            this._resizeDebounce = setTimeout(() => {
                const nowMobile = this.isMobile();
                if (nowMobile !== this._lastMobileState) {
                    this._lastMobileState = nowMobile;
                    // Adjust zoom level for new viewport
                    this.zoomLevel = nowMobile ? 1.0 : 1.5;
                    this.rebuildFlipbook();
                }
            }, 300);
        });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.rebuildFlipbook(), 400);
        });
    }

    /* ── PDF Loading ────────────────────────────────────────── */
    async loadPDF(url) {
        this.pdfUrl = url;
        try {
            this.loadingEl.style.display = 'flex';
            this.stage.style.display = 'none';

            const loadingTask = window.pdfjsLib.getDocument(url);
            this.pdfDocument = await loadingTask.promise;
            this.totalPages  = this.pdfDocument.numPages;

            await this.buildFlipbook();

        } catch (err) {
            console.error('Error loading PDF:', err);
            this.loadingEl.innerHTML = `
                <div style="color:var(--accent-gold);text-align:center;padding:32px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:0.5;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <br>Failed to load TEV Report.pdf<br>
                    <span style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;display:inline-block;">Ensure the file is in the root directory.</span>
                </div>`;
        }
    }

    /* ── Build all page canvases and init StPageFlip ────────── */
    async buildFlipbook() {
        // Destroy existing instance FIRST before clearing DOM
        if (this.flipBook) { 
            try { 
                this.flipBook.destroy(); 
                this.flipBook = null;
            } catch(e) {
                console.warn('Error destroying flipbook:', e);
            } 
        }

        // Recreate stage if deleted from DOM by StPageFlip's destroy()
        let stage = document.getElementById('flipbook-stage');
        if (!stage) {
            stage = document.createElement('div');
            stage.id = 'flipbook-stage';
            stage.className = 'flipbook-stage';
            this.viewport.appendChild(stage);
        }
        this.stage = stage;

        this.pageCanvases = {};
        this.pageWrappers = {};
        this.renderedPagesStatus = {};
        this.stage.innerHTML = '';

        // Get page dimensions from page 1
        const firstPage = await this.pdfDocument.getPage(1);
        const vp = firstPage.getViewport({ scale: this.zoomLevel });
        const pageW = Math.floor(vp.width);
        const pageH = Math.floor(vp.height);
        this.nativeViewport = vp;

        // Compute display size based on available viewport
        const viewRect  = this.viewport.getBoundingClientRect();
        const mobile    = this.isMobile();
        const pad       = mobile ? 16 : 40;
        let availW    = viewRect.width  - pad;
        let availH    = viewRect.height - pad;

        // Safety fallback: if viewport collapses (e.g., layout timing during class toggles)
        // use window boundaries adjusted for margins, sidebars, and toolbar offsets
        if (availW <= 100) {
            if (mobile) {
                availW = Math.max(280, window.innerWidth - 32);
            } else {
                const sidebarOffset = this.isFullscreen ? 0 : 280; // Main SPA navigation sidebar
                const tocOffset = 280; // TOC inside book viewer
                availW = Math.max(400, window.innerWidth - sidebarOffset - tocOffset - 60);
            }
        }
        if (availH <= 100) {
            availH = Math.max(300, window.innerHeight - (mobile ? 60 : 100) - pad);
        }

        // Mobile: single page (divide by 1); Desktop: double spread (divide by 2)
        const widthDivisor = mobile ? 1 : 2;
        const scale     = Math.min(availW / (pageW * widthDivisor), availH / pageH, 1);
        const dispW     = Math.floor(pageW * scale);
        const dispH     = Math.floor(pageH * scale);

        // Update zoom display relative to fit
        this.baseFitScale  = scale;
        this.displayScale  = scale;
        this.nativePageW   = pageW;
        this.nativePageH   = pageH;
        this.updateZoomDisplay();

        // Setup DOM placeholders for all pages instantly without rendering yet
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'flipbook-page';
            wrapper.style.width  = dispW + 'px';
            wrapper.style.height = dispH + 'px';

            const canvas = document.createElement('canvas');
            canvas.width  = 1; // start tiny to save GPU memory until rendered
            canvas.height = 1;
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.width  = pageW + 'px';
            canvas.style.height = pageH + 'px';
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'top left';

            // Text layer (selectable text)
            const textLayer = document.createElement('div');
            textLayer.className = 'pdf-text-layer';
            textLayer.style.position = 'absolute';
            textLayer.style.left = '0';
            textLayer.style.top = '0';
            textLayer.style.width  = pageW + 'px';
            textLayer.style.height = pageH + 'px';
            textLayer.style.transform = `scale(${scale})`;
            textLayer.style.transformOrigin = 'top left';

            // Annotation layer (clickable links)
            const annotLayer = document.createElement('div');
            annotLayer.className = 'pdf-annotation-layer';
            annotLayer.style.position = 'absolute';
            annotLayer.style.left = '0';
            annotLayer.style.top = '0';
            annotLayer.style.width  = pageW + 'px';
            annotLayer.style.height = pageH + 'px';
            annotLayer.style.transform = `scale(${scale})`;
            annotLayer.style.transformOrigin = 'top left';

            wrapper.appendChild(canvas);
            wrapper.appendChild(textLayer);
            wrapper.appendChild(annotLayer);
            this.stage.appendChild(wrapper);

            this.pageCanvases[pageNum] = canvas;
            this.pageWrappers[pageNum] = { wrapper, textLayer, annotLayer };
            this.renderedPagesStatus[pageNum] = 'idle';
        }

        // Hide loading, show stage
        this.loadingEl.style.display = 'none';
        this.stage.style.display = 'block';

        this.flipBook = new St.PageFlip(this.stage, {
            width:              dispW,
            height:             dispH,
            size:               'fixed',
            showCover:          true,
            usePortrait:        true,       // Auto single-page on mobile, double on desktop
            drawShadow:         !mobile,    // Disable shadow on mobile for performance
            flippingTime:       mobile ? 350 : 700,
            maxShadowOpacity:   0.5,
            mobileScrollSupport: true,
            useMouseEvents:     true,
            swipeDistance:      mobile ? 10 : 30,
        });

        this.flipBook.loadFromHTML(this.stage.querySelectorAll('.flipbook-page'));

        // Sync page counter on flip events
        this.flipBook.on('flip', e => {
            // StPageFlip page index is 0-based; maps to our 1-based currentPage
            this.currentPage = e.data + 1;

            // Increment page turn count
            this.pageTurnCount++;
            if (this.pageTurnCount >= 3) {
                const swipeHelper = document.getElementById('book-swipe-helper');
                if (swipeHelper) {
                    swipeHelper.style.display = 'none';
                    swipeHelper.classList.add('permanently-hidden');
                }
            }

            this.updateUI();
            this.updateActivePages();
            if (this.soundEnabled) {
                if (!this.audioEngine.isInitialized) this.audioEngine.init();
                this.audioEngine.triggerMechanicalFlipSound();
            }
        });

        this.flipBook.on('changeState', () => this.updateUI());

        this.updateUI();
        this.updateActivePages();
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;
    }

    /* ── Queue page render asynchronously ───────────────────── */
    async queuePageRender(pageNum) {
        if (!this.pdfDocument) return;
        if (this.renderedPagesStatus[pageNum] === 'rendered' || this.renderedPagesStatus[pageNum] === 'rendering') {
            return;
        }

        this.renderedPagesStatus[pageNum] = 'rendering';
        const wrapperObj = this.pageWrappers[pageNum];
        if (!wrapperObj) return;

        try {
            const canvas = this.pageCanvases[pageNum];
            const vp = this.nativeViewport;
            await this.renderPageToCanvas(pageNum, canvas, wrapperObj.textLayer, wrapperObj.annotLayer, vp);
            this.renderedPagesStatus[pageNum] = 'rendered';
        } catch (err) {
            console.error(`Error rendering page ${pageNum}:`, err);
            this.renderedPagesStatus[pageNum] = 'error';
        }
    }

    /* ── Clear rendered page to release memory ──────────────── */
    clearPage(pageNum) {
        if (this.renderedPagesStatus[pageNum] !== 'rendered') return;

        const canvas = this.pageCanvases[pageNum];
        const wrapperObj = this.pageWrappers[pageNum];
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 1;
            canvas.height = 1;
        }
        if (wrapperObj) {
            wrapperObj.textLayer.innerHTML = '';
            wrapperObj.annotLayer.innerHTML = '';
        }
        this.renderedPagesStatus[pageNum] = 'idle';
    }

    /* ── Manage sliding rendering window (current, 2 prev, 5 next) ── */
    async updateActivePages() {
        if (!this.pdfDocument) return;
        const P = this.currentPage;
        
        // Render 2 pages back, 5 pages forward (upcoming)
        const rangeStart = Math.max(1, P - 2);
        const rangeEnd = Math.min(this.totalPages, P + 5);

        // 1. Clear pages outside this active rendering window
        for (let i = 1; i <= this.totalPages; i++) {
            if (i < rangeStart || i > rangeEnd) {
                this.clearPage(i);
            }
        }

        // 2. Build prioritised render queue (current page spread first!)
        const priorityPages = [];
        priorityPages.push(P);
        if (P + 1 <= this.totalPages) priorityPages.push(P + 1);
        if (P - 1 >= 1) priorityPages.push(P - 1);

        for (let i = rangeStart; i <= rangeEnd; i++) {
            if (!priorityPages.includes(i)) {
                priorityPages.push(i);
            }
        }

        // 3. Sequentially trigger rendering of priority queue in background
        for (const pageNum of priorityPages) {
            await this.queuePageRender(pageNum);
        }
    }

    /* ── Render a single PDF page into an existing canvas ───── */
    async renderPageToCanvas(pageNum, canvas, textLayerDiv, annotLayerDiv, referenceViewport) {
        const page = await this.pdfDocument.getPage(pageNum);
        const dpr  = window.devicePixelRatio || 1;

        // Render at DPR for crisp display
        const renderScale    = this.zoomLevel * dpr;
        const renderViewport = page.getViewport({ scale: renderScale });

        // Size canvas for HiDPI
        canvas.width  = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width  = referenceViewport.width  + 'px';
        canvas.style.height = referenceViewport.height + 'px';
        canvas.style.transform = `scale(${this.displayScale})`;
        canvas.style.transformOrigin = 'top left';

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

        // Text layer
        if (textLayerDiv) {
            textLayerDiv.innerHTML = '';
            textLayerDiv.style.position = 'absolute';
            textLayerDiv.style.left = '0';
            textLayerDiv.style.top = '0';
            textLayerDiv.style.width  = referenceViewport.width  + 'px';
            textLayerDiv.style.height = referenceViewport.height + 'px';
            textLayerDiv.style.transform = `scale(${this.displayScale})`;
            textLayerDiv.style.transformOrigin = 'top left';
            try {
                const textContent = await page.getTextContent();
                const tl = window.pdfjsLib.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: referenceViewport,
                    textDivs: [],
                });
                await tl.promise;
            } catch(e) { /* text layer is optional */ }
        }

        // Annotation layer (clickable links)
        if (annotLayerDiv) {
            annotLayerDiv.innerHTML = '';
            annotLayerDiv.style.position = 'absolute';
            annotLayerDiv.style.left = '0';
            annotLayerDiv.style.top = '0';
            annotLayerDiv.style.width  = referenceViewport.width  + 'px';
            annotLayerDiv.style.height = referenceViewport.height + 'px';
            annotLayerDiv.style.transform = `scale(${this.displayScale})`;
            annotLayerDiv.style.transformOrigin = 'top left';
            await this.buildAnnotations(page, referenceViewport, annotLayerDiv);
        }
    }

    /* ── Build clickable annotation overlays for a page ──────── */
    async buildAnnotations(page, viewport, container) {
        try {
            const annotations = await page.getAnnotations();
            for (const annot of annotations) {
                if (annot.subtype !== 'Link' || !annot.rect) continue;

                const rect  = viewport.convertToViewportRectangle(annot.rect);
                const left   = Math.min(rect[0], rect[2]);
                const top    = Math.min(rect[1], rect[3]);
                const width  = Math.abs(rect[2] - rect[0]);
                const height = Math.abs(rect[3] - rect[1]);

                const link = document.createElement('div');
                link.className  = 'pdf-link';
                link.style.left   = left   + 'px';
                link.style.top    = top    + 'px';
                link.style.width  = width  + 'px';
                link.style.height = height + 'px';

                if (annot.url || annot.unsafeUrl) {
                    const href = annot.url || annot.unsafeUrl;
                    link.title = href;
                    link.addEventListener('click', e => {
                        e.preventDefault(); e.stopPropagation();
                        window.open(href, '_blank', 'noopener');
                    });
                } else if (annot.dest) {
                    link.style.cursor = 'pointer';
                    link.addEventListener('click', async e => {
                        e.preventDefault(); e.stopPropagation();
                        const pg = await this.resolveDestination(annot.dest);
                        if (pg) this.goToPage(pg);
                    });
                }

                container.appendChild(link);
            }
        } catch(e) { /* annotation layer optional */ }
    }

    async resolveDestination(dest) {
        if (!dest || !this.pdfDocument) return null;
        try {
            let explicitDest = dest;
            if (typeof dest === 'string') explicitDest = await this.pdfDocument.getDestination(dest);
            if (!explicitDest?.[0]) return null;
            const pageIndex = await this.pdfDocument.getPageIndex(explicitDest[0]);
            return pageIndex + 1;
        } catch(e) { return null; }
    }

    /* ── Navigation ─────────────────────────────────────────── */
    nextPage() {
        if (!this.flipBook) return;
        this.flipBook.flipNext();
    }

    prevPage() {
        if (!this.flipBook) return;
        this.flipBook.flipPrev();
    }

    goToPage(pageNum) {
        if (!this.flipBook) return;
        pageNum = Math.max(1, Math.min(this.totalPages, pageNum));
        // StPageFlip uses 0-based page index
        this.flipBook.flip(pageNum - 1);
        this.currentPage = pageNum;
        this.updateUI();
    }

    /* ── Zoom ───────────────────────────────────────────────── */
    zoomIn() {
        this.zoomLevel = Math.min(3.0, this.zoomLevel + 0.25);
        this.rebuildFlipbook();
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.75, this.zoomLevel - 0.25);
        this.rebuildFlipbook();
    }

    zoomFit() {
        this.zoomLevel = 1.5;
        this.rebuildFlipbook();
    }

    async rebuildFlipbook() {
        if (!this.pdfDocument) return;
        this.loadingEl.style.display = 'flex';
        this.stage.style.display = 'none';
        this.loadingEl.querySelector('.flipbook-loading-text').textContent = 'Re-rendering pages…';
        await this.buildFlipbook();
        // Restore page position
        if (this.flipBook && this.currentPage > 1) {
            this.flipBook.turnToPage(this.currentPage - 1);
        }
    }

    updateZoomDisplay() {
        const pct = Math.round((this.zoomLevel / 1.5) * 100);
        if (this.zoomDisplay) this.zoomDisplay.textContent = pct + '%';
    }

    /* ── Download ───────────────────────────────────────────── */
    downloadPDF() {
        const a = document.createElement('a');
        a.href     = this.pdfUrl || 'TEV Report.pdf';
        a.download = 'Aurora-Scents-TEV-Report.pdf';
        a.click();
    }

    /* ── Fullscreen ─────────────────────────────────────────── */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.bookContainer.classList.toggle('fullscreen', this.isFullscreen);

        // Record toggle timestamp for cooldown checks
        this.fullscreenToggleTime = Date.now();

        // Force reset parent scrollbar to avoid layout trigger loops
        const viewportEl = document.getElementById('app-viewport');
        if (viewportEl) {
            viewportEl.scrollTop = 0;
        }

        const btn  = document.getElementById('btn-fullscreen');
        const icon = document.getElementById('fullscreen-icon');
        btn.classList.toggle('active', this.isFullscreen);

        if (this.isFullscreen) {
            icon.innerHTML = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>';
        } else {
            icon.innerHTML = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
        }

        // After layout settles, rebuild the flipbook at the new size
        setTimeout(() => this.rebuildFlipbook(), 150);
    }

    /* ── UI updates ─────────────────────────────────────────── */
    updateUI() {
        if (!this.pdfDocument) return;
        this.pageCurrent.textContent = this.currentPage;
        this.pageTotal.textContent   = this.totalPages;
        this.prevBtn.disabled = this.currentPage <= 1;
        this.nextBtn.disabled = this.currentPage >= this.totalPages;
        this.updateTOCActiveState();
    }

    updateTOCActiveState() {
        const items = this.container.querySelectorAll('.book-toc-item');
        let activeItem = null;
        items.forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.page) <= this.currentPage) activeItem = item;
        });
        if (activeItem) {
            activeItem.classList.add('active');
            const list = document.getElementById('book-toc-list');
            const ir   = activeItem.getBoundingClientRect();
            const lr   = list.getBoundingClientRect();
            if (ir.top < lr.top || ir.bottom > lr.bottom) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}
