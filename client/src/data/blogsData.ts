export interface BlogSection {
  heading: string;
  body: string[];
  subpoints?: string[];
  quote?: string;
  takeaway?: string;
}

export interface BlogItem {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: 'Skincare Tips' | 'Beauty Trends' | 'Wellness' | 'Ingredients';
  coverImage: string;
  publishedAt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  tags: string[];
  excerpt: string;
  sections: BlogSection[];
  keyTakeaways: string[];
  recommendedProduct?: {
    name: string;
    slug: string;
    price: number;
    image: string;
    tag?: string;
  };
}

export const PREDEFINED_BLOGS: BlogItem[] = [
  {
    _id: 'blog-acids-guide-01',
    slug: 'the-complete-guide-to-skincare-acids',
    title: 'The Complete Guide to Skincare Acids: Which Acid Solves Which Problem',
    subtitle: 'Everything you need to know about AHAs, BHAs, PHAs and Hyaluronic Acid',
    category: 'Ingredients',
    coverImage: '/images/blogs/guide_to_acids.png',
    publishedAt: '2026-06-19',
    readTime: '6 min read',
    author: {
      name: 'Dr. Evelyn Vance',
      role: 'Head of Skincare Formulation & Dermatologist',
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTicl0T1zAWsAnztxyWJBLMJIsyodafip2T7kmFwyrJqwyye5CrfSnZuY6E&s=10',
    },
    tags: ['Acids', 'Chemical Exfoliation', 'AHA', 'BHA', 'Skin Barrier'],
    excerpt:
      'There are 15+ acids in skincare. You probably need two. This guide tells you which two. The word "acid" sounds like it should burn your face off. It shouldn\'t, and when used correctly, acids are the most transformative step in your regimen.',
    keyTakeaways: [
      'AHAs (Glycolic, Lactic) exfoliate the surface and boost moisture retention.',
      'BHAs (Salicylic Acid) penetrate oil-filled pores to dissolve blackheads and acne plugs.',
      'PHAs are ultra-gentle second-generation exfoliants ideal for reactive, rosacea-prone skin.',
      'Hyaluronic Acid is a humectant (water-binder), not an exfoliating acid, and can be used twice daily.',
      'Always follow chemical exfoliation with SPF 50 sunscreen the following morning.',
    ],
    recommendedProduct: {
      name: 'Hydra Glow Serum',
      slug: 'hydra-glow-serum',
      price: 1499,
      image: '/images/products/hydra-glow-serum.jpg',
      tag: 'Best Seller',
    },
    sections: [
      {
        heading: '1. Demystifying the Word "Acid"',
        body: [
          'The cosmetic industry borrowed the term "acid" from laboratory chemistry, which causes unnecessary fear among beginners. In dermatological science, active acids are naturally occurring organic compounds—often isolated from milk sugars, sugar cane, bitter almonds, or willow tree bark.',
          'Rather than abrasively scrubbing away living tissue like granular physical scrubs, skin acids dissolve the biological "glue" (desmosomes) binding expired, dull dead keratinocytes to your epidermal surface.',
        ],
        quote: 'Properly formulated skincare acids do not thin your skin; they signal basal cellular repair and stimulate fresh dermal collagen.',
      },
      {
        heading: '2. Alpha Hydroxy Acids (AHAs): The Surface Smoothers',
        body: [
          'AHAs are water-soluble molecules that work on the outer stratum corneum. If your primary concerns are dullness, uneven texture, sun damage, or superficial dry flaking, AHAs are your primary answer.',
        ],
        subpoints: [
          'Glycolic Acid (Smallest molecule): Penetrates deepest and fastest; ideal for resilient, non-sensitive skin seeking dramatic glow.',
          'Lactic Acid (Medium molecule): Derived from fermented carbohydrates; hydrates while exfoliating; suitable for normal to dry skin.',
          'Mandelic Acid (Largest molecule): Derived from bitter almonds; gentle and anti-bacterial; the gold standard for sensitive skin and post-inflammatory pigmentation on deeper skin tones.',
        ],
      },
      {
        heading: '3. Beta Hydroxy Acid (BHA): The Pore Plumber',
        body: [
          'There is predominantly one BHA that matters in topical dermatology: Salicylic Acid. Unlike water-loving AHAs, Salicylic Acid is lipophilic (oil-soluble).',
          'This unique property enables it to bypass sebum, enter pore linings, and liquefy hardened sebum, oxidized keratin (blackheads), and acne-causing micro-comedones before they inflame.',
        ],
        takeaway: 'Rule of thumb: AHAs for rough texture & dry sun spots; BHA for blackheads, whiteheads, and oily congested pores.',
      },
      {
        heading: '4. How to Layer Acids Without Compromising Your Acid Mantle',
        body: [
          'A common mistake is layering multiple acids in a single night routine. This overwhelms your skin barrier, triggering rebound oiliness, erythema, and sensitivity.',
          'Start slowly: introduce your chosen acid just 2 nights per week. Cleanse with a non-foaming botanical cleanser, pat completely dry, apply your acid treatment, wait 3 minutes, then seal with a lipid-rich ceramide cream like Hydra Nourish Cream.',
        ],
      },
    ],
  },
  {
    _id: 'blog-sunscreen-guide-02',
    slug: 'why-spf-50-is-non-negotiable-in-india',
    title: 'Why SPF 50 Is Non-Negotiable in India: The Complete Sunscreen Guide for Indian Skin',
    subtitle: 'The science of high UV index, tropical humidity, and shielding Indian melanin',
    category: 'Skincare Tips',
    coverImage: '/images/blogs/spf_50_guide.png',
    publishedAt: '2026-06-18',
    readTime: '5 min read',
    author: {
      name: 'Dr. Ananya Sharma',
      role: 'Clinical Photodermatologist',
      avatar: 'https://images.unsplash.com/photo-1594824813504-7a36cb074c7c?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Sunscreen', 'SPF 50', 'Indian Skin', 'Hyperpigmentation', 'UV Defense'],
    excerpt:
      'Your brightening cream works all night. The sun undoes it all morning. Unless you do this one thing. Here is a number that should change how you think about sunscreen in sub-tropical UV indexes...',
    keyTakeaways: [
      'UV Index across Indian cities consistently exceeds 8 to 11+ between 10 AM and 3 PM.',
      'Melanin protects against burning (UVB) but is highly reactive to UVA, resulting in persistent melasma and PIH.',
      'SPF measures UVB protection; PA ratings (PA++++) indicate UVA protection that prevents tanning and premature ageing.',
      'The two-finger rule guarantees the laboratory-tested 2mg/cm² application density.',
      'A gel-based sunscreen with botanical humectants prevents sticky sweating in humid weather.',
    ],
    recommendedProduct: {
      name: 'Hydra Sunscreen Gel',
      slug: 'hydra-sunscreen-gel',
      price: 999,
      image: '/images/products/hydra-sunscreen-gel.jpg',
    },
    sections: [
      {
        heading: '1. The UV Reality of the Indian Subcontinent',
        body: [
          'Many believe sunscreen is only necessary for European or Fitzpatrick Type I skin types that burn visibly red. This is one of the most persistent myths in Indian dermatological care.',
          'While deeper melanin-rich skin has built-in natural protection against sunburn (erythema), our melanocytes are biologically wired to over-produce pigment when triggered by UVA rays and visible light.',
        ],
        quote: 'Melanin prevents sunburn, but without broad-spectrum SPF 50 PA++++, it converts every solar ray into stubborn dark spots.',
      },
      {
        heading: '2. The Difference Between SPF 30 and SPF 50 Under Tropical Heat',
        body: [
          'In controlled climate-controlled labs, SPF 30 blocks 97% of UVB rays while SPF 50 blocks 98%. On paper, a 1% difference seems negligible.',
          'However, in real-world Indian conditions—heat, sweat, humidity, and accidental face wiping—most people apply less than half the recommended dosage. Starting with SPF 50 PA++++ provides a crucial safety margin that maintains real protection throughout the day.',
        ],
      },
      {
        heading: '3. What to Look for in a Modern Indian Sunscreen Formulation',
        body: [
          'Traditional sunscreens relied on heavy zinc oxide or chalky titanium dioxide that left a ghostly lavender-white cast and felt suffocating in 35°C humidity.',
          'Modern photostable filters combined with botanical hydration—such as bio-fermented hyaluronic acid and calming green tea extract—allow formulations like Hydra Sunscreen Gel to sink into the skin like water, leaving zero residue and zero shine.',
        ],
        subpoints: [
          'Broad Spectrum: Look for both "SPF 50" (UVB) and "PA++++" (maximum UVA defense).',
          'Non-Comedogenic: Free from heavy pore-clogging waxes.',
          'Blue Light Shielding: Formulations with polyphenol antioxidants protect against indoor screens and HEV radiation.',
        ],
      },
    ],
  },
  {
    _id: 'blog-vitamin-c-03',
    slug: 'vitamin-c-secret-to-glowing-youthful-skin',
    title: 'Vitamin C: The Secret to Glowing and Youthful Skin?',
    subtitle: 'Unlocking the power of bio-available botanical L-Ascorbic Acid & Ethyl Ascorbate',
    category: 'Ingredients',
    coverImage: '/images/blogs/vitamin_c_banner.jpg',
    publishedAt: '2026-06-15',
    readTime: '5 min read',
    author: {
      name: 'Rohan Mehra',
      role: 'Cosmetic Formulation Chemist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Vitamin C', 'Radiance', 'Antioxidants', 'Collagen', 'Kakadu Plum'],
    excerpt:
      'Not all Vitamin C serums are created equal. Discover why stabilized bio-ferments and ethyl ascorbic acid deliver superior collagen synthesis without oxidative yellowing or stinging.',
    keyTakeaways: [
      'Vitamin C neutralizes free radical oxidative damage caused by pollution and UV light.',
      'It directly inhibits tyrosinase, the enzyme responsible for dark spots and uneven tone.',
      'Pairing Vitamin C with botanical Vitamin E and Ferulic Acid boosts stability by up to 8x.',
      'Apply every morning onto cleansed, damp skin right before your sunscreen.',
    ],
    recommendedProduct: {
      name: 'Hydra Glow Serum',
      slug: 'hydra-glow-serum',
      price: 1499,
      image: '/images/products/hydra-glow-serum.jpg',
      tag: 'Best Seller',
    },
    sections: [
      {
        heading: '1. Why Vitamin C Is the Holy Grail of Morning Skincare',
        body: [
          'If sunscreen is your defensive shield, Vitamin C is your active antioxidant interceptor. When UV light penetrates the ozone, it generates free radicals—unstable oxygen molecules that steal electrons from your skin cell membranes and degrade collagen.',
          'Vitamin C donates electrons to neutralize these free radicals before they can trigger cellular inflammation, making it the most potent anti-ageing molecule in clinical dermatology.',
        ],
      },
      {
        heading: '2. Solving the Stability Problem: The Pure Kakadu Plum Breakthrough',
        body: [
          'Pure L-Ascorbic Acid is notoriously volatile: expose it to air, water, or ambient light, and it rapidly oxidizes into dehydroascorbic acid, turning brown and losing potency.',
          'At Hydra, our laboratories utilize Australian Kakadu Plum—containing up to 100 times the Vitamin C concentration of an orange—stabilized within a lipid-soluble bio-fermented matrix that remains crystal clear from the first drop to the last.',
        ],
        quote: 'A fresh, unoxidized Vitamin C serum should be clear or pale champagne—never dark yellow or amber.',
      },
    ],
  },
  {
    _id: 'blog-glutathione-04',
    slug: 'glutathione-key-to-radiant-youthful-skin',
    title: 'Glutathione: The Master Antioxidant for Radiant and Youthful Skin',
    subtitle: 'How cellular detoxification transforms stubborn hyperpigmentation from within',
    category: 'Beauty Trends',
    coverImage: '/images/blogs/glutathione_banner.jpg',
    publishedAt: '2026-06-12',
    readTime: '6 min read',
    author: {
      name: 'Dr. Evelyn Vance',
      role: 'Head of Skincare Formulation & Dermatologist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Glutathione', 'Antioxidants', 'Even Tone', 'Cellular Health'],
    excerpt:
      'Known as the body\'s master cellular detoxifier, glutathione plays a critical role in tyrosinase inhibition and mitochondrial protection. Here is how it brightens from within.',
    keyTakeaways: [
      'Glutathione is a tripeptide composed of glutamine, cysteine, and glycine produced naturally in the liver.',
      'It shifts melanin pathway synthesis from brown/black eumelanin to lighter, reddish-yellow pheomelanin.',
      'Topical glutathione must be encapsulated in liposomes to penetrate the stratum corneum.',
      'Pair with Vitamin C for reciprocal antioxidant regeneration.',
    ],
    recommendedProduct: {
      name: 'Hydra Nourish Cream',
      slug: 'hydra-nourish-cream',
      price: 1299,
      image: '/images/products/hydra-nourish-cream.jpg',
      tag: 'New',
    },
    sections: [
      {
        heading: '1. What Makes Glutathione the "Master Antioxidant"?',
        body: [
          'Every cell in human tissue produces glutathione. It recycles other exhausted antioxidants—including Vitamin C, Vitamin E, and CoQ10—restoring their defensive capacity.',
          'As we age, or when our skin is exposed to heavy urban air pollution and chronic stress, cellular glutathione levels drop dramatically, leading to dullness, loss of elasticity, and uneven skin tone.',
        ],
      },
      {
        heading: '2. The Melanin Switching Mechanism',
        body: [
          'Human melanocytes produce two types of pigment: eumelanin (dark brown/black) and pheomelanin (light golden/red).',
          'Clinical studies demonstrate that high intracellular levels of reduced glutathione (GSH) bind with dopaquinone, diverting the melanogenesis pathway away from eumelanin and toward pheomelanin, producing a naturally illuminated, clearer complexion.',
        ],
      },
    ],
  },
  {
    _id: 'blog-natural-science-05',
    slug: 'the-power-of-natural-ingredients-in-skincare',
    title: 'The Power of Natural Ingredients in Skincare: Backed by Science',
    subtitle: 'Where age-old botanical wisdom merges with cellular bio-fermentation',
    category: 'Wellness',
    coverImage: '/images/blogs/Natural.png',
    publishedAt: '2026-06-05',
    readTime: '4 min read',
    author: {
      name: 'Hydra Botanical Lab',
      role: 'Research & Innovation Team',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Natural Care', 'Plant Actives', 'Clean Beauty', 'Skin Science'],
    excerpt:
      'Discover how bio-active botanical compounds and plant stem cells can out-perform harsh synthetic alternatives in collagen regeneration and barrier protection.',
    keyTakeaways: [
      'Plant squalane derived from renewable sugarcane mirrors human sebum 1:1 without clogging pores.',
      'Gotu Kola (Centella Asiatica) accelerates barrier healing by up to 300%.',
      'Cold-pressed botanical oils preserve delicate polyphenols and essential fatty acids.',
    ],
    recommendedProduct: {
      name: 'Hydra Glow Serum',
      slug: 'hydra-glow-serum',
      price: 1499,
      image: '/images/products/hydra-glow-serum.jpg',
      tag: 'Best Seller',
    },
    sections: [
      {
        heading: '1. The New Era of Botanical Biotechnology',
        body: [
          'For decades, consumers had to choose between "natural" products that felt good but lacked clinical potency, or "scientific" products that delivered results at the cost of barrier irritation.',
          'Bio-fermentation has shattered this false dichotomy. By fermenting plant botanicals with micro-organisms, we break down large plant molecules into bio-compatible micro-droplets that penetrate deep into the dermal matrix.',
        ],
      },
      {
        heading: '2. Phytochemical Synergies That Work',
        body: [
          'Our lab pairs botanical centella asiatica with triple-weight hyaluronic acid. While hyaluronic acid draws moisture into intercellular spaces, centella acts on fibroblast receptors to synthesize structural ceramides, permanently sealing that moisture.',
        ],
      },
    ],
  },
  {
    _id: 'blog-glowing-habits-06',
    slug: '5-skincare-habits-for-healthy-glowing-skin',
    title: '5 Skincare Habits for Healthy, Glowing Skin',
    subtitle: 'Simple everyday rituals to transform dull, fatigued skin into radiance',
    category: 'Skincare Tips',
    coverImage: '/images/blogs/Glowing.png',
    publishedAt: '2026-05-28',
    readTime: '4 min read',
    author: {
      name: 'Sneha Patel',
      role: 'Wellness & Skincare Contributor',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    tags: ['Daily Habits', 'Skin Barrier', 'Hydration', 'Glow Guide'],
    excerpt:
      'Simple everyday rituals and scientifically backed habits to transform dull, fatigued skin into a naturally radiant, hydrated complexion.',
    keyTakeaways: [
      'The 60-Second Rule: Seal in moisture with a humectant within 60 seconds of patting dry.',
      'Never sleep with sunscreen or daily urban particulate pollution on your face.',
      'Maintain an optimal epidermal pH between 4.7 and 5.5.',
      'Allow your skin barrier at least 28 days—one full renewal cycle—to demonstrate true change.',
    ],
    recommendedProduct: {
      name: 'Hydra Nourish Cream',
      slug: 'hydra-nourish-cream',
      price: 1299,
      image: '/images/products/hydra-nourish-cream.jpg',
      tag: 'New',
    },
    sections: [
      {
        heading: '1. The Sixty-Second Hydration Seal',
        body: [
          'When you wash your face, water evaporates rapidly through transepidermal water loss (TEWL), taking your skin\'s own natural moisturizing factors (NMF) with it.',
          'Never let your skin dry out completely. While your skin is still cool and slightly damp, apply your Hydra Glow Serum immediately. This locks in surface moisture and doubles absorption.',
        ],
      },
      {
        heading: '2. Consistent Nighttime Lipid Renewal',
        body: [
          'While you sleep, cutaneous blood flow increases and cellular mitosis peaks. Applying a ceramide-rich barrier cream before bed gives your skin the essential fatty acids it needs to repair daily UV and oxidative micro-tears.',
        ],
      },
    ],
  },
];

export const getStaticBlogBySlug = (slug: string): BlogItem | undefined => {
  return PREDEFINED_BLOGS.find((b) => b.slug === slug || b._id === slug);
};

export const getRelatedBlogs = (currentSlug: string, count: number = 3): BlogItem[] => {
  return PREDEFINED_BLOGS.filter((b) => b.slug !== currentSlug).slice(0, count);
};
