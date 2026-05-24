// Aurora Scents — STATE 2: 3D Sensory Book Viewer
// Single-page PDF viewer with TOC sidebar, swipe gestures, zoom, fullscreen,
// selectable text layer, annotation hyperlinks, scroll-to-change-page

import { AudioContextEngine } from '../engines/audio-context.js';

export class BookViewer {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.currentPage = 1;
        this.totalPages = 0;
        this.isFlipping = false;
        this.zoomLevel = 1.0;
        this.baseFitZoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomStep = 0.25;
        this.audioEngine = new AudioContextEngine();
        this.soundEnabled = true;
        this.isFullscreen = false;
        this.pdfDocument = null;

        // Swipe tracking
        this.swipeStartX = 0;
        this.swipeStartY = 0;
        this.isSwiping = false;
        this.swipeThreshold = 60;

        // Scroll-to-change-page tracking
        this.scrollPageCooldown = false;

        // Hardcoded TOC from actual TEV Report.pdf structure
        this.tableOfContents = [
            { title: 'Cover Page', page: 1, level: 'chapter' },
            { title: 'Confidentiality Notice', page: 2, level: 'chapter' },
            { title: 'Table of Contents', page: 3, level: 'chapter' },
            { title: 'Executive Summary', page: 5, level: 'chapter' },
            { title: 'Strategic Objective', page: 5, level: 'sub' },
            { title: 'Key Findings & Recommendations', page: 7, level: 'sub' },
            { title: '1. Market Landscape & Industry Overview', page: 10, level: 'chapter' },
            { title: 'Global Fragrance Market Context', page: 10, level: 'sub' },
            { title: 'India Market Dynamics', page: 15, level: 'sub' },
            { title: 'White-Space Analysis', page: 20, level: 'sub' },
            { title: '2. Regulatory & Compliance Framework', page: 25, level: 'chapter' },
            { title: 'CDSCO Registration Requirements', page: 25, level: 'sub' },
            { title: 'Import Classification (HS 3303.00)', page: 30, level: 'sub' },
            { title: 'Dangerous Goods Compliance', page: 35, level: 'sub' },
            { title: 'Labeling & BIS Standards', page: 38, level: 'sub' },
            { title: '3. Competitive Intelligence', page: 42, level: 'chapter' },
            { title: 'Ajmal Perfumes', page: 42, level: 'sub' },
            { title: 'Armaf (Sterling Parfums)', page: 48, level: 'sub' },
            { title: 'Lattafa Perfumes', page: 52, level: 'sub' },
            { title: 'Strategic Positioning Matrix', page: 56, level: 'sub' },
            { title: '4. Brand Architecture & Identity', page: 60, level: 'chapter' },
            { title: 'Brand DNA & Heritage', page: 60, level: 'sub' },
            { title: 'Visual Identity System', page: 65, level: 'sub' },
            { title: 'Positioning Statement', page: 70, level: 'sub' },
            { title: '5. Product Portfolio Strategy', page: 75, level: 'chapter' },
            { title: 'Collection Framework', page: 75, level: 'sub' },
            { title: 'Hero SKU Selection', page: 80, level: 'sub' },
            { title: 'Miniature Trial Strategy', page: 88, level: 'sub' },
            { title: '6. Pricing & Financial Modeling', page: 95, level: 'chapter' },
            { title: 'Landed Cost Framework', page: 95, level: 'sub' },
            { title: 'Unit Economics Model', page: 102, level: 'sub' },
            { title: 'Sensitivity Analysis', page: 110, level: 'sub' },
            { title: 'Break-Even Projections', page: 118, level: 'sub' },
            { title: '7. Distribution & Channel Strategy', page: 125, level: 'chapter' },
            { title: 'D2C Platform Architecture', page: 125, level: 'sub' },
            { title: 'Marketplace Integration', page: 132, level: 'sub' },
            { title: 'Fulfillment & Logistics', page: 138, level: 'sub' },
            { title: '8. Marketing & Launch Strategy', page: 145, level: 'chapter' },
            { title: 'Digital Marketing Framework', page: 145, level: 'sub' },
            { title: 'Influencer & PR Strategy', page: 152, level: 'sub' },
            { title: 'Content Localization', page: 158, level: 'sub' },
            { title: '9. Operational Roadmap & Timeline', page: 165, level: 'chapter' },
            { title: 'Phase 1: Foundation (Days 0–30)', page: 165, level: 'sub' },
            { title: 'Phase 2: Build (Days 31–60)', page: 172, level: 'sub' },
            { title: 'Phase 3: Launch (Days 61–90)', page: 178, level: 'sub' },
            { title: '10. Risk Assessment & Mitigation', page: 185, level: 'chapter' },
            { title: 'Currency & Tariff Risk', page: 185, level: 'sub' },
            { title: 'Regulatory & Demand Risk', page: 192, level: 'sub' },
            { title: 'Scenario Analysis (3-Case)', page: 198, level: 'sub' },
            { title: '11. Strategic Recommendations', page: 205, level: 'chapter' },
            { title: 'Go / No-Go Decision Framework', page: 205, level: 'sub' },
            { title: 'Investment Requirements', page: 210, level: 'sub' },
            { title: 'Appendices', page: 218, level: 'chapter' },
            { title: 'Financial Model Assumptions', page: 218, level: 'sub' },
            { title: 'Regulatory Checklist', page: 230, level: 'sub' },
            { title: 'Product Catalog', page: 242, level: 'sub' },
            { title: 'Glossary & References', page: 255, level: 'sub' },
        ];

        this.render();
        this.bindEvents();
        this.loadPDF('TEV Report.pdf');
    }

    render() {
        this.container.innerHTML = `
            <div class="book-container" id="book-container">
                <!-- TOC Sidebar -->
                <div class="book-toc-sidebar">
                    <div class="book-toc-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        Table of Contents
                    </div>
                    <ul class="book-toc-list" id="book-toc-list"></ul>
                </div>

                <!-- Viewer Panel -->
                <div class="book-viewer-main">
                    <!-- Toolbar -->
                    <div class="book-toolbar">
                        <div class="book-toolbar-group">
                            <button class="book-toolbar-btn nav-btn" id="btn-prev" title="Previous Page" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <div class="page-indicator">
                                <span id="page-current">0</span> / <span id="page-total">0</span>
                            </div>
                            <button class="book-toolbar-btn nav-btn" id="btn-next" title="Next Page" disabled>
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
                            <button class="book-toolbar-btn" id="btn-zoom-fit" title="Fit to Page">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                            </button>
                        </div>

                        <div class="toolbar-spacer"></div>

                        <div class="book-toolbar-group">
                            <button class="book-toolbar-btn active" id="btn-sound" title="Toggle Sound">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="sound-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            </button>
                            <button class="book-toolbar-btn" id="btn-fullscreen" title="Toggle Fullscreen (F)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="fullscreen-icon"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- PDF Viewport -->
                    <div class="book-viewport" id="book-viewport">
                        <div class="pdf-page-wrapper" id="pdf-page-wrapper">
                            <canvas id="pdf-canvas"></canvas>
                            <div class="pdf-text-layer" id="pdf-text-layer"></div>
                            <div class="pdf-annotation-layer" id="pdf-annotation-layer"></div>
                            <div class="flip-overlay" id="flip-overlay"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cache DOM
        this.bookContainer = document.getElementById('book-container');
        this.prevBtn = document.getElementById('btn-prev');
        this.nextBtn = document.getElementById('btn-next');
        this.pageCurrent = document.getElementById('page-current');
        this.pageTotal = document.getElementById('page-total');
        this.zoomDisplay = document.getElementById('zoom-display');
        this.viewport = document.getElementById('book-viewport');
        this.pageWrapper = document.getElementById('pdf-page-wrapper');
        this.canvas = document.getElementById('pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.textLayerDiv = document.getElementById('pdf-text-layer');
        this.annotationLayerDiv = document.getElementById('pdf-annotation-layer');
        this.flipOverlay = document.getElementById('flip-overlay');

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
                if (page && page !== this.currentPage) {
                    this.goToPage(page);
                }
            });
        });
    }

    bindEvents() {
        // Navigation
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            const section = document.getElementById('section-book-viewer');
            if (!section || !section.classList.contains('active')) return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevPage();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                this.zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            } else if (e.key === 'Escape' && this.isFullscreen) {
                this.toggleFullscreen();
            } else if (e.key === 'f' || e.key === 'F') {
                // Don't trigger if user is typing in an input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                e.preventDefault();
                this.toggleFullscreen();
            }
        });

        // Sound toggle
        document.getElementById('btn-sound').addEventListener('click', (e) => {
            this.soundEnabled = !this.soundEnabled;
            const btn = e.currentTarget;
            btn.classList.toggle('active', this.soundEnabled);
            this.audioEngine.isEnabled = this.soundEnabled;
            const icon = document.getElementById('sound-icon');
            if (this.soundEnabled) {
                icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
            } else {
                icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
            }
        });

        // Zoom controls
        document.getElementById('btn-zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('btn-zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-fit').addEventListener('click', () => this.zoomFit());

        // Fullscreen
        document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());

        // --- Swipe gestures (touch) ---
        this.viewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.swipeStartX = e.touches[0].clientX;
                this.swipeStartY = e.touches[0].clientY;
                this.isSwiping = true;
            }
        }, { passive: true });

        this.viewport.addEventListener('touchend', (e) => {
            if (!this.isSwiping) return;
            this.isSwiping = false;
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.swipeStartX;
            const deltaY = touch.clientY - this.swipeStartY;
            if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                if (deltaX < 0) this.nextPage();
                else this.prevPage();
            }
        }, { passive: true });

        // --- Mouse swipe gestures (desktop drag) ---
        this.viewport.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            // Don't start swipe on text layer selections
            if (e.target.closest('.pdf-text-layer') || e.target.closest('.pdf-annotation-layer')) return;
            this.swipeStartX = e.clientX;
            this.swipeStartY = e.clientY;
            this.isSwiping = true;
            this.viewport.classList.add('swiping');
        });

        document.addEventListener('mouseup', (e) => {
            if (!this.isSwiping) return;
            this.isSwiping = false;
            this.viewport.classList.remove('swiping');
            const deltaX = e.clientX - this.swipeStartX;
            const deltaY = e.clientY - this.swipeStartY;
            if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                if (deltaX < 0) this.nextPage();
                else this.prevPage();
            }
        });

        // --- Scroll behavior: zoom with Ctrl+Wheel, page change at scroll boundaries ---
        this.viewport.addEventListener('wheel', (e) => {
            // Ctrl + Wheel = zoom
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) this.zoomIn();
                else this.zoomOut();
                return;
            }

            // Check if viewport actually has scrollable overflow
            const el = this.viewport;
            const hasOverflow = el.scrollHeight > el.clientHeight + 2;
            const atBottom = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 2;
            const atTop = el.scrollTop < 2;

            // If no overflow (page fits), handle page changes OR let event propagate
            if (!hasOverflow) {
                // Scrolling down → next page if available, else let website scroll
                if (e.deltaY > 0 && this.currentPage < this.totalPages) {
                    e.preventDefault();
                    if (!this.scrollPageCooldown) {
                        this.scrollPageCooldown = true;
                        this.nextPage();
                        setTimeout(() => { this.scrollPageCooldown = false; }, 600);
                    }
                } else if (e.deltaY < 0 && this.currentPage > 1) {
                    e.preventDefault();
                    if (!this.scrollPageCooldown) {
                        this.scrollPageCooldown = true;
                        this.prevPage();
                        setTimeout(() => { this.scrollPageCooldown = false; }, 600);
                    }
                }
                // If no valid page change, let event propagate naturally (website scrolls)
                return;
            }

            // Viewport HAS overflow (zoomed in) — change page only at boundaries
            if (atBottom && e.deltaY > 0 && this.currentPage < this.totalPages) {
                e.preventDefault();
                if (!this.scrollPageCooldown) {
                    this.scrollPageCooldown = true;
                    this.nextPage().then(() => {
                        this.viewport.scrollTop = 0;
                    });
                    setTimeout(() => { this.scrollPageCooldown = false; }, 600);
                }
            } else if (atTop && e.deltaY < 0 && this.currentPage > 1) {
                e.preventDefault();
                if (!this.scrollPageCooldown) {
                    this.scrollPageCooldown = true;
                    this.prevPage().then(() => {
                        this.viewport.scrollTop = this.viewport.scrollHeight;
                    });
                    setTimeout(() => { this.scrollPageCooldown = false; }, 600);
                }
            }
            // If at top scrolling up on page 1, or at bottom scrolling down on last page,
            // event propagates naturally → website/parent scrolls
        }, { passive: false });
    }

    async loadPDF(url) {
        try {
            this.viewport.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--accent-gold);gap:16px;">
                    <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
                    <div style="font-size:0.85rem;">Loading TEV Document...</div>
                </div>
            `;

            const loadingTask = window.pdfjsLib.getDocument(url);
            this.pdfDocument = await loadingTask.promise;
            this.totalPages = this.pdfDocument.numPages;

            // Restore viewport structure
            this.viewport.innerHTML = `
                <div class="pdf-page-wrapper" id="pdf-page-wrapper">
                    <canvas id="pdf-canvas"></canvas>
                    <div class="pdf-text-layer" id="pdf-text-layer"></div>
                    <div class="pdf-annotation-layer" id="pdf-annotation-layer"></div>
                    <div class="flip-overlay" id="flip-overlay"></div>
                </div>
            `;

            this.pageWrapper = document.getElementById('pdf-page-wrapper');
            this.canvas = document.getElementById('pdf-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.textLayerDiv = document.getElementById('pdf-text-layer');
            this.annotationLayerDiv = document.getElementById('pdf-annotation-layer');
            this.flipOverlay = document.getElementById('flip-overlay');

            await this.calculateFitZoom();
            await this.renderPage(this.currentPage);
            this.updateUI();

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.viewport.innerHTML = `
                <div style="color:var(--accent-red);padding:32px;text-align:center;font-size:0.9rem;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:0.5;">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg><br>
                    Failed to load TEV Report.pdf<br>
                    <span style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;display:inline-block;">Ensure the file is in the root directory.</span>
                </div>
            `;
        }
    }

    async calculateFitZoom() {
        if (!this.pdfDocument) return;
        const page = await this.pdfDocument.getPage(1);
        const unscaledVP = page.getViewport({ scale: 1.0 });

        const viewportRect = this.viewport.getBoundingClientRect();
        const availHeight = viewportRect.height - 32;
        const availWidth = viewportRect.width - 32;

        const fitScale = Math.min(
            availWidth / unscaledVP.width,
            availHeight / unscaledVP.height
        );

        this.zoomLevel = fitScale;
        this.baseFitZoom = fitScale;
        this.updateZoomDisplay();
    }

    async renderPage(pageNum) {
        if (!this.pdfDocument || pageNum < 1 || pageNum > this.totalPages) return;

        try {
            const page = await this.pdfDocument.getPage(pageNum);
            const dpr = window.devicePixelRatio || 1;

            // Display viewport (for CSS sizing & text/annotation positioning)
            const displayViewport = page.getViewport({ scale: this.zoomLevel });

            // Render viewport (multiplied by DPR for crisp rendering)
            const renderScale = this.zoomLevel * dpr;
            const renderViewport = page.getViewport({ scale: renderScale });

            // Size canvas for high-DPI render
            this.canvas.width = renderViewport.width;
            this.canvas.height = renderViewport.height;

            // CSS display size matches the logical viewport
            this.canvas.style.width = displayViewport.width + 'px';
            this.canvas.style.height = displayViewport.height + 'px';

            // Render PDF page
            const renderContext = {
                canvasContext: this.ctx,
                viewport: renderViewport
            };
            await page.render(renderContext).promise;

            // Render text layer for selectable text
            await this.renderTextLayer(page, displayViewport);

            // Render annotation layer for hyperlinks
            await this.renderAnnotationLayer(page, displayViewport);

        } catch (error) {
            console.error('Error rendering page', pageNum, error);
        }
    }

    async renderTextLayer(page, viewport) {
        // Clear previous text layer
        this.textLayerDiv.innerHTML = '';
        this.textLayerDiv.style.width = viewport.width + 'px';
        this.textLayerDiv.style.height = viewport.height + 'px';

        try {
            const textContent = await page.getTextContent();

            // Use the PDF.js renderTextLayer API
            const textLayerParams = {
                textContentSource: textContent,
                container: this.textLayerDiv,
                viewport: viewport,
                textDivs: []
            };

            // PDF.js 3.x uses renderTextLayer which returns an object with a promise
            const textLayer = window.pdfjsLib.renderTextLayer(textLayerParams);
            await textLayer.promise;
        } catch (error) {
            // Text layer is optional — don't fail the whole render
            console.warn('Text layer render failed:', error);
        }
    }

    async renderAnnotationLayer(page, viewport) {
        // Clear previous annotation layer
        this.annotationLayerDiv.innerHTML = '';
        this.annotationLayerDiv.style.width = viewport.width + 'px';
        this.annotationLayerDiv.style.height = viewport.height + 'px';

        try {
            const annotations = await page.getAnnotations();

            for (const annot of annotations) {
                if (annot.subtype !== 'Link') continue;
                if (!annot.rect) continue;

                // Convert PDF coordinates to viewport coordinates
                const rect = viewport.convertToViewportRectangle(annot.rect);

                // rect = [x1, y1, x2, y2] but may be inverted
                const left = Math.min(rect[0], rect[2]);
                const top = Math.min(rect[1], rect[3]);
                const width = Math.abs(rect[2] - rect[0]);
                const height = Math.abs(rect[3] - rect[1]);

                const linkEl = document.createElement('div');
                linkEl.className = 'pdf-link';
                linkEl.style.left = left + 'px';
                linkEl.style.top = top + 'px';
                linkEl.style.width = width + 'px';
                linkEl.style.height = height + 'px';

                // Handle different link types
                if (annot.dest) {
                    // Internal named destination
                    linkEl.title = 'Go to: ' + (typeof annot.dest === 'string' ? annot.dest : 'section');
                    linkEl.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetPage = await this.resolveDestination(annot.dest);
                        if (targetPage) this.goToPage(targetPage);
                    });
                } else if (annot.newWindow && annot.url) {
                    // External URL
                    linkEl.title = annot.url;
                    linkEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(annot.url, '_blank', 'noopener');
                    });
                } else if (annot.action === 'GoTo' && annot.dest) {
                    linkEl.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetPage = await this.resolveDestination(annot.dest);
                        if (targetPage) this.goToPage(targetPage);
                    });
                } else if (annot.unsafeUrl) {
                    // Some PDFs use unsafeUrl for external links
                    linkEl.title = annot.unsafeUrl;
                    linkEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(annot.unsafeUrl, '_blank', 'noopener');
                    });
                }

                this.annotationLayerDiv.appendChild(linkEl);
            }
        } catch (error) {
            console.warn('Annotation layer render failed:', error);
        }
    }

    async resolveDestination(dest) {
        if (!dest || !this.pdfDocument) return null;
        try {
            let explicitDest = dest;
            if (typeof dest === 'string') {
                explicitDest = await this.pdfDocument.getDestination(dest);
            }
            if (!explicitDest || !explicitDest[0]) return null;
            const ref = explicitDest[0];
            const pageIndex = await this.pdfDocument.getPageIndex(ref);
            return pageIndex + 1; // 1-indexed
        } catch (e) {
            console.warn('Could not resolve destination:', e);
            return null;
        }
    }

    playFlipAnimation(direction) {
        this.flipOverlay.classList.remove('flipping-next', 'flipping-prev');
        void this.flipOverlay.offsetWidth;
        this.flipOverlay.classList.add(direction === 'next' ? 'flipping-next' : 'flipping-prev');

        this.pageWrapper.classList.remove('page-entering');
        void this.pageWrapper.offsetWidth;
        this.pageWrapper.classList.add('page-entering');
    }

    async nextPage() {
        if (!this.pdfDocument || this.isFlipping || this.currentPage >= this.totalPages) return;
        this.isFlipping = true;

        if (!this.audioEngine.isInitialized) this.audioEngine.init();
        if (this.soundEnabled) this.audioEngine.triggerMechanicalFlipSound();

        this.playFlipAnimation('next');

        this.currentPage++;
        await this.renderPage(this.currentPage);
        this.updateUI();

        setTimeout(() => { this.isFlipping = false; }, 450);
    }

    async prevPage() {
        if (!this.pdfDocument || this.isFlipping || this.currentPage <= 1) return;
        this.isFlipping = true;

        if (!this.audioEngine.isInitialized) this.audioEngine.init();
        if (this.soundEnabled) this.audioEngine.triggerMechanicalFlipSound();

        this.playFlipAnimation('prev');

        this.currentPage--;
        await this.renderPage(this.currentPage);
        this.updateUI();

        setTimeout(() => { this.isFlipping = false; }, 450);
    }

    async goToPage(pageNum) {
        if (!this.pdfDocument || this.isFlipping) return;
        if (pageNum < 1) pageNum = 1;
        if (pageNum > this.totalPages) pageNum = this.totalPages;
        if (pageNum === this.currentPage) return;

        this.isFlipping = true;

        if (!this.audioEngine.isInitialized) this.audioEngine.init();
        if (this.soundEnabled) this.audioEngine.triggerMechanicalFlipSound();

        const direction = pageNum > this.currentPage ? 'next' : 'prev';
        this.playFlipAnimation(direction);

        this.currentPage = pageNum;
        await this.renderPage(this.currentPage);
        this.updateUI();

        this.viewport.scrollTop = 0;

        setTimeout(() => { this.isFlipping = false; }, 450);
    }

    zoomIn() {
        if (this.zoomLevel >= this.maxZoom) return;
        this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
        this.applyZoom();
    }

    zoomOut() {
        if (this.zoomLevel <= this.minZoom) return;
        this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
        this.applyZoom();
    }

    zoomFit() {
        this.calculateFitZoom().then(() => this.applyZoom());
    }

    async applyZoom() {
        this.updateZoomDisplay();
        await this.renderPage(this.currentPage);
    }

    updateZoomDisplay() {
        const pct = Math.round((this.zoomLevel / (this.baseFitZoom || 1)) * 100);
        this.zoomDisplay.textContent = pct + '%';
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.bookContainer.classList.toggle('fullscreen', this.isFullscreen);

        const btn = document.getElementById('btn-fullscreen');
        btn.classList.toggle('active', this.isFullscreen);

        const icon = document.getElementById('fullscreen-icon');
        if (this.isFullscreen) {
            icon.innerHTML = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>';
        } else {
            icon.innerHTML = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
        }

        setTimeout(() => {
            this.calculateFitZoom().then(() => this.renderPage(this.currentPage));
        }, 100);
    }

    updateUI() {
        if (!this.pdfDocument) return;

        this.pageCurrent.textContent = this.currentPage;
        this.pageTotal.textContent = this.totalPages;

        this.prevBtn.disabled = this.currentPage <= 1;
        this.nextBtn.disabled = this.currentPage >= this.totalPages;

        this.updateTOCActiveState();
    }

    updateTOCActiveState() {
        const items = this.container.querySelectorAll('.book-toc-item');
        let activeItem = null;

        items.forEach(item => {
            item.classList.remove('active');
            const page = parseInt(item.dataset.page);
            if (page <= this.currentPage) {
                activeItem = item;
            }
        });

        if (activeItem) {
            activeItem.classList.add('active');
            const list = document.getElementById('book-toc-list');
            const itemRect = activeItem.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
            if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}
