// Aurora Scents — Interactive Strategy Mind Map
// Fully coded SVG-based mind map with click-to-expand nodes
// Brand colors: gold #D4AF37, dark backgrounds

export class MindMap {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        // ── Mind Map Data ────────────────────────────────────────────────
        this.data = {
            id: 'root',
            label: 'Aurora Scents\nIndia Market Entry Study',
            children: [
                {
                    id: 'n1',
                    label: 'Snapshot of India\nOpportunity',
                    children: [
                        { id: 'n1a', label: 'Market Momentum\n(INR 45.9B in 2024)' },
                        { id: 'n1b', label: 'Premium Category\nGrowth (17%)' },
                        { id: 'n1c', label: 'Rising Daily Usage\nFrequency (50%)' },
                        { id: 'n1d', label: 'Digital & Quick-\nCommerce Shift' },
                    ]
                },
                {
                    id: 'n2',
                    label: 'Brand Identity\n& Portfolio',
                    children: [
                        { id: 'n2a', label: 'Premium Heritage\nFragrance House' },
                        { id: 'n2b', label: 'Arabian Richness &\nEuropean Refinement' },
                        { id: 'n2c', label: 'Collection-Led\nArchitecture' },
                        { id: 'n2d', label: 'High Gifting &\nBottle Theater' },
                        { id: 'n2e', label: 'Alcohol-Based\nEDP Formats' },
                    ]
                },
                {
                    id: 'n3',
                    label: 'Launch\nRecommendations',
                    children: [
                        {
                            id: 'n3a',
                            label: 'Phased Entry Model',
                            children: [
                                { id: 'n3a1', label: 'Phase 1: Curated\nDigital Launch' },
                                { id: 'n3a2', label: 'Phase 2: Data-Led\nOptimization' },
                                { id: 'n3a3', label: 'Phase 3: Controlled\nExpansion' },
                            ]
                        },
                        {
                            id: 'n3b',
                            label: 'Positioning Strategy',
                            children: [
                                { id: 'n3b1', label: 'Accessible Premium\n(Affordable Luxury)' },
                                { id: 'n3b2', label: 'Identity & Lifestyle\nSignaling' },
                                { id: 'n3b3', label: 'Performance &\nLongevity Narrative' },
                            ]
                        },
                        {
                            id: 'n3c',
                            label: 'Channel Prioritization',
                            children: [
                                { id: 'n3c1', label: 'Amazon (Priority 1)' },
                                { id: 'n3c2', label: 'D2C Brand Website' },
                                { id: 'n3c3', label: 'Premium Marketplaces\n(Nykaa/Myntra)' },
                                { id: 'n3c4', label: 'Discovery &\nTrial Formats' },
                            ]
                        },
                    ]
                },
                {
                    id: 'n4',
                    label: 'Pricing\nArchitecture',
                    children: [
                        { id: 'n4a', label: 'Tier 1: Entry Premium\n(Trial Friendly)' },
                        { id: 'n4b', label: 'Tier 2: Core\nAccessible Premium' },
                        { id: 'n4c', label: 'Tier 3: Premium\nStatement (Gifting)' },
                        { id: 'n4d', label: 'Wholesale-Led\nFeasibility Modelling' },
                    ]
                },
                {
                    id: 'n5',
                    label: 'Critical Success\nConditions',
                    children: [
                        { id: 'n5a', label: 'Strict SKU\nDiscipline (Curation)' },
                        { id: 'n5b', label: 'Mobile-First\nAsset Execution' },
                        { id: 'n5c', label: 'Operational &\nCompliance Readiness' },
                        { id: 'n5d', label: 'Alcohol-Based\nLogistics Discipline' },
                    ]
                },
                {
                    id: 'n6',
                    label: 'Risk Identification\n& Mitigation',
                    children: [
                        { id: 'n6a', label: 'Over-SKU\nComplexity Risk' },
                        { id: 'n6b', label: 'Pricing War with\nME Brands' },
                        { id: 'n6c', label: 'Marketplace\nDependency' },
                        { id: 'n6d', label: 'CDSCO\nRegulatory Gating' },
                    ]
                },
                {
                    id: 'n7',
                    label: '90-Day\nImplementation Plan',
                    children: [
                        { id: 'n7a', label: 'Days 0-30:\nPre-Launch Readiness' },
                        { id: 'n7b', label: 'Days 31-60:\nAsset & Content Build' },
                        { id: 'n7c', label: 'Days 61-90:\nControlled Market Launch' },
                    ]
                },
            ]
        };

        // ── State ─────────────────────────────────────────────────────────
        this.expandedNodes = new Set(['root']); // root always expanded
        this.isFullscreen = false;

        // ── Layout constants ──────────────────────────────────────────────
        // Node dimensions
        this.ROOT_W = 140; this.ROOT_H = 64;
        this.L1_W = 170; this.L1_H = 56;
        this.L2_W = 160; this.L2_H = 52;
        this.L3_W = 150; this.L3_H = 48;

        // Gaps
        this.COL_GAP = 80;      // horizontal gap between levels
        this.ROW_GAP = 18;      // vertical gap between siblings

        this.render();
    }

    // ── Rendering ─────────────────────────────────────────────────────────

    render() {
        this.container.innerHTML = `
            <div class="mm2-shell" id="mm2-shell">
                <div class="mm2-toolbar">
                    <span class="mm2-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:.7">
                            <circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/>
                            <circle cx="19" cy="19" r="2"/><circle cx="5" cy="5" r="2"/>
                            <line x1="12" y1="12" x2="19" y2="5"/><line x1="12" y1="12" x2="5" y2="19"/>
                            <line x1="12" y1="12" x2="19" y2="19"/><line x1="12" y1="12" x2="5" y2="5"/>
                        </svg>
                        Strategy Mind Map
                    </span>
                    <div class="mm2-toolbar-right">
                        <button class="mm2-btn" id="mm2-collapse-all" title="Collapse All">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17 1 12 6 7 1"/><polyline points="17 23 12 18 7 23"/>
                                <line x1="12" y1="6" x2="12" y2="18"/>
                            </svg>
                            Collapse All
                        </button>
                        <button class="mm2-btn" id="mm2-expand-all" title="Expand All">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="7 20 12 15 17 20"/><polyline points="7 4 12 9 17 4"/>
                                <line x1="12" y1="9" x2="12" y2="15"/>
                            </svg>
                            Expand All
                        </button>
                        <div class="mm2-divider"></div>
                        <button class="mm2-btn" id="mm2-zoom-out" title="Zoom Out">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        </button>
                        <span class="mm2-zoom-val" id="mm2-zoom-val">100%</span>
                        <button class="mm2-btn" id="mm2-zoom-in" title="Zoom In">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        </button>
                        <button class="mm2-btn" id="mm2-zoom-reset" title="Reset Zoom">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
                        </button>
                        <div class="mm2-divider"></div>
                        <button class="mm2-btn" id="mm2-fullscreen" title="Toggle Fullscreen">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="mm2-fs-icon"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                        </button>
                    </div>
                </div>

                <div class="mm2-hint" id="mm2-hint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Click any node to expand or collapse &nbsp;·&nbsp; Drag to pan
                </div>

                <div class="mm2-viewport" id="mm2-viewport">
                    <div class="mm2-canvas" id="mm2-canvas">
                        <svg class="mm2-svg" id="mm2-svg" xmlns="http://www.w3.org/2000/svg"></svg>
                        <div class="mm2-nodes" id="mm2-nodes"></div>
                    </div>
                </div>
            </div>
        `;

        this.shell = document.getElementById('mm2-shell');
        this.viewport = document.getElementById('mm2-viewport');
        this.canvas = document.getElementById('mm2-canvas');
        this.svg = document.getElementById('mm2-svg');
        this.nodesEl = document.getElementById('mm2-nodes');
        this.zoomVal = document.getElementById('mm2-zoom-val');
        this.hint = document.getElementById('mm2-hint');

        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;

        this.bindToolbar();
        this.bindPan();
        this.drawMap();
        this.centerMap();

        // Hide hint after 5s
        setTimeout(() => {
            if (this.hint) this.hint.classList.add('mm2-hint-hidden');
        }, 5000);
    }

    // ── Layout Engine ─────────────────────────────────────────────────────

    /** Recursively compute size of subtree when expanded */
    subtreeHeight(node) {
        if (!node.children || !node.children.length || !this.expandedNodes.has(node.id)) {
            return this.nodeH(node);
        }
        const childrenH = node.children.reduce((sum, c) => sum + this.subtreeHeight(c), 0)
            + (node.children.length - 1) * this.ROW_GAP;
        return Math.max(this.nodeH(node), childrenH);
    }

    nodeH(node) {
        if (node.id === 'root') return this.ROOT_H;
        const depth = this.nodeDepth(node.id);
        if (depth === 1) return this.L1_H;
        if (depth === 2) return this.L2_H;
        return this.L3_H;
    }

    nodeW(node) {
        if (node.id === 'root') return this.ROOT_W;
        const depth = this.nodeDepth(node.id);
        if (depth === 1) return this.L1_W;
        if (depth === 2) return this.L2_W;
        return this.L3_W;
    }

    nodeDepth(id) {
        if (id === 'root') return 0;
        if (id.match(/^n\d+$/)) return 1;
        if (id.match(/^n\d+[a-z]$/)) return 2;
        return 3;
    }

    /** Recursively assign x/y to every visible node */
    layoutNode(node, x, y) {
        const w = this.nodeW(node);
        const h = this.nodeH(node);
        const nodeTop = y + (this.subtreeHeight(node) - h) / 2;

        node._x = x;
        node._y = nodeTop;
        node._w = w;
        node._h = h;

        if (node.children && node.children.length && this.expandedNodes.has(node.id)) {
            const childX = x + w + this.COL_GAP;
            let childY = y;
            node.children.forEach(child => {
                this.layoutNode(child, childX, childY);
                childY += this.subtreeHeight(child) + this.ROW_GAP;
            });
        }
    }

    /** Walk all visible nodes and find bounding box */
    allNodes(node, acc = []) {
        acc.push(node);
        if (node.children && this.expandedNodes.has(node.id)) {
            node.children.forEach(c => this.allNodes(c, acc));
        }
        return acc;
    }

    drawMap() {
        // Layout
        this.layoutNode(this.data, 40, 40);
        const nodes = this.allNodes(this.data);

        // Canvas size
        const maxX = Math.max(...nodes.map(n => n._x + n._w)) + 60;
        const maxY = Math.max(...nodes.map(n => n._y + n._h)) + 60;

        this.canvas.style.width = maxX + 'px';
        this.canvas.style.height = maxY + 'px';
        this.svg.setAttribute('width', maxX);
        this.svg.setAttribute('height', maxY);

        // Draw SVG connectors
        this.svg.innerHTML = this.buildConnectors(this.data);

        // Draw HTML nodes
        this.nodesEl.innerHTML = '';
        nodes.forEach(n => this.createNodeEl(n));
    }

    buildConnectors(node, lines = '') {
        if (!node.children || !node.children.length || !this.expandedNodes.has(node.id)) {
            return lines;
        }
        node.children.forEach(child => {
            const x1 = node._x + node._w;
            const y1 = node._y + node._h / 2;
            const x2 = child._x;
            const y2 = child._y + child._h / 2;
            const cx1 = x1 + (x2 - x1) * 0.45;
            const cx2 = x2 - (x2 - x1) * 0.45;

            // color by depth
            const depth = this.nodeDepth(child.id);
            let stroke = '#D4AF37';
            if (depth === 2) stroke = 'rgba(212,175,55,0.65)';
            if (depth === 3) stroke = 'rgba(212,175,55,0.38)';

            lines += `<path d="M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}"
                fill="none" stroke="${stroke}" stroke-width="${depth === 1 ? 1.8 : 1.2}"
                stroke-linecap="round" class="mm2-connector"/>`;

            lines = this.buildConnectors(child, lines);
        });
        return lines;
    }

    createNodeEl(node) {
        const depth = this.nodeDepth(node.id);
        const hasKids = node.children && node.children.length > 0;
        const isExpanded = this.expandedNodes.has(node.id);

        const el = document.createElement('div');
        el.className = `mm2-node mm2-d${depth}${hasKids ? ' mm2-has-children' : ''}${isExpanded ? ' mm2-expanded' : ''}`;
        el.id = `mmnode-${node.id}`;
        el.style.cssText = `left:${node._x}px;top:${node._y}px;width:${node._w}px;min-height:${node._h}px`;

        const labelLines = node.label.split('\n');
        const labelHtml = labelLines.map(l => `<span>${l}</span>`).join('');

        let toggleBtn = '';
        if (hasKids) {
            toggleBtn = `<div class="mm2-toggle" aria-label="${isExpanded ? 'Collapse' : 'Expand'}">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="mm2-toggle-v"/>
                    <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </div>`;
        }

        el.innerHTML = `<div class="mm2-node-inner">${labelHtml}</div>${toggleBtn}`;

        if (hasKids) {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(node.id);
            });
        }

        this.nodesEl.appendChild(el);
    }

    toggleNode(id) {
        if (this.expandedNodes.has(id)) {
            this.collapseNode(id);
        } else {
            this.expandedNodes.add(id);
        }
        this.drawMap();
    }

    collapseNode(id) {
        this.expandedNodes.delete(id);
        // Also collapse all descendants
        const collapseChildren = (node) => {
            if (!node.children) return;
            node.children.forEach(c => {
                this.expandedNodes.delete(c.id);
                collapseChildren(c);
            });
        };
        const find = (node) => {
            if (node.id === id) { collapseChildren(node); return; }
            if (node.children) node.children.forEach(find);
        };
        find(this.data);
    }

    centerMap() {
        // Position canvas so map is nicely centered/visible on load
        const vw = this.viewport.clientWidth;
        const vh = this.viewport.clientHeight;
        const cw = parseFloat(this.canvas.style.width) || 800;
        const ch = parseFloat(this.canvas.style.height) || 600;

        if (cw < vw) {
            this.viewport.scrollLeft = 0;
        } else {
            this.viewport.scrollLeft = 0; // Start at left (root is on left)
        }
        // Vertically center
        this.viewport.scrollTop = Math.max(0, (ch - vh) / 2);
    }

    // ── Toolbar ───────────────────────────────────────────────────────────

    bindToolbar() {
        document.getElementById('mm2-zoom-in').addEventListener('click', () => this.zoom(0.15));
        document.getElementById('mm2-zoom-out').addEventListener('click', () => this.zoom(-0.15));
        document.getElementById('mm2-zoom-reset').addEventListener('click', () => this.setZoom(1));
        document.getElementById('mm2-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('mm2-expand-all').addEventListener('click', () => this.expandAll());
        document.getElementById('mm2-collapse-all').addEventListener('click', () => this.collapseAll());

        document.addEventListener('keydown', (e) => {
            const section = document.getElementById('section-mindmap');
            if (!section?.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoom(0.15); }
            else if (e.key === '-') { e.preventDefault(); this.zoom(-0.15); }
            else if (e.key === '0') { e.preventDefault(); this.setZoom(1); }
            else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.toggleFullscreen(); }
            else if (e.key === 'Escape' && this.isFullscreen) { this.toggleFullscreen(); }
        });
    }

    zoom(delta) {
        const next = Math.min(2.5, Math.max(0.3, this.scale + delta));
        this.setZoom(next);
    }

    setZoom(val) {
        this.scale = val;
        this.canvas.style.transform = `scale(${this.scale})`;
        this.canvas.style.transformOrigin = 'top left';
        this.zoomVal.textContent = Math.round(this.scale * 100) + '%';
    }

    expandAll() {
        const walk = (node) => {
            if (node.children && node.children.length) {
                this.expandedNodes.add(node.id);
                node.children.forEach(walk);
            }
        };
        walk(this.data);
        this.drawMap();
    }

    collapseAll() {
        this.expandedNodes = new Set(['root']);
        this.drawMap();
    }

    // ── Pan (mouse drag) ──────────────────────────────────────────────────

    bindPan() {
        let isDown = false, startX, startY, sL, sT;

        this.viewport.addEventListener('mousedown', (e) => {
            if (e.target.closest('.mm2-node')) return; // don't pan when clicking nodes
            isDown = true;
            this.viewport.classList.add('mm2-grabbing');
            startX = e.pageX;
            startY = e.pageY;
            sL = this.viewport.scrollLeft;
            sT = this.viewport.scrollTop;
        });

        window.addEventListener('mouseup', () => {
            isDown = false;
            this.viewport.classList.remove('mm2-grabbing');
        });

        this.viewport.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            this.viewport.scrollLeft = sL - (e.pageX - startX);
            this.viewport.scrollTop = sT - (e.pageY - startY);
        });

        // Touch pan
        let tStartX, tStartY, tSL, tST;
        this.viewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                tStartX = e.touches[0].pageX;
                tStartY = e.touches[0].pageY;
                tSL = this.viewport.scrollLeft;
                tST = this.viewport.scrollTop;
            }
        }, { passive: true });

        this.viewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const dx = tStartX - e.touches[0].pageX;
                const dy = tStartY - e.touches[0].pageY;
                this.viewport.scrollLeft = tSL + dx;
                this.viewport.scrollTop = tST + dy;
            }
        }, { passive: true });
    }

    // ── Fullscreen ────────────────────────────────────────────────────────

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.shell.classList.toggle('mm2-fullscreen', this.isFullscreen);
        document.body.style.overflow = this.isFullscreen ? 'hidden' : '';

        const icon = document.getElementById('mm2-fs-icon');
        if (this.isFullscreen) {
            icon.innerHTML = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="21" y2="3"/><line x1="3" y1="21" x2="14" y2="10"/>';
        } else {
            icon.innerHTML = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
        }
    }
}
