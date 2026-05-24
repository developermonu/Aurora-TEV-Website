// Aurora Scents — STATE 5: Competitor Strategy Canvas
// Interactive 2x2 positioning matrix with animated nodes

import { COMPETITORS, AURORA_POSITION, AXIS_LABELS, QUADRANT_LABELS } from '../data/competitors.js';

export class CompetitorCanvas {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.filters = {};
        COMPETITORS.forEach(c => this.filters[c.id] = true);
        this.filters['aurora'] = true;
        this.selectedCompetitor = null;

        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="competitor-layout">
                <!-- Filter toggles -->
                <div class="canvas-filters" id="canvas-filters">
                    <span style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-right: 8px;">Filter:</span>
                    ${COMPETITORS.map(c => `
                        <button class="filter-toggle active" data-filter="${c.id}">
                            <div class="filter-dot" style="background: ${c.color};"></div>
                            ${c.name}
                        </button>
                    `).join('')}
                    <button class="filter-toggle active" data-filter="aurora">
                        <div class="filter-dot" style="background: ${AURORA_POSITION.color};"></div>
                        Aurora Scents (White-Space)
                    </button>
                </div>

                <!-- Canvas -->
                <div class="canvas-container" id="canvas-container">
                    <div class="canvas-grid" id="canvas-grid">
                        <!-- Axes -->
                        <div class="canvas-axis canvas-axis-x"></div>
                        <div class="canvas-axis canvas-axis-y"></div>

                        <!-- Axis Labels -->
                        <div class="canvas-axis-label x-min">${AXIS_LABELS.x.min}</div>
                        <div class="canvas-axis-label x-max">${AXIS_LABELS.x.max}</div>
                        <div class="canvas-axis-label y-min">${AXIS_LABELS.y.min}</div>
                        <div class="canvas-axis-label y-max">${AXIS_LABELS.y.max}</div>

                        <!-- Quadrant labels -->
                        ${QUADRANT_LABELS.map(q => `
                            <div style="
                                position: absolute;
                                left: ${q.x * 100}%;
                                top: ${(1 - q.y) * 100}%;
                                transform: translate(-50%, -50%);
                                text-align: center;
                                pointer-events: none;
                                opacity: 0.15;
                            ">
                                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">${q.label}</div>
                                <div style="font-size: 0.62rem; color: var(--text-muted);">${q.description}</div>
                            </div>
                        `).join('')}

                        <!-- Aurora White-Space Zone -->
                        <div class="aurora-zone ${this.filters.aurora ? '' : 'hidden'}" id="aurora-zone" style="
                            left: calc(${AURORA_POSITION.x * 100}% - 70px);
                            top: calc(${(1 - AURORA_POSITION.y) * 100}% - 70px);
                            width: 140px;
                            height: 140px;
                        ">
                            <div class="aurora-zone-label">${AURORA_POSITION.label}</div>
                        </div>

                        <!-- Aurora Node -->
                        <div class="competitor-node ${this.filters.aurora ? '' : 'hidden'}" id="node-aurora" data-competitor="aurora" style="
                            left: calc(${AURORA_POSITION.x * 100}% - ${AURORA_POSITION.size / 2}px);
                            top: calc(${(1 - AURORA_POSITION.y) * 100}% - ${AURORA_POSITION.size / 2}px);
                            width: ${AURORA_POSITION.size}px;
                            height: ${AURORA_POSITION.size}px;
                            background: ${AURORA_POSITION.color};
                            box-shadow: 0 0 20px rgba(212,175,55,0.4);
                            font-size: 0.6rem;
                            font-weight: 800;
                            letter-spacing: 0.05em;
                        ">AS</div>

                        <!-- Competitor Nodes -->
                        ${COMPETITORS.map(c => `
                            <div class="competitor-node ${this.filters[c.id] ? '' : 'hidden'}" id="node-${c.id}" data-competitor="${c.id}" style="
                                left: calc(${c.x * 100}% - ${c.size / 2}px);
                                top: calc(${(1 - c.y) * 100}% - ${c.size / 2}px);
                                width: ${c.size}px;
                                height: ${c.size}px;
                                background: ${c.color};
                                font-size: 0.55rem;
                            ">${c.name.split(' ')[0].substring(0, 3)}</div>
                        `).join('')}
                    </div>

                    <!-- Competitor Detail Card -->
                    <div class="competitor-detail" id="competitor-detail">
                        <div id="detail-content"></div>
                    </div>
                </div>

                <!-- Legend -->
                <div style="display: flex; gap: 24px; flex-wrap: wrap; padding: 16px; background: var(--bg-card); border-radius: var(--border-radius-md); border: 1px solid var(--border-subtle);">
                    <div style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); display: flex; align-items: center;">Legend</div>
                    ${COMPETITORS.map(c => `
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-secondary);">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${c.color};"></div>
                            ${c.name}
                        </div>
                    `).join('')}
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--accent-gold); font-weight: 600;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${AURORA_POSITION.color}; box-shadow: 0 0 8px rgba(212,175,55,0.5);"></div>
                        Aurora Scents — White-Space Position
                    </div>
                </div>

                <!-- Aurora Strategic Advantages -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div style="background: var(--gradient-card); border: 1px solid var(--border-gold); border-radius: var(--border-radius-lg); padding: 24px;">
                        <div style="font-size: 0.68rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent-gold); margin-bottom: 12px;">Key Differentiators</div>
                        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px;">
                            ${AURORA_POSITION.keyDifferentiators.map(d => `
                                <li style="font-size: 0.8rem; color: var(--text-secondary); padding-left: 16px; position: relative;">
                                    <span style="position: absolute; left: 0; color: var(--accent-gold);">✦</span>
                                    ${d}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div style="background: var(--gradient-card); border: 1px solid var(--border-subtle); border-radius: var(--border-radius-lg); padding: 24px;">
                        <div style="font-size: 0.68rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent-emerald); margin-bottom: 12px;">Strategic Advantages</div>
                        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px;">
                            ${AURORA_POSITION.strategicAdvantages.map(a => `
                                <li style="font-size: 0.8rem; color: var(--text-secondary); padding-left: 16px; position: relative;">
                                    <span style="position: absolute; left: 0; color: var(--accent-emerald);">◆</span>
                                    ${a}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        this.detailPanel = document.getElementById('competitor-detail');
        this.detailContent = document.getElementById('detail-content');
    }

    bindEvents() {
        // Filter toggles
        const filterBtns = this.container.querySelectorAll('.filter-toggle');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filterId = btn.dataset.filter;
                this.filters[filterId] = !this.filters[filterId];
                btn.classList.toggle('active', this.filters[filterId]);

                // Toggle node visibility
                const node = document.getElementById(`node-${filterId}`);
                if (node) node.classList.toggle('hidden', !this.filters[filterId]);

                // Toggle aurora zone
                if (filterId === 'aurora') {
                    const zone = document.getElementById('aurora-zone');
                    if (zone) zone.classList.toggle('hidden', !this.filters[filterId]);
                }

                // Hide detail if deselected
                if (this.selectedCompetitor === filterId && !this.filters[filterId]) {
                    this.hideDetail();
                }
            });
        });

        // Node click for details
        const nodes = this.container.querySelectorAll('.competitor-node');
        nodes.forEach(node => {
            node.addEventListener('click', () => {
                const compId = node.dataset.competitor;
                if (this.selectedCompetitor === compId) {
                    this.hideDetail();
                } else {
                    this.showDetail(compId);
                }
            });
        });

        // Click outside to close detail
        document.getElementById('canvas-container').addEventListener('click', (e) => {
            if (!e.target.closest('.competitor-node') && !e.target.closest('.competitor-detail')) {
                this.hideDetail();
            }
        });
    }

    showDetail(compId) {
        this.selectedCompetitor = compId;
        let data;

        if (compId === 'aurora') {
            data = AURORA_POSITION;
            this.detailContent.innerHTML = `
                <h4 style="color: var(--accent-gold);">${data.name}</h4>
                <div class="detail-meta">${data.positioning}</div>
                <div class="detail-section-title">Key Differentiators</div>
                <ul class="detail-list">
                    ${data.keyDifferentiators.map(d => `<li>${d}</li>`).join('')}
                </ul>
            `;
        } else {
            data = COMPETITORS.find(c => c.id === compId);
            if (!data) return;
            this.detailContent.innerHTML = `
                <h4>${data.name}</h4>
                <div class="detail-meta">
                    Founded: ${data.founded} · HQ: ${data.headquarters}<br>
                    India: ${data.indiaPresence}
                </div>
                <div class="detail-section-title" style="color: var(--accent-emerald);">Strengths</div>
                <ul class="detail-list">
                    ${data.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
                <div class="detail-section-title" style="color: var(--accent-red);">Weaknesses</div>
                <ul class="detail-list">
                    ${data.weaknesses.map(w => `<li>${w}</li>`).join('')}
                </ul>
            `;
        }

        this.detailPanel.classList.add('visible');
    }

    hideDetail() {
        this.selectedCompetitor = null;
        this.detailPanel.classList.remove('visible');
    }

    onVisible() {
        // Trigger re-render animations when section becomes visible
    }
}
