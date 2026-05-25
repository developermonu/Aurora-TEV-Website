// Aurora Scents — Complete Product Manifest
// Data sourced from official Aurora Scents product catalog imagery

export const STRATEGIC_TAGS = {
    HERO: { label: 'HERO LAUNCH SKU', color: '#10B981' },
    SUPPORTING: { label: 'SUPPORTING EXTENSION', color: '#3B82F6' },
    MINIATURE: { label: 'MINIATURE TRIAL GATEWAY', color: '#D4AF37' }
};

export const COLLECTIONS = [
    {
        id: 'aura',
        name: 'Aura Collection',
        tagline: 'Metallic Bottle Visual Theater',
        description: 'The Aura Collection embodies radiance and allure with beautifully polished metallic bottles crowned with distinctive sculptural caps. Each fragrance captures elegance in every drop — refined, luminous, and full of character.',
        image: 'Recommended Products/Aura Gold and Silver.png',
        variants: [
            {
                name: 'Aura Gold',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Coconut', 'Apple', 'Honey'],
                    heart: ['Caramel', 'Jasmine'],
                    base: ['Ambrox', 'Coumarin', 'Musk', 'Vanilla']
                },
                profile: 'A warm, gourmand-oriental blend with sweet tropical opening and a creamy, musky dry-down. Designed for evening and occasion wear with strong sillage.'
            },
            {
                name: 'Aura Silver',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Saffron', 'Bergamot', 'Orange', 'Mandarin SFUMA', 'Pink Pepper'],
                    heart: ['Sandalwood Australia', 'Patchouli Indonesia', 'Cardamom Guatemala'],
                    base: ['Amber', 'White Musk']
                },
                profile: 'A vibrant citrus-spice opening melting into warm Australian sandalwood and earthy Indonesian patchouli. Both sensual and unforgettable.'
            },
            {
                name: 'Aura Miniatures Set',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Travel-size discovery set featuring both Gold and Silver variants in portable 10ml and 20ml formats.'
            }
        ]
    },
    {
        id: 'celestial',
        name: 'Celestial Collection',
        tagline: 'Complex Green Florals',
        description: 'Embark on a celestial olfactory odyssey with the Aurora Celestial Collection. Each fragrance is a portal to otherworldly realms, where scents evoke the mysteries of the cosmos. These fragrances transcend earthly boundaries.',
        image: 'Recommended Products/Celestial Garden of Eadens.png',
        variants: [
            {
                name: 'Celestial Garden of Eden',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Saffron', 'Lychee'],
                    heart: ['Rose Abs Turkish LMR', 'Patchouli Oil Indo LMR', 'Vanilla'],
                    base: ['Oakmoss LMR', 'Myrrh Resinoid', 'Labdanum Resinoid LMR']
                },
                profile: 'An intricate complex day-wear green floral anchored in premium raw materials — Turkish rose absolute, Indo patchouli oil, and resinous myrrh. A sophisticated unisex offering.'
            },
            {
                name: 'Celestial Miniature Edition',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Portable travel edition of Garden of Eden for consumer trial and gifting occasions.'
            }
        ]
    },
    {
        id: 'deer',
        name: 'Deer Collection',
        tagline: 'Dense, Regal Oud Narratives',
        description: 'Inspired by nature\'s most graceful ingredients, the Deer Collection captures the essence of the forest and the serene beauty found within its depths. Perfect for those who appreciate subtlety, with fragrances that evoke calm, tranquility, and refined elegance.',
        image: 'Recommended Products/Deer Her majesty.png',
        variants: [
            {
                name: 'Deer Her Majesty',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Pink Pepper', 'Cardamom', 'Grapefruit', 'Lime', 'Strawberry', 'Green Note'],
                    heart: ['Ylang Ylang', 'Tuberose', 'Rose', 'Jasmine', 'Lavender', 'Orchid'],
                    base: ['Vanilla', 'Tonka', 'Amber', 'Musks', 'Cedarwood', 'Sandalwood']
                },
                profile: 'A dense, regal oud narrative with a surprisingly fresh citrus-spice opening cascading into an opulent white floral heart. The vanilla-amber-wood base projects powerfully.'
            },
            {
                name: 'Deer Travel Miniature',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Her Majesty in a portable travel format to mitigate trial hesitation among new consumers.'
            }
        ]
    },
    {
        id: 'elite',
        name: 'Elite Collection',
        tagline: 'Crisp Corporate Profiles Optimized for Longevity',
        description: 'Elite and Elite VIP are presented in striking luxury bottles crowned with refined wooden caps and housed in elegant boxes. This collection embodies modern prestige and understated power — a perfect harmony of sophistication, confidence, and timeless allure.',
        image: 'Recommended Products/Elite and Elite Vip.png',
        variants: [
            {
                name: 'Elite',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Cardamom Guatemala', 'Lemon Sfuma', 'Mint Arvensis'],
                    heart: ['Cumin', 'Muguet', 'Rose', 'Geranium Egypt', 'Sage', 'Lavandin Grosso', 'Cinnamon Sri Lanka', 'Nutmeg'],
                    base: ['Cedarwood Virginia', 'Patchouli Indonesia', 'Vanilla Planifolia', 'Ambrocenide', 'Ambrox Super']
                },
                profile: 'A crisp, sharp corporate composition with aromatic cardamom-mint opening, complex spice-floral heart, and premium woody-amber base. Engineered for all-day boardroom longevity.'
            },
            {
                name: 'Elite VIP',
                tag: 'SUPPORTING',
                format: '100ml EDP',
                notes: {
                    top: ['Apple', 'Bergamot', 'Mandarin', 'Plum', 'Cardamom', 'Incense'],
                    heart: ['Cinnamon', 'Orange Blossom', 'Caramel'],
                    base: ['Cedarwood', 'Guaiacwood', 'Vanilla Planifolia']
                },
                profile: 'A warmer, more opulent companion to Elite. Fruity-spice opening with incense depth transitioning to a caramel-wood base. Evening and special occasion positioning.'
            },
            {
                name: 'Elite Discovery Set',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Paired discovery set featuring both Elite and Elite VIP in travel-friendly formats.'
            }
        ]
    },
    {
        id: 'galactic',
        name: 'Galactic Collection',
        tagline: 'Avant-Garde Fruity-Woody Accords',
        description: 'The Aurora Galactic Collection is a futuristic and bold fragrance line designed for those drawn to the mysteries of the universe and the infinite beauty of the cosmos. Galactic fragrances feature unique blends of fresh, metallic, and cosmic-inspired notes, offering an energetic, vibrant scent profile.',
        image: 'Recommended Products/Galacatic cherry in the woods.png',
        variants: [
            {
                name: 'Galactic Black Obsidian',
                tag: 'SUPPORTING',
                format: '100ml EDP',
                notes: {
                    top: ['Bergamot Italy', 'Mandarine Italy', 'Elemi'],
                    heart: ['Jasmine Sambac Absolute', 'Osmanthus', 'Pink Pepper SFE'],
                    base: ['Patchouli Indonesia', 'Ambrox', 'Moss', 'Helvetolide']
                },
                profile: 'A dark, mysterious composition with Italian citrus brightness over jasmine absolute and peppery warmth, grounded in deep patchouli and modern musks. Targeting younger affluent cohorts.'
            },
            {
                name: 'Galactic Cherry in the Woods',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Sparkling Cherry', 'Orange Sanguine', 'Red Apple STT', 'Crisp Pear'],
                    heart: ['Elemi Philippines', 'Rose Centifolia Morocco', 'Jasmine Sambac China', 'Raspberry'],
                    base: ['Vetiver Haiti', 'Sandalwood', 'Vanilla', 'Tonka', 'Amber Woods']
                },
                profile: 'An avant-garde fruity-woody masterpiece. Effervescent cherry-fruit opening cascading into exotic rose-raspberry heart and warm vetiver-vanilla-tonka base. A standout SKU for Gen-Z and millennial discovery.'
            },
            {
                name: 'Galactic Pocket Sprays',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Ultra-portable pocket spray editions for on-the-go consumers. Key trial gateway for younger demographics.'
            }
        ]
    },
    {
        id: 'lorenzo',
        name: 'Lorenzo Collection',
        tagline: 'Smoky Ouds & Fresh Marine Notes',
        description: 'Dive into an exquisite array of scents with the Aurora Lorenzo Collection, where each fragrance is a testament to olfactory mastery. From the captivating blend of smoky oud and woody notes to the refreshing burst of citrusy freshness, this collection offers a sensory journey like no other.',
        image: 'Recommended Products/Lorenzo Burning Oud.png',
        variants: [
            {
                name: 'Lorenzo Burning Oud',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Cypriol', 'Labdanum', 'Cardamom'],
                    heart: ['Woody Notes', 'Amber', 'Sandalwood'],
                    base: ['Leather', 'Musk', 'Tonka Bean']
                },
                profile: 'A bold, smoky oud interpretation paired with labdanum resin warmth and cardamom spice. The leather-musk base ensures commanding sillage and lasting projection.'
            },
            {
                name: 'Lorenzo Ocean Blue',
                tag: 'SUPPORTING',
                format: '100ml EDP',
                notes: {
                    top: ['Lime', 'Ivy Leaf', 'Lemon', 'Grapefruit'],
                    heart: ['Thyme', 'Pink Pepper', 'Vetiver Manzana'],
                    base: ['Woody', 'Ambergris', 'Musky']
                },
                profile: 'A crisp marine aquatic composition contrasting the Burning Oud profile. Fresh citrus-herbal opening with aromatic thyme-pepper heart and clean ambergris finish. Versatile day-wear positioning.'
            },
            {
                name: 'Lorenzo Travel Duos',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Paired travel set featuring both Burning Oud and Ocean Blue for consumer comparison and discovery.'
            }
        ]
    },
    {
        id: 'odyssey',
        name: 'Odyssey Collection',
        tagline: 'Heavy-Projection Heritage Profiles',
        description: 'The Odyssey Collection is inspired by the rich essence of Arabic aromas and timeless cultural traditions. Each perfume comes in a sleek, elegant bottle, presented in a luxurious Dubai Frame-inspired box that reflects sophistication and heritage.',
        image: 'Recommended Products/Odyssey.png',
        variants: [
            {
                name: 'Odyssey Al Fakher',
                tag: 'HERO',
                format: '100ml EDP',
                notes: {
                    top: ['Cypriol', 'Nutmeg', 'Incense'],
                    heart: ['Oud Wood', 'Saffron', 'Cinnamon', 'Leather'],
                    base: ['Amber', 'Musky', 'Tonka Bean']
                },
                profile: 'A heavy-sillage signature oil projection variant anchored in authentic oud wood and saffron. The incense-spice profile with amber-musk base evokes deep Middle Eastern heritage narratives.'
            },
            {
                name: 'Odyssey Ehsas',
                tag: 'SUPPORTING',
                format: '100ml EDP',
                notes: {
                    top: ['Apple', 'Mandarin', 'Nutmeg', 'Saffron'],
                    heart: ['Violet', 'Iris', 'Jasmin'],
                    base: ['Cedarwood', 'Moss', 'Ambergris']
                },
                profile: 'A more approachable entry into the Odyssey heritage range. Fruity-spice opening with delicate violet-iris heart transitioning to a sophisticated cedarwood-ambergris base. Bridges modern and traditional aesthetics.'
            },
            {
                name: 'Odyssey Miniatures',
                tag: 'MINIATURE',
                format: '10ml / 20ml Travel',
                notes: { top: [], heart: [], base: [] },
                profile: 'Miniature travel editions of both Al Fakher and Ehsas for heritage fragrance trial.'
            }
        ]
    }
];

export const MINIATURE_STRATEGY = {
    title: 'The Miniature Strategy',
    subtitle: 'Simultaneous 12-Variant Launch in Portable Travel Formats',
    description: 'All 12 recommended full-size variants must launch simultaneously in portable 10ml and 20ml travel formats to mitigate consumer trial hesitation. This dual-format strategy (100ml full-size + 10ml/20ml miniature) enables low-risk consumer sampling at accessible price points while building brand familiarity before full-size conversion.',
    image: 'Recommended Products/Miniatures.png',
    keyPoints: [
        'All 12 variants available in 10ml & 20ml portable formats',
        'Mitigates consumer trial hesitation for premium-priced fragrances',
        'Enables gifting & impulse purchase occasions',
        'Low entry price point drives first-time brand discovery',
        'Travel-ready form factor aligned with mobile, urban consumer lifestyles',
        'Simultaneous launch creates comprehensive shelf presence'
    ],
    variantCount: 12,
    formats: ['10ml Travel Spray', '20ml Travel Spray', '100ml Full-Size EDP']
};
