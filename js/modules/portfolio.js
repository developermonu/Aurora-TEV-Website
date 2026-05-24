// Aurora Scents — STATE 4: Product Portfolio & Olfactory Map
// Interactive grid with expandable collection cards and strategic tags

import { COLLECTIONS, MINIATURE_STRATEGY, STRATEGIC_TAGS } from '../data/products.js';

export class PortfolioGrid {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.expandedCard = null;
        this.render();
        this.bindEvents();
    }

    render() {
        let html = '<div class="portfolio-grid stagger-children">';

        // Collection cards
        COLLECTIONS.forEach((collection, idx) => {
            const variantCount = collection.variants.length;
            const heroCount = collection.variants.filter(v => v.tag === 'HERO').length;

            html += `
                <div class="collection-card" data-collection="${collection.id}" style="animation-delay: ${idx * 0.08}s">
                    <img class="collection-card-image" src="${collection.image}" alt="${collection.name}" loading="lazy">
                    <div class="collection-card-body">
                        <div class="collection-card-name">${collection.name}</div>
                        <div class="collection-card-tagline">${collection.tagline}</div>
                        <div class="collection-card-count">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            ${variantCount} variant${variantCount > 1 ? 's' : ''} · ${heroCount} Hero SKU${heroCount > 1 ? 's' : ''}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:auto; transition: transform 0.3s ease"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                    </div>

                    <div class="collection-variants">
                        ${collection.variants.map((variant, vIdx) => this.renderVariant(variant, vIdx)).join('')}
                    </div>
                </div>
            `;
        });

        // Miniature Strategy Banner
        html += `
            <div class="miniature-banner">
                <div>
                    <img class="miniature-banner-image" src="${MINIATURE_STRATEGY.image}" alt="Aurora Miniatures Collection" loading="lazy">
                </div>
                <div>
                    <div class="section-eyebrow" style="margin-bottom: 8px;">Strategic Initiative</div>
                    <h3>${MINIATURE_STRATEGY.title}</h3>
                    <p class="mini-subtitle">${MINIATURE_STRATEGY.subtitle}</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">${MINIATURE_STRATEGY.description}</p>
                    <ul class="miniature-points">
                        ${MINIATURE_STRATEGY.keyPoints.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                    <div style="margin-top: 20px; display: flex; gap: 8px; flex-wrap: wrap;">
                        ${MINIATURE_STRATEGY.formats.map(fmt => `
                            <span style="padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 600; background: var(--accent-gold-glow); color: var(--accent-gold); border: 1px solid var(--border-gold);">${fmt}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        html += '</div>';
        this.container.innerHTML = html;
    }

    renderVariant(variant, index) {
        const tagData = STRATEGIC_TAGS[variant.tag];
        const tagClass = variant.tag.toLowerCase();
        const hasNotes = variant.notes.top.length > 0 || variant.notes.heart.length > 0 || variant.notes.base.length > 0;

        return `
            <div class="variant-item" style="animation-delay: ${index * 0.08}s">
                <div class="variant-header">
                    <div>
                        <div class="variant-name">${variant.name}</div>
                        <div class="variant-format">${variant.format}</div>
                    </div>
                    <span class="variant-tag ${tagClass}">${tagData.label}</span>
                </div>
                ${hasNotes ? `
                    <div class="variant-notes">
                        ${variant.notes.top.map(n => `<span class="note-badge top" title="Top Note">${n}</span>`).join('')}
                        ${variant.notes.heart.map(n => `<span class="note-badge heart" title="Heart Note">${n}</span>`).join('')}
                        ${variant.notes.base.map(n => `<span class="note-badge base" title="Base Note">${n}</span>`).join('')}
                    </div>
                ` : ''}
                <p class="variant-profile">${variant.profile}</p>
            </div>
        `;
    }

    bindEvents() {
        const cards = this.container.querySelectorAll('.collection-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't toggle if clicking inside expanded variants area (let text be selectable)
                if (e.target.closest('.variant-item')) return;

                const isExpanded = card.classList.contains('expanded');

                // Collapse all first
                cards.forEach(c => c.classList.remove('expanded'));

                // Toggle clicked card
                if (!isExpanded) {
                    card.classList.add('expanded');
                    // Smooth scroll to card
                    setTimeout(() => {
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });
        });
    }
}
