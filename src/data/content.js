// Digitalsofts Partner Network — structured content
// Distilled from the DPN program brief into data the UI consumes.

export const stats = [
  { value: '120+', label: 'Business solutions' },
  { value: '20+', label: 'Years of experience' },
  { value: '12', label: 'Industry verticals' },
  { value: '5', label: 'Partner tiers' },
]

export const tiers = [
  {
    id: 'affiliate',
    name: 'Affiliate',
    tagline: 'Sends traffic & leads',
    investment: 'None',
    revenue: '15–20%',
    color: 'orange-300',
    who: 'Freelancers, bloggers, YouTubers, consultants, students, existing customers',
    does: 'Introduces potential customers — no direct selling required.',
  },
  {
    id: 'referral',
    name: 'Referral Partner',
    tagline: 'Qualifies & introduces buyers',
    investment: 'Low',
    revenue: '20–25%',
    color: 'orange-400',
    who: 'Accountants, tax consultants, business advisors, IT companies',
    does: 'Identifies prospects, understands requirements, joins meetings and helps close — Digitalsofts runs the demo, proposal, contract and delivery.',
  },
  {
    id: 'reseller',
    name: 'Reseller',
    tagline: 'Sells under partner pricing',
    investment: 'Medium',
    revenue: '20–35%',
    color: 'orange-500',
    who: 'IT companies, ERP consultants, hardware dealers, digital agencies',
    does: 'Buys at partner price, sells at RRP, and owns the commercial relationship with the customer.',
    featured: true,
  },
  {
    id: 'certified',
    name: 'Certified Reseller',
    tagline: 'Sells, onboards & supports',
    investment: 'Medium / High',
    revenue: '25–40%',
    color: 'orange-600',
    who: 'Established resellers who complete Digitalsofts certification',
    does: 'Adds first-level implementation, training and support on top of sales.',
  },
  {
    id: 'strategic',
    name: 'Strategic Partner',
    tagline: 'Owns a territory or vertical',
    investment: 'High',
    revenue: '35–50%+',
    color: 'orange-800',
    who: 'Top 1–5% of the network — regional or vertical specialists',
    does: 'Builds a substantial sales channel across a territory or industry vertical, with custom terms.',
  },
]

export const progression = ['Affiliate', 'Referral', 'Reseller', 'Certified', 'Strategic']

export const productCommissions = [
  {
    id: 'onetime',
    label: 'One-time License',
    example: 'PKR 100,000 product purchase',
    rows: [
      { tier: 'Affiliate', rate: '10–20%', note: 'of collected license revenue' },
      { tier: 'Referral Partner', rate: '20–25%', note: 'of first-year revenue' },
      { tier: 'Reseller', rate: '20–35%', note: 'margin on partner price' },
      { tier: 'Certified Reseller', rate: '25–40%', note: 'margin + support upside' },
    ],
  },
  {
    id: 'saas',
    label: 'SaaS / Subscription',
    example: 'PKR 10,000/month recurring seat',
    rows: [
      { tier: 'Standard Partner', rate: '15–20%', note: 'recurring, monthly' },
      { tier: 'Active Reseller', rate: '20–25%', note: 'recurring, monthly' },
      { tier: 'Certified Reseller', rate: '25–30%', note: 'recurring, monthly' },
      { tier: 'High-volume Partner', rate: '30–35%', note: 'recurring, monthly' },
      { tier: 'Strategic Partner', rate: '35–45%', note: 'custom recurring terms' },
    ],
  },
  {
    id: 'services',
    label: 'Professional Services',
    example: 'Custom dev, AI, cloud, cybersecurity, marketing',
    rows: [
      { tier: 'Affiliate', rate: '5%', note: 'flat, across service lines' },
      { tier: 'Referral Partner', rate: '8–10%', note: 'flat, across service lines' },
      { tier: 'Reseller', rate: '10–20%', note: 'varies by delivery cost' },
    ],
  },
]

export const servicesMatrix = [
  { service: 'Custom Software', affiliate: '5%', referral: '8%', reseller: '10–15%' },
  { service: 'AI Projects', affiliate: '5%', referral: '8%', reseller: '10–15%' },
  { service: 'Cloud', affiliate: '5%', referral: '10%', reseller: '15–20%' },
  { service: 'Cybersecurity', affiliate: '5%', referral: '8%', reseller: '10–15%' },
  { service: 'Website', affiliate: '5%', referral: '10%', reseller: '15%' },
  { service: 'Digital Marketing', affiliate: '5%', referral: '10%', reseller: '15–20%' },
  { service: 'Consultancy', affiliate: '5%', referral: '8%', reseller: '10–15%' },
]

export const marginTiers = [
  { level: 'Registered Reseller', sales: '< PKR 1M / year', margin: '20%' },
  { level: 'Silver', sales: 'PKR 1–3M / year', margin: '25%' },
  { level: 'Gold', sales: 'PKR 3–10M / year', margin: '30%' },
  { level: 'Platinum', sales: 'PKR 10–25M / year', margin: '35%' },
  { level: 'Strategic', sales: 'PKR 25M+ / year', margin: '40%+' },
]

// Source: Digitalsofts product catalog (digitalsofts_product_catalog.xlsx) —
// real categories and real product names, not illustrative placeholders.
export const verticals = [
  { name: 'Retail', products: ['Retail Management Software', 'Jewellery Store Management', 'Beauty & Cosmetics Shop', 'Book Shop Billing', 'Luggage & Bags Business'] },
  { name: 'Oil & Gas', products: ['Petrol Pump Software', 'LPG Business Software', 'Gas Station Software', 'Fuel Management Software'] },
  { name: 'Manufacturing', products: ['Garments Manufacturing', 'Apparel Manufacturing', 'Furniture Manufacturing', 'Sweets & Bakery', 'Paper & Pulp', 'Plastic & Rubber'] },
  { name: 'Textile', products: ['Textile Industry ERP', 'Printing & Dyeing', 'Fashion Boutique Management'] },
  { name: 'Hospitality', products: ['Hotel Management Software', 'Cafe Management Software', 'Banquet Hall Management'] },
  { name: 'SME ERP', products: ['Cloud ERP for Services Business', 'Small & Medium Businesses Software'] },
  { name: 'Logistics', products: ['Logistics & Transportation Software', 'Auto Accessories Business Software'] },
  { name: 'Real Estate', products: ['Property Management Software'] },
  { name: 'Poultry', products: ['Poultry Layer Farm Management', 'Poultry Chicken Farm Processing'] },
  { name: 'Agriculture', products: ['Cloud ERP for Agriculture Business'] },
  { name: 'Visa Consultancy', products: ['Software for Visa & Immigration Consultants'] },
  { name: 'Electronics', products: ['Computer & Laptop Business Software', 'Electronics Store Management'] },
]

export const territoryModel = [
  {
    name: 'Non-exclusive',
    rate: '25%',
    detail: 'Anyone can sell into the territory or vertical.',
  },
  {
    name: 'Preferred Partner',
    rate: '30%',
    detail: 'Digitalsofts prioritizes leads to this partner first.',
  },
  {
    name: 'Exclusive Partner',
    rate: '35%',
    detail: 'Sole rights — earned via minimum annual sales, marketing investment, certified staff and quarterly targets. Exclusivity lapses automatically if targets are missed.',
    featured: true,
  },
]

export const discountAuthority = [
  { tier: 'Affiliate', discount: 'None' },
  { tier: 'Referral Partner', discount: 'None' },
  { tier: 'Registered Reseller', discount: '5%' },
  { tier: 'Silver', discount: '10%' },
  { tier: 'Gold', discount: '15%' },
  { tier: 'Platinum', discount: '20%' },
  { tier: 'Strategic', discount: 'Negotiated' },
]

export const dealRegistrationSteps = [
  {
    step: '01',
    title: 'Register the opportunity',
    detail: 'Partner submits customer, industry, country, product and estimated value in the portal.',
  },
  {
    step: '02',
    title: 'Digitalsofts approves',
    detail: 'Deal is reviewed and approved, opening a protection window.',
  },
  {
    step: '03',
    title: '60–90 day protection',
    detail: 'Digitalsofts cannot bypass the partner and sell direct without paying the agreed commission.',
  },
  {
    step: '04',
    title: 'Close & get paid',
    detail: 'Commission is calculated automatically on collected revenue and paid on schedule.',
  },
]

export const certifications = [
  { name: 'Sales Certified', detail: 'Product, pricing, positioning and demo delivery.' },
  { name: 'Implementation Certified', detail: 'Configuration, onboarding, training and data migration.' },
  { name: 'Technical Certified', detail: 'Troubleshooting, API integration and deployments.' },
]

export const academyTracks = [
  'Digitalsofts Ecosystem (Product 101)',
  'Product Specialist (per ERP/product)',
  'Sales Certification',
  'Demo Certification',
  'Implementation Certification',
  'Support Certification',
  'AI Sales Certification',
]

export const portalModules = [
  'Leads', 'Deal Registration', 'Customers', 'Opportunities', 'Commissions',
  'Payouts', 'Products & Pricing', 'Sales & Marketing Assets', 'Training & Certifications',
  'Support Tickets', 'Knowledge Base', 'Performance',
]

export const portalStats = [
  { label: 'Total Revenue Generated', value: 'PKR 2.4M' },
  { label: 'Pending Commissions', value: 'PKR 220K' },
  { label: 'Paid Commissions', value: 'PKR 890K' },
  { label: 'Active Customers', value: '42' },
  { label: 'Active Opportunities', value: '17' },
  { label: 'Conversion Rate', value: '24%' },
]

export const incentiveBonuses = [
  { target: 'PKR 1M', bonus: 'PKR 25,000' },
  { target: 'PKR 3M', bonus: 'PKR 100,000' },
  { target: 'PKR 10M', bonus: 'PKR 400,000' },
  { target: 'PKR 25M', bonus: 'Strategic Partner status' },
]

export const personas = [
  { name: 'Accountants', reason: 'Hundreds of existing business relationships' },
  { name: 'Tax Consultants', reason: 'Natural fit for FBR / e-invoicing products' },
  { name: 'IT Companies', reason: 'Need products to sell alongside services' },
  { name: 'Software Consultants', reason: 'Already have customer trust' },
  { name: 'Digital Agencies', reason: 'Can cross-sell software to existing clients' },
  { name: 'ERP Consultants', reason: 'Very strong, high-intent channel' },
  { name: 'Industry Associations', reason: 'Potential strategic / vertical partners' },
  { name: 'Hardware Dealers', reason: 'POS, barcode, biometric & networking synergy' },
]

export const guardrails = [
  'No 40–50% commissions handed out by default',
  'No lifetime commission without conditions',
  'No territory exclusivity granted immediately',
  'No uncontrolled public discounting (MAP enforced)',
  'No product source code or core IP shared',
  'No commissions on unpaid / uncollected invoices',
  'No unlimited partner approval — every applicant is screened',
]

export const roadmap = [
  { phase: 'Phase 1 — 90 days', partners: '100 registered / 20 active', target: 'PKR 5–10M partner-generated revenue' },
  { phase: 'Phase 2 — 6 months', partners: '300 registered / 75 active', target: 'PKR 25–50M partner-generated revenue' },
  { phase: 'Phase 3 — 12 months', partners: '1,000 registered / 250 active / 50 certified / 10 strategic', target: 'PKR 100M+ partner-generated revenue' },
]

export const kpis = [
  { group: 'Acquisition', metrics: ['Applications', 'Approved partners', 'Certified partners', 'Active partners'] },
  { group: 'Activation', metrics: ['% generating first lead', 'Time to first lead', 'Time to first sale'] },
  { group: 'Revenue', metrics: ['Partner-generated pipeline', 'Recurring revenue', 'Revenue per active partner'] },
  { group: 'Retention', metrics: ['Partner retention', 'Customer retention', 'Partner churn'] },
]

export const businessInBox = [
  'Partner account & unique referral ID', 'Full product catalog & wholesale pricing', 'Demo account access',
  'Sales training & certification', 'Sales & WhatsApp scripts', 'Proposal templates',
  'Marketing creatives & landing page', 'Lead & deal registration', 'Commission dashboard',
  'Support portal & demo booking', 'Product videos & case studies',
]
