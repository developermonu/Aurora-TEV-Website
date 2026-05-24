// Aurora Scents — TEV Financial Calculation Engine
// Precision financial modeling mapped to Indian tariff & logistics structures

export class TEVCalculationEngine {

    constructor() {
        // Fixed constants from TEV Report
        this.EXCHANGE_RATE = 85.0;                  // 1 USD = 85.0 INR
        this.LOGISTICS_BUFFER_RATE = 0.08;          // 8% freight/handling/clearing
        this.CHANNEL_OVERHEAD_RATE = 0.35;          // 35% platform commission + fulfillment
        this.MONTHLY_OPERATIONAL_OVERHEAD = 1500000; // ₹15,00,000 (15 Lakhs INR)

        // Input bounds
        this.BOUNDS = {
            exwCostUSD:     { min: 10.0,  max: 50.0,   default: 18.0,   step: 0.5  },
            customsDutyRate: { min: 30.0,  max: 50.0,   default: 38.5,   step: 0.5  },
            retailPriceINR:  { min: 3000,  max: 12000,  default: 5999,   step: 100  },
            cacMarginPercent: { min: 15.0, max: 40.0,   default: 25.0,   step: 0.5  }
        };
    }

    /**
     * Validate and clamp input to defined bounds
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Convert EXW cost from USD to INR
     * @param {number} exwUSD - Ex-Works cost in USD
     * @returns {number} EXW cost in INR
     */
    convertToINR(exwUSD) {
        return exwUSD * this.EXCHANGE_RATE;
    }

    /**
     * Calculate the total Estimated Landed Cost in INR
     * Formula: EXW_INR + (EXW_INR × customsRate%) + (EXW_INR × 8%)
     * 
     * @param {number} exwCostUSD - Ex-Works transfer cost ($10-$50)
     * @param {number} customsDutyRate - Indian customs duty rate (30%-50%)
     * @returns {object} Detailed landed cost breakdown
     */
    calculateLandedCost(exwCostUSD, customsDutyRate) {
        const exwUSD = this.clamp(exwCostUSD, this.BOUNDS.exwCostUSD.min, this.BOUNDS.exwCostUSD.max);
        const dutyRate = this.clamp(customsDutyRate, this.BOUNDS.customsDutyRate.min, this.BOUNDS.customsDutyRate.max);

        const exwINR = this.convertToINR(exwUSD);
        const customsDutyAmount = exwINR * (dutyRate / 100);
        const logisticsBuffer = exwINR * this.LOGISTICS_BUFFER_RATE;
        const totalLandedCost = exwINR + customsDutyAmount + logisticsBuffer;

        return {
            exwCostUSD: exwUSD,
            exwCostINR: exwINR,
            customsDutyRate: dutyRate,
            customsDutyAmount: customsDutyAmount,
            logisticsBufferRate: this.LOGISTICS_BUFFER_RATE * 100,
            logisticsBuffer: logisticsBuffer,
            totalLandedCostINR: totalLandedCost
        };
    }

    /**
     * Calculate Net Contribution Margin
     * Formula: Retail - Landed - (Retail × 35%) - (Retail × CAC%)
     * 
     * @param {number} retailPriceINR - Target MRP (₹3,000-₹12,000)
     * @param {number} landedCostINR - Total landed cost in INR
     * @param {number} cacMarginPercent - Customer acquisition cost margin (15%-40%)
     * @returns {object} Detailed margin breakdown
     */
    calculateNetMargin(retailPriceINR, landedCostINR, cacMarginPercent) {
        const retail = this.clamp(retailPriceINR, this.BOUNDS.retailPriceINR.min, this.BOUNDS.retailPriceINR.max);
        const cacPct = this.clamp(cacMarginPercent, this.BOUNDS.cacMarginPercent.min, this.BOUNDS.cacMarginPercent.max);

        const channelOverhead = retail * this.CHANNEL_OVERHEAD_RATE;
        const marketingCAC = retail * (cacPct / 100);
        const netContributionMargin = retail - landedCostINR - channelOverhead - marketingCAC;

        return {
            retailPriceINR: retail,
            landedCostINR: landedCostINR,
            channelOverheadRate: this.CHANNEL_OVERHEAD_RATE * 100,
            channelOverheadAmount: channelOverhead,
            cacMarginPercent: cacPct,
            marketingCACAmount: marketingCAC,
            netContributionMarginINR: netContributionMargin
        };
    }

    /**
     * Calculate Gross Contribution Margin Percentage
     * Formula: (Net / Retail) × 100
     * 
     * @param {number} netMarginINR - Net contribution margin in INR
     * @param {number} retailPriceINR - Target retail price in INR
     * @returns {number} Gross contribution margin percentage
     */
    calculateGrossMarginPercent(netMarginINR, retailPriceINR) {
        if (retailPriceINR <= 0) return 0;
        return (netMarginINR / retailPriceINR) * 100;
    }

    /**
     * Calculate Monthly Break-Even Units
     * Formula: ceil(1,500,000 / Net_Contribution_Margin_INR) or "Infinite"
     * 
     * @param {number} netMarginINR - Net contribution margin per unit in INR
     * @returns {object} Break-even analysis result
     */
    calculateBreakEven(netMarginINR) {
        if (netMarginINR <= 0) {
            return {
                isProfitable: false,
                units: Infinity,
                displayText: 'Infinite Vol (Unprofitable Profile)',
                monthlyOverhead: this.MONTHLY_OPERATIONAL_OVERHEAD
            };
        }

        const units = Math.ceil(this.MONTHLY_OPERATIONAL_OVERHEAD / netMarginINR);
        return {
            isProfitable: true,
            units: units,
            displayText: units.toLocaleString('en-IN'),
            monthlyOverhead: this.MONTHLY_OPERATIONAL_OVERHEAD
        };
    }

    /**
     * Run the complete financial sensitivity calculation stack
     * Accepts all 4 input variables and returns the full output dashboard
     * 
     * @param {number} exwCostUSD - Ex-Works cost in USD ($10-$50)
     * @param {number} customsDutyRate - Customs duty rate (30%-50%)
     * @param {number} retailPriceINR - Target retail MRP (₹3,000-₹12,000)
     * @param {number} cacMarginPercent - CAC burden (15%-40%)
     * @returns {object} Complete financial analysis dashboard
     */
    computeFullScenario(exwCostUSD, customsDutyRate, retailPriceINR, cacMarginPercent) {
        // Step 1: Landed Cost
        const landed = this.calculateLandedCost(exwCostUSD, customsDutyRate);

        // Step 2: Net Margin
        const margin = this.calculateNetMargin(retailPriceINR, landed.totalLandedCostINR, cacMarginPercent);

        // Step 3: Gross Margin %
        const grossMarginPercent = this.calculateGrossMarginPercent(
            margin.netContributionMarginINR,
            margin.retailPriceINR
        );

        // Step 4: Break-Even
        const breakEven = this.calculateBreakEven(margin.netContributionMarginINR);

        // Margin health assessment
        let healthStatus, healthColor;
        if (grossMarginPercent >= 20) {
            healthStatus = 'HEALTHY';
            healthColor = '#10B981';
        } else if (grossMarginPercent >= 10) {
            healthStatus = 'MODERATE';
            healthColor = '#F59E0B';
        } else if (grossMarginPercent > 0) {
            healthStatus = 'THIN';
            healthColor = '#EF4444';
        } else {
            healthStatus = 'UNPROFITABLE';
            healthColor = '#DC2626';
        }

        return {
            inputs: {
                exwCostUSD: landed.exwCostUSD,
                customsDutyRate: landed.customsDutyRate,
                retailPriceINR: margin.retailPriceINR,
                cacMarginPercent: margin.cacMarginPercent
            },
            landedCost: landed,
            margin: margin,
            kpis: {
                estimatedLandedCostINR: landed.totalLandedCostINR,
                netContributionMarginINR: margin.netContributionMarginINR,
                grossContributionMarginPercent: grossMarginPercent,
                monthlyBreakEvenUnits: breakEven.units,
                breakEvenDisplay: breakEven.displayText,
                isProfitable: breakEven.isProfitable
            },
            health: {
                status: healthStatus,
                color: healthColor
            },
            // Cost waterfall breakdown for visualization
            waterfall: {
                landedCost: landed.totalLandedCostINR,
                channelOverhead: margin.channelOverheadAmount,
                marketingCAC: margin.marketingCACAmount,
                netMargin: margin.netContributionMarginINR,
                total: margin.retailPriceINR
            },
            constants: {
                exchangeRate: this.EXCHANGE_RATE,
                logisticsBufferRate: this.LOGISTICS_BUFFER_RATE * 100,
                channelOverheadRate: this.CHANNEL_OVERHEAD_RATE * 100,
                monthlyOperationalOverhead: this.MONTHLY_OPERATIONAL_OVERHEAD
            }
        };
    }

    /**
     * Format currency in Indian Rupee notation
     * @param {number} amount - Amount in INR
     * @returns {string} Formatted string
     */
    static formatINR(amount) {
        if (!isFinite(amount)) return '—';
        return '₹' + Math.round(amount).toLocaleString('en-IN');
    }

    /**
     * Format currency in USD
     * @param {number} amount - Amount in USD
     * @returns {string} Formatted string
     */
    static formatUSD(amount) {
        if (!isFinite(amount)) return '—';
        return '$' + amount.toFixed(2);
    }

    /**
     * Format percentage
     * @param {number} pct - Percentage value
     * @returns {string} Formatted string
     */
    static formatPercent(pct) {
        if (!isFinite(pct)) return '—';
        return pct.toFixed(1) + '%';
    }
}
