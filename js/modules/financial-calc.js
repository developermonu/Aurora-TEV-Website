// Aurora Scents — STATE 6: Financial Sensitivity Calculator
// Reactive slider dashboard with real-time KPI computation

import { TEVCalculationEngine } from '../engines/tev-calculator.js';

export class FinancialCalc {

    constructor(mountId) {
        this.container = document.getElementById(mountId);
        if (!this.container) return;

        this.engine = new TEVCalculationEngine();
        this.render();
        this.bindEvents();
        this.compute();
    }

    render() {
        const b = this.engine.BOUNDS;

        this.container.innerHTML = `
            <div class="calc-layout">
                <!-- INPUT SLIDERS -->
                <div class="calc-inputs">
                    <div class="calc-slider-group">
                        <div class="calc-slider-label">
                            <span class="label-text">Ex-Works Transfer Cost (USD)</span>
                            <span class="label-value" id="val-exw">$${b.exwCostUSD.default.toFixed(2)}</span>
                        </div>
                        <input type="range" class="calc-range" id="slider-exw"
                            min="${b.exwCostUSD.min}" max="${b.exwCostUSD.max}"
                            value="${b.exwCostUSD.default}" step="${b.exwCostUSD.step}">
                        <div class="calc-range-bounds">
                            <span>$${b.exwCostUSD.min.toFixed(2)}</span>
                            <span>$${b.exwCostUSD.max.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="calc-slider-group">
                        <div class="calc-slider-label">
                            <span class="label-text">Indian Customs Duty Rate</span>
                            <span class="label-value" id="val-customs">${b.customsDutyRate.default}%</span>
                        </div>
                        <input type="range" class="calc-range" id="slider-customs"
                            min="${b.customsDutyRate.min}" max="${b.customsDutyRate.max}"
                            value="${b.customsDutyRate.default}" step="${b.customsDutyRate.step}">
                        <div class="calc-range-bounds">
                            <span>${b.customsDutyRate.min}%</span>
                            <span>${b.customsDutyRate.max}%</span>
                        </div>
                    </div>

                    <div class="calc-slider-group">
                        <div class="calc-slider-label">
                            <span class="label-text">Target Retail Price / MRP (INR)</span>
                            <span class="label-value" id="val-retail">₹${b.retailPriceINR.default.toLocaleString('en-IN')}</span>
                        </div>
                        <input type="range" class="calc-range" id="slider-retail"
                            min="${b.retailPriceINR.min}" max="${b.retailPriceINR.max}"
                            value="${b.retailPriceINR.default}" step="${b.retailPriceINR.step}">
                        <div class="calc-range-bounds">
                            <span>₹${b.retailPriceINR.min.toLocaleString('en-IN')}</span>
                            <span>₹${b.retailPriceINR.max.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div class="calc-slider-group">
                        <div class="calc-slider-label">
                            <span class="label-text">Performance Marketing CAC Burden</span>
                            <span class="label-value" id="val-cac">${b.cacMarginPercent.default}%</span>
                        </div>
                        <input type="range" class="calc-range" id="slider-cac"
                            min="${b.cacMarginPercent.min}" max="${b.cacMarginPercent.max}"
                            value="${b.cacMarginPercent.default}" step="${b.cacMarginPercent.step}">
                        <div class="calc-range-bounds">
                            <span>${b.cacMarginPercent.min}%</span>
                            <span>${b.cacMarginPercent.max}%</span>
                        </div>
                    </div>

                    <!-- Constants display -->
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: var(--border-radius-md); border: 1px solid var(--border-subtle);">
                        <div style="font-size: 0.68rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">Fixed Parameters</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem;">
                            <span style="color: var(--text-tertiary);">Exchange Rate</span>
                            <span style="color: var(--text-secondary); text-align: right; font-family: var(--font-mono);">1 USD = ₹85.00</span>
                            <span style="color: var(--text-tertiary);">Logistics Buffer</span>
                            <span style="color: var(--text-secondary); text-align: right; font-family: var(--font-mono);">8.0%</span>
                            <span style="color: var(--text-tertiary);">Channel Overhead</span>
                            <span style="color: var(--text-secondary); text-align: right; font-family: var(--font-mono);">35.0%</span>
                            <span style="color: var(--text-tertiary);">Monthly OpEx</span>
                            <span style="color: var(--text-secondary); text-align: right; font-family: var(--font-mono);">₹15,00,000</span>
                        </div>
                    </div>
                </div>

                <!-- KPI OUTPUT CARDS -->
                <div class="calc-outputs">
                    <div class="kpi-card" id="kpi-landed">
                        <div class="kpi-label">Estimated Landed Cost (INR)</div>
                        <div class="kpi-value" id="kpi-landed-value" style="color: var(--accent-blue);">—</div>
                        <div class="kpi-sub" id="kpi-landed-sub"></div>
                    </div>

                    <div class="kpi-card" id="kpi-margin">
                        <div class="kpi-label">Net Contribution Margin (INR)</div>
                        <div class="kpi-value" id="kpi-margin-value">—</div>
                        <div class="kpi-sub" id="kpi-margin-sub"></div>
                    </div>

                    <div class="kpi-card" id="kpi-gross-margin">
                        <div class="kpi-label">Gross Contribution Margin</div>
                        <div class="kpi-value" id="kpi-gross-value">—</div>
                        <div class="health-bar">
                            <div class="health-bar-fill" id="health-bar-fill" style="width: 0%; background: var(--accent-emerald);"></div>
                        </div>
                        <div class="kpi-sub" id="kpi-health-status"></div>
                    </div>

                    <div class="kpi-card" id="kpi-breakeven">
                        <div class="kpi-label">Monthly Break-Even Units</div>
                        <div class="kpi-value" id="kpi-breakeven-value">—</div>
                        <div class="kpi-sub" id="kpi-breakeven-sub">Against ₹15,00,000/month operational overhead</div>
                    </div>

                    <!-- Cost Waterfall -->
                    <div class="kpi-card">
                        <div class="kpi-label">Revenue Allocation Waterfall</div>
                        <div class="waterfall-chart" id="waterfall-chart"></div>
                        <div class="waterfall-legend">
                            <div class="waterfall-legend-item">
                                <div class="waterfall-legend-dot" style="background: #6366F1;"></div>
                                Landed Cost
                            </div>
                            <div class="waterfall-legend-item">
                                <div class="waterfall-legend-dot" style="background: #8B5CF6;"></div>
                                Channel (35%)
                            </div>
                            <div class="waterfall-legend-item">
                                <div class="waterfall-legend-dot" style="background: #EC4899;"></div>
                                Marketing CAC
                            </div>
                            <div class="waterfall-legend-item">
                                <div class="waterfall-legend-dot" style="background: var(--accent-emerald);"></div>
                                Net Margin
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cache slider refs
        this.sliderExw = document.getElementById('slider-exw');
        this.sliderCustoms = document.getElementById('slider-customs');
        this.sliderRetail = document.getElementById('slider-retail');
        this.sliderCac = document.getElementById('slider-cac');
    }

    bindEvents() {
        const sliders = [this.sliderExw, this.sliderCustoms, this.sliderRetail, this.sliderCac];
        sliders.forEach(slider => {
            slider.addEventListener('input', () => this.compute());
        });
    }

    compute() {
        const exw = parseFloat(this.sliderExw.value);
        const customs = parseFloat(this.sliderCustoms.value);
        const retail = parseFloat(this.sliderRetail.value);
        const cac = parseFloat(this.sliderCac.value);

        // Update slider value displays
        document.getElementById('val-exw').textContent = TEVCalculationEngine.formatUSD(exw);
        document.getElementById('val-customs').textContent = customs.toFixed(1) + '%';
        document.getElementById('val-retail').textContent = '₹' + retail.toLocaleString('en-IN');
        document.getElementById('val-cac').textContent = cac.toFixed(1) + '%';

        // Run computation
        const result = this.engine.computeFullScenario(exw, customs, retail, cac);
        const kpis = result.kpis;

        // Update KPI 1: Landed Cost
        document.getElementById('kpi-landed-value').textContent = TEVCalculationEngine.formatINR(kpis.estimatedLandedCostINR);
        document.getElementById('kpi-landed-sub').textContent =
            `EXW ₹${Math.round(result.landedCost.exwCostINR).toLocaleString('en-IN')} + Duty ₹${Math.round(result.landedCost.customsDutyAmount).toLocaleString('en-IN')} + Logistics ₹${Math.round(result.landedCost.logisticsBuffer).toLocaleString('en-IN')}`;

        // Update KPI 2: Net Contribution Margin
        const marginEl = document.getElementById('kpi-margin-value');
        marginEl.textContent = TEVCalculationEngine.formatINR(kpis.netContributionMarginINR);
        marginEl.style.color = kpis.netContributionMarginINR >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)';
        document.getElementById('kpi-margin-sub').textContent =
            `Revenue ₹${retail.toLocaleString('en-IN')} − Landed ₹${Math.round(kpis.estimatedLandedCostINR).toLocaleString('en-IN')} − Channel ₹${Math.round(result.margin.channelOverheadAmount).toLocaleString('en-IN')} − CAC ₹${Math.round(result.margin.marketingCACAmount).toLocaleString('en-IN')}`;

        // Update KPI 3: Gross Margin %
        const grossEl = document.getElementById('kpi-gross-value');
        grossEl.textContent = TEVCalculationEngine.formatPercent(kpis.grossContributionMarginPercent);
        grossEl.style.color = result.health.color;

        const healthBar = document.getElementById('health-bar-fill');
        const healthWidth = Math.max(0, Math.min(100, ((kpis.grossContributionMarginPercent + 20) / 50) * 100));
        healthBar.style.width = healthWidth + '%';
        healthBar.style.backgroundColor = result.health.color;

        document.getElementById('kpi-health-status').textContent = `Status: ${result.health.status}`;
        document.getElementById('kpi-health-status').style.color = result.health.color;

        // Update KPI 4: Break-Even Units
        const beEl = document.getElementById('kpi-breakeven-value');
        if (kpis.isProfitable) {
            beEl.textContent = kpis.breakEvenDisplay + ' units/month';
            beEl.style.color = 'var(--accent-gold)';
            // Remove any existing alert
            const existingAlert = document.querySelector('.unprofitable-alert');
            if (existingAlert) existingAlert.remove();
        } else {
            beEl.textContent = '';
            beEl.style.color = 'var(--accent-red)';
            const kpiCard = document.getElementById('kpi-breakeven');
            if (!kpiCard.querySelector('.unprofitable-alert')) {
                const alert = document.createElement('div');
                alert.className = 'unprofitable-alert';
                alert.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Infinite Vol (Unprofitable Profile)
                `;
                beEl.after(alert);
            }
        }

        // Update waterfall chart
        this.updateWaterfall(result);
    }

    updateWaterfall(result) {
        const chart = document.getElementById('waterfall-chart');
        const total = result.margin.retailPriceINR;
        if (total <= 0) return;

        const landed = Math.max(0, result.waterfall.landedCost);
        const channel = Math.max(0, result.waterfall.channelOverhead);
        const marketing = Math.max(0, result.waterfall.marketingCAC);
        const margin = result.waterfall.netMargin;

        const landedPct = (landed / total) * 100;
        const channelPct = (channel / total) * 100;
        const marketingPct = (marketing / total) * 100;
        const marginPct = Math.max(0, (margin / total) * 100);

        // If unprofitable, show overflow
        const isPositive = margin > 0;
        const totalAllocated = landedPct + channelPct + marketingPct;
        const adjustedMarginPct = isPositive ? marginPct : 0;
        const overflowPct = isPositive ? 0 : Math.min(10, Math.abs(marginPct));

        chart.innerHTML = `
            <div class="waterfall-segment landed" style="width: ${landedPct}%" title="Landed Cost: ${TEVCalculationEngine.formatINR(landed)}"></div>
            <div class="waterfall-segment channel" style="width: ${channelPct}%" title="Channel Overhead: ${TEVCalculationEngine.formatINR(channel)}"></div>
            <div class="waterfall-segment marketing" style="width: ${marketingPct}%" title="Marketing CAC: ${TEVCalculationEngine.formatINR(marketing)}"></div>
            <div class="waterfall-segment ${isPositive ? 'margin-positive' : 'margin-negative'}" style="width: ${isPositive ? adjustedMarginPct : overflowPct}%" title="Net Margin: ${TEVCalculationEngine.formatINR(margin)}"></div>
        `;
    }
}
