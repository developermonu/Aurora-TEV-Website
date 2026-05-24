// Aurora Scents — Competitor Strategy Canvas Data
// 2x2 Matrix Positioning: X = Value↔Premium, Y = Offline↔Digital

export const AXIS_LABELS = {
    x: { min: 'Mass Market / Value', max: 'Ultra-Luxury Premium' },
    y: { min: 'Offline Legacy Distribution', max: 'Native Digital D2C Dominance' }
};

export const COMPETITORS = [
    {
        id: 'ajmal',
        name: 'Ajmal Perfumes',
        x: 0.55,   // Leans premium but with mass lines
        y: 0.20,   // Primarily offline/retail legacy
        color: '#E74C3C',
        size: 48,
        marketCap: 'Large',
        founded: '1951',
        headquarters: 'Dubai, UAE',
        indiaPresence: 'Extensive offline retail network (200+ stores)',
        strengths: [
            'Deep Middle Eastern heritage credibility',
            'Extensive India retail footprint',
            'Wide price range portfolio ($10–$200)',
            'Strong brand recognition in Tier-2/3 cities'
        ],
        weaknesses: [
            'Heavy offline dependency limits scalability',
            'Diluted premium positioning due to mass-market lines',
            'Limited D2C digital infrastructure',
            'Legacy brand perception among Gen-Z consumers'
        ],
        positioning: 'Heritage mass-to-premium with offline dominance'
    },
    {
        id: 'armaf',
        name: 'Armaf (Sterling Parfums)',
        x: 0.30,   // Value-oriented
        y: 0.40,   // Mixed distribution, growing online
        color: '#3498DB',
        size: 42,
        marketCap: 'Medium-Large',
        founded: '2008',
        headquarters: 'Dubai, UAE',
        indiaPresence: 'Strong e-commerce + selective retail',
        strengths: [
            'Aggressive value positioning ("luxury scent, accessible price")',
            'Strong Amazon/Flipkart e-commerce presence',
            'Viral social media traction (Club de Nuit)',
            'High volume throughput model'
        ],
        weaknesses: [
            'Perceived as "clone house" — limited brand equity',
            'Race-to-bottom pricing compresses margins',
            'No coherent D2C platform strategy',
            'Fragile brand loyalty — price-sensitive customer base'
        ],
        positioning: 'Value-clone disruptor with hybrid distribution'
    },
    {
        id: 'lattafa',
        name: 'Lattafa Perfumes',
        x: 0.35,
        y: 0.35,
        color: '#9B59B6',
        size: 40,
        marketCap: 'Medium',
        founded: '2007',
        headquarters: 'Dubai, UAE',
        indiaPresence: 'Growing e-commerce with marketplace focus',
        strengths: [
            'Strong Middle Eastern authenticity credentials',
            'Viral TikTok/YouTube fragrance community buzz',
            'Competitive pricing with perceived quality',
            'Growing Gen-Z/millennial fanbase'
        ],
        weaknesses: [
            'Inconsistent brand positioning globally',
            'Marketplace-dependent (Amazon/Flipkart) — no owned D2C',
            'Quality perception variance across product lines',
            'Limited luxury brand architecture'
        ],
        positioning: 'Affordable Arabian heritage with marketplace distribution'
    }
];

export const AURORA_POSITION = {
    id: 'aurora',
    name: 'Aurora Scents',
    x: 0.72,   // Accessible Premium (not ultra-luxury, but clearly premium)
    y: 0.82,   // Native Digital D2C Dominance
    color: '#D4AF37',
    size: 56,
    label: 'WHITE-SPACE\nZONE',
    positioning: 'Accessible Premium × Native Digital D2C',
    keyDifferentiators: [
        'Accessible Premium White-Space — no direct competitor',
        'Mobile-first D2C digital infrastructure from Day 1',
        'Dual 100ml + 10ml/20ml miniature portfolio strategy',
        'Middle Eastern olfactory heritage with European design elegance',
        'Maximum oil concentration & projection standards',
        'Simultaneous 12-SKU launch for comprehensive shelf presence'
    ],
    strategicAdvantages: [
        'Zero legacy retail overhead — pure digital margin capture',
        'Data-driven customer acquisition & retention loops',
        'Agile pricing without channel conflict',
        'Direct consumer relationship ownership',
        'Miniature trial gateway removes purchase hesitation barrier'
    ]
};

export const QUADRANT_LABELS = [
    { label: 'Value + Offline', description: 'Mass-market legacy retailers', x: 0.15, y: 0.15 },
    { label: 'Premium + Offline', description: 'Traditional luxury houses', x: 0.85, y: 0.15 },
    { label: 'Value + Digital', description: 'E-commerce value brands', x: 0.15, y: 0.85 },
    { label: 'Premium + Digital', description: 'Aurora\'s White-Space', x: 0.85, y: 0.85 }
];
