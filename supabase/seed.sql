-- ============================================================================
-- Digitalsofts Partner Network — reference/seed data
-- Run AFTER 0001_init.sql. This is catalog/configuration data an admin would
-- normally enter through the admin UI — NOT sample user accounts, leads, or
-- deals. Safe to re-run (upserts on natural keys).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- partner_tiers
-- ----------------------------------------------------------------------------

insert into public.partner_tiers
  (key, name, tagline, description, sort_order, min_commission, max_commission, saas_commission, service_commission, discount_authority, annual_sales_target, requirements, benefits, certification_required)
values
  ('affiliate', 'DS Affiliate', 'Sends traffic & leads', 'Introduces potential customers — no direct selling required.', 1, 15, 20, 15, 5, 0, null,
    'No prior sales experience required.', 'Referral link, marketing assets, monthly payouts.', false),
  ('referral', 'DS Referral Partner', 'Qualifies & introduces buyers', 'Identifies prospects, joins meetings and helps close — Digitalsofts runs the demo, proposal and delivery.', 2, 20, 25, 20, 8, 0, null,
    'Existing customer relationships in a target industry.', 'Higher commission, deal visibility, co-selling support.', false),
  ('reseller', 'DS Reseller', 'Sells under partner pricing', 'Buys at partner price, sells at RRP, and owns the commercial relationship.', 3, 20, 35, 25, 12, 5, 1000000,
    'Registered business entity, minimum PKR 1M annual sales.', 'Wholesale pricing, deal registration protection, MDF eligibility.', false),
  ('certified', 'DS Certified Partner', 'Sells, onboards & supports', 'Adds first-level implementation, training and support on top of sales.', 4, 25, 40, 30, 15, 15, 3000000,
    'Sales + Implementation certification completed.', 'Higher margin, implementation revenue, priority leads.', true),
  ('strategic', 'DS Strategic Partner', 'Owns a territory or vertical', 'Builds a substantial sales channel across a territory or industry vertical, with custom terms.', 5, 35, 50, 45, 20, 100, 25000000,
    'Minimum PKR 25M annual sales, certified staff, quarterly business reviews.', 'Custom terms, exclusive territory eligibility, strategic account support.', true)
on conflict (key) do update set
  name = excluded.name, tagline = excluded.tagline, description = excluded.description,
  sort_order = excluded.sort_order, min_commission = excluded.min_commission, max_commission = excluded.max_commission,
  saas_commission = excluded.saas_commission, service_commission = excluded.service_commission,
  discount_authority = excluded.discount_authority, annual_sales_target = excluded.annual_sales_target,
  requirements = excluded.requirements, benefits = excluded.benefits, certification_required = excluded.certification_required;

-- ----------------------------------------------------------------------------
-- product_categories
-- Source: digitalsofts_product_catalog.xlsx ("Product Catalog" sheet, Category
-- column) — the 12 categories Digitalsofts actually publishes products under.
-- ----------------------------------------------------------------------------

insert into public.product_categories (name, slug, vertical, description) values
  ('Retail Industry', 'retail-industry', 'Retail', 'Point-of-sale and retail management software for shops and multi-branch retailers.'),
  ('Oil & Gas Industry', 'oil-gas-industry', 'Oil & Gas', 'Fuel station, LPG and fleet fuel management software.'),
  ('Manufacturing Industry', 'manufacturing-industry', 'Manufacturing', 'ERP software for garments, bakery, apparel, furniture, paper and plastics manufacturers.'),
  ('Textile Industry', 'textile-industry', 'Textile', 'ERP, printing/dyeing and boutique management software for the textile industry.'),
  ('Hospitality Business', 'hospitality-business', 'Hospitality', 'Property, cafe and banquet hall management software.'),
  ('ERP for Small & Medium Businesses', 'erp-smb', 'SME ERP', 'Cloud ERP software for services businesses and general SMEs.'),
  ('Logistics & Transportation Business', 'logistics-transportation', 'Logistics', 'Fleet, transportation and auto accessories business software.'),
  ('Real Estate Business', 'real-estate-business', 'Real Estate', 'Property and housing society management software.'),
  ('Poultry Business', 'poultry-business', 'Poultry', 'Farm management and processing software for poultry operations.'),
  ('Agriculture Business', 'agriculture-business', 'Agriculture', 'Cloud ERP software for agriculture businesses.'),
  ('Visa Consultancy', 'visa-consultancy', 'Visa Consultancy', 'Case and client management software for visa and immigration consultants.'),
  ('Electronics', 'electronics', 'Electronics', 'Retail and inventory management software for computer, laptop and electronics stores.')
on conflict (slug) do update set
  name = excluded.name, vertical = excluded.vertical, description = excluded.description;

-- ----------------------------------------------------------------------------
-- products
-- Source: digitalsofts_product_catalog.xlsx — 32 products actually listed on
-- digitalsofts.com/software-products/. Pricing is the sheet's "Draft Est.
-- Retail Price (USD/yr)" column — the sheet's own legend notes these are
-- DRAFT ESTIMATES pending confirmation by Digitalsofts leadership/sales
-- (PRD Section 9, Open Item #1), hence pricing_confirmed = false below.
-- Re-running this script refreshes catalog facts from the source but never
-- touches is_active or pricing_confirmed, which are admin-owned afterwards.
-- ----------------------------------------------------------------------------

-- Deactivate the placeholder catalog that predates this import.
update public.products set is_active = false
where slug in (
  'jewellery-erp', 'jewellery-pos', 'textile-production-erp', 'poultry-farm-manager',
  'agriculture-erp', 'retail-pos-suite', 'hospitality-pms', 'field-operations-erp',
  'fleet-dispatch-manager', 'real-estate-crm', 'digitalmanager-einvoicing', 'ai-reporting-addon'
);

insert into public.products (category_id, name, slug, description, product_type, retail_price, currency, source_url, pricing_confirmed, is_active)
select c.id, p.name, p.slug, p.description, p.product_type, p.retail_price, 'USD', p.source_url, false, true
from (values
  ('retail-industry', 'Retail Management Software', 'retail-management-software',
    'Cloud-based retail management software for multi-branch stores — sales, inventory and billing in one system.',
    'saas', 1200, 'https://www.digitalsofts.com/products/retail-management-software/'),
  ('retail-industry', 'Luggage & Bags Business Software', 'luggage-bags-business-software',
    'Retail management software built for luggage and bags stores, covering inventory, billing and stock across branches.',
    'saas', 1000, 'https://www.digitalmanager.pk/bags-business-management-software/'),
  ('retail-industry', 'Book Shop Billing Management Software', 'book-shop-billing-management-software',
    'Billing and inventory management software designed for bookshops and stationery retailers.',
    'saas', 600, 'https://www.digitalsofts.com/book-shop-billing-management-software/'),
  ('retail-industry', 'Beauty and Cosmetics Shop Software', 'beauty-and-cosmetics-shop-software',
    'Retail management software for beauty and cosmetics stores, covering POS, inventory and customer records.',
    'saas', 1000, 'https://www.digitalsofts.com/beauty-and-cosmetics-shop-software/'),
  ('retail-industry', 'Jewellery Store Management Software', 'jewellery-store-management-software',
    'Retail management software for jewellery stores — inventory, billing and stock tracking.',
    'saas', 1500, 'https://www.digitalsofts.com/jewellery-store-management-software/'),

  ('oil-gas-industry', 'Petrol Pump Software', 'petrol-pump-software',
    'Fuel station management software for petrol pumps — dispensing, sales, tank inventory and reconciliation.',
    'saas', 35000, 'https://www.digitalsofts.com/products/petrol-pump-software/'),
  ('oil-gas-industry', 'LPG Business Software', 'lpg-business-software',
    'Business management software for LPG distribution and retail operations.',
    'saas', 35000, 'https://www.digitalsofts.com/lpg-business-management-software/'),
  ('oil-gas-industry', 'Gas Station Software', 'gas-station-software',
    'Gas station management software covering fuel sales, inventory and daily reconciliation.',
    'saas', 35000, 'https://www.digitalsofts.com/products/gas-station-software/'),
  ('oil-gas-industry', 'Fuel Management Software', 'fuel-management-software',
    'Fleet fuel management software for tracking consumption, dispensing and fuel inventory across vehicles.',
    'saas', 30000, 'https://www.digitalsofts.com/fleet-fuel-management-software-system/'),

  ('manufacturing-industry', 'Garments Manufacturing Software', 'garments-manufacturing-software',
    'Cloud ERP for garments manufacturing — production planning, inventory and order management.',
    'saas', 30000, 'https://www.digitalmanager.pk/cloud-erp-software-for-garments-manufacturing-business/'),
  ('manufacturing-industry', 'Sweets & Bakery Manufacturing Software', 'sweets-bakery-manufacturing-software',
    'Manufacturing management software for sweets and bakery production businesses.',
    'saas', 20000, 'https://www.digitalsofts.com/products/sweets-and-bakery-manufacturing-software/'),
  ('manufacturing-industry', 'Apparel Manufacturing Software', 'apparel-manufacturing-software',
    'ERP software for apparel manufacturing — production tracking, inventory and order management.',
    'saas', 30000, 'https://www.digitalsofts.com/products/software-for-apparel-manufacturing-industry/'),
  ('manufacturing-industry', 'Furniture Manufacturing Software', 'furniture-manufacturing-software',
    'ERP software for modular furniture manufacturing, covering production, inventory and orders.',
    'saas', 25000, 'https://www.digitalsofts.com/modular-furniture-manufacturing-erp-software/'),
  ('manufacturing-industry', 'Paper and Pulp Manufacturing Software', 'paper-and-pulp-manufacturing-software',
    'Manufacturing management software for paper and pulp production businesses.',
    'saas', 30000, 'https://www.digitalsofts.com/paper-and-pulp-manufacturing-software/'),
  ('manufacturing-industry', 'Plastic and Rubber Manufacturing Software', 'plastic-and-rubber-manufacturing-software',
    'Manufacturing management software for plastic and rubber production businesses.',
    'saas', 30000, 'https://www.digitalsofts.com/plastic-and-rubber-manufacturing-software/'),

  ('textile-industry', 'Cloud ERP Software for Textile Industries', 'cloud-erp-software-for-textile-industries',
    'Cloud ERP for the textile industry covering production, inventory and finance.',
    'saas', 35000, 'https://www.digitalsofts.com/products/textile-industry-management-software/'),
  ('textile-industry', 'Printing & Dyeing Industry Software', 'printing-dyeing-industry-software',
    'Management software for textile printing and dyeing operations.',
    'saas', 25000, 'https://www.digitalsofts.com/products/digital-textile-printing-software/'),
  ('textile-industry', 'Fashion Boutique Management Software', 'fashion-boutique-management-software',
    'Retail management software for fashion boutiques — inventory, billing and customer management.',
    'saas', 12000, 'https://www.digitalsofts.com/fashion-boutique-management-software/'),

  ('hospitality-business', 'Hotel Management Software', 'hotel-management-software',
    'Property management software for hotels — bookings, front desk, housekeeping and billing.',
    'saas', 15000, 'https://www.digitalsofts.com/products/hotel-management-software/'),
  ('hospitality-business', 'Cafe Management Software', 'cafe-management-software',
    'POS and management software for cafes — orders, billing and inventory.',
    'saas', 5000, 'https://www.digitalsofts.com/cafe-management-software/'),
  ('hospitality-business', 'Banquet Hall Management Software', 'banquet-hall-management-software',
    'Booking and management software for banquet halls and event venues.',
    'saas', 8000, 'https://www.digitalsofts.com/banquet-hall-management-software/'),

  ('erp-smb', 'Cloud ERP Software For Services Business', 'cloud-erp-software-for-services-business',
    'Cloud ERP for service-based businesses covering billing, scheduling and client management.',
    'saas', 20000, 'https://www.digitalmanager.pk/services-management-software/'),
  ('erp-smb', 'Small & Medium Businesses Software', 'small-medium-businesses-software',
    'Cloud ERP software for small and medium businesses covering accounting, inventory and billing.',
    'saas', 15000, 'https://www.digitalmanager.pk/cloud-erp-software-for-small-medium-businesses/'),

  ('logistics-transportation', 'Logistics & Transportation Software', 'logistics-transportation-software',
    'Cloud ERP for logistics and transportation businesses — fleet, dispatch and billing.',
    'saas', 30000, 'https://www.digitalmanager.pk/cloud-erp-software-for-logistics-transportation-businesses/'),
  ('logistics-transportation', 'Auto Accessories Business Software', 'auto-accessories-business-software',
    'Retail and inventory management software for auto accessories businesses.',
    'saas', 15000, 'https://www.digitalsofts.com/auto-accessories-business-software/'),

  ('real-estate-business', 'Property Management Software', 'property-management-software',
    'Property and housing society management software for real estate operators.',
    'saas', 10000, 'https://www.digitalsofts.com/housing-society-software-for-property-management/'),

  ('poultry-business', 'Poultry Layer Farm Management Software', 'poultry-layer-farm-management-software',
    'Farm management software for poultry layer operations — flock, inventory and production tracking.',
    'saas', 20000, 'https://www.digitalsofts.com/products/poultry-layer-farm-management-software/'),
  ('poultry-business', 'Poultry Chicken Farm Processing Software', 'poultry-chicken-farm-processing-software',
    'Processing and inventory management software for poultry chicken farms.',
    'saas', 25000, 'https://www.digitalsofts.com/poultry-chicken-farm-processing-software/'),

  ('agriculture-business', 'Cloud ERP Software for Agriculture Business', 'cloud-erp-software-for-agriculture-business',
    'Cloud ERP for agriculture businesses covering farm operations, inventory and accounting.',
    'saas', 20000, 'https://www.digitalsofts.com/software-for-agriculture-management/'),

  ('visa-consultancy', 'Software For Visa & Immigration Consultants', 'software-for-visa-immigration-consultants',
    'Cloud ERP for visa and immigration consultancies — case tracking, client management and billing.',
    'saas', 8000, 'https://www.digitalmanager.pk/cloud-erp-software-for-visa-immigration-consultants/'),

  ('electronics', 'Computer & Laptop Business Software', 'computer-laptop-business-software',
    'Retail and inventory management software for computer and laptop businesses.',
    'saas', 1000, 'https://www.digitalmanager.pk/computer-laptop-business-management-software/'),
  ('electronics', 'Electronics Store Management Software', 'electronics-store-management-software',
    'Retail management software for electronics stores — inventory, billing and stock tracking.',
    'saas', 1200, 'https://www.digitalmanager.pk/electronics-store-management-software/')
) as p(cat_slug, name, slug, description, product_type, retail_price, source_url)
join public.product_categories c on c.slug = p.cat_slug
on conflict (slug) do update set
  category_id = excluded.category_id, name = excluded.name, description = excluded.description,
  product_type = excluded.product_type, retail_price = excluded.retail_price,
  currency = excluded.currency, source_url = excluded.source_url;

-- ----------------------------------------------------------------------------
-- product_pricing — partner price + commission per tier, per product
-- Draft estimates derived from each tier's commission rate — same caveat as
-- retail pricing: confirm with Digitalsofts before treating as final.
-- ----------------------------------------------------------------------------

insert into public.product_pricing (product_id, tier_id, partner_price, commission_percent, recurring_commission_percent)
select p.id, t.id,
  case p.product_type
    when 'saas' then p.retail_price
    else round(p.retail_price * (1 - (t.max_commission / 100)), 2)
  end,
  case p.product_type
    when 'saas' then t.saas_commission
    when 'service' then t.service_commission
    else t.max_commission
  end,
  case when p.product_type = 'saas' then t.saas_commission else null end
from public.products p
cross join public.partner_tiers t
where p.is_active = true
on conflict (product_id, tier_id) do nothing;

-- ----------------------------------------------------------------------------
-- courses + lessons (Partner Academy)
-- ----------------------------------------------------------------------------

insert into public.courses (title, slug, description, track, certification_type, order_index, is_active) values
  ('Digitalsofts Ecosystem', 'digitalsofts-ecosystem', 'Product 101 — the full Digitalsofts portfolio at a glance.', 'general', null, 1, true),
  ('Sales Certification', 'sales-certification', 'Product, pricing, positioning and demo delivery.', 'sales', 'sales', 2, true),
  ('Demo Certification', 'demo-certification', 'How to run a winning Digitalsofts demo.', 'sales', 'sales', 3, true),
  ('Implementation Certification', 'implementation-certification', 'Configuration, onboarding, training and data migration.', 'implementation', 'implementation', 4, true),
  ('Support Certification', 'support-certification', 'Troubleshooting and first-line support.', 'implementation', 'implementation', 5, true),
  ('Technical Integration Certification', 'technical-integration-certification', 'APIs, integrations and deployments.', 'technical', 'technical', 6, true),
  ('AI Sales Certification', 'ai-sales-certification', 'How to sell AI and automation add-ons.', 'general', null, 7, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, title, content, order_index)
select c.id, l.title, l.content, l.order_index
from (values
  ('digitalsofts-ecosystem', 'The 120+ solution portfolio', 'Overview of every Digitalsofts vertical and product line.', 1),
  ('digitalsofts-ecosystem', 'How the partner network fits together', 'Affiliate → Referral → Reseller → Certified → Strategic.', 2),
  ('sales-certification', 'Positioning against competitors', 'How to frame Digitalsofts value versus alternatives.', 1),
  ('sales-certification', 'Pricing & partner margin', 'How partner pricing and commission are calculated.', 2),
  ('demo-certification', 'Running a 20-minute demo', 'Structure, discovery questions, and objection handling.', 1),
  ('implementation-certification', 'Onboarding checklist', 'Step-by-step customer onboarding process.', 1),
  ('implementation-certification', 'Data migration basics', 'Safely migrating customer data into Digitalsofts products.', 2),
  ('support-certification', 'First-line troubleshooting', 'Common issues and how to resolve them before escalating.', 1),
  ('technical-integration-certification', 'API fundamentals', 'Authentication, endpoints and rate limits.', 1),
  ('technical-integration-certification', 'Deployment patterns', 'Cloud vs on-premise deployment considerations.', 2),
  ('ai-sales-certification', 'Selling AI add-ons', 'How to identify and pitch AI automation opportunities.', 1)
) as l(course_slug, title, content, order_index)
join public.courses c on c.slug = l.course_slug
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- incentives
-- ----------------------------------------------------------------------------

insert into public.incentives (title, description, target_amount, bonus_amount, bonus_type, period, is_active) values
  ('Quarterly Bonus — PKR 1M', 'Generate PKR 1M in partner revenue this quarter.', 1000000, 25000, 'cash', 'quarterly', true),
  ('Quarterly Bonus — PKR 3M', 'Generate PKR 3M in partner revenue this quarter.', 3000000, 100000, 'cash', 'quarterly', true),
  ('Quarterly Bonus — PKR 10M', 'Generate PKR 10M in partner revenue this quarter.', 10000000, 400000, 'cash', 'quarterly', true),
  ('Strategic Partner Status', 'Generate PKR 25M in annual revenue.', 25000000, null, 'status_upgrade', 'annual', true)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- territories
-- ----------------------------------------------------------------------------

insert into public.territories (name, country, region, vertical, model, min_annual_sales) values
  ('Karachi — Retail', 'Pakistan', 'Karachi', 'Retail', 'non_exclusive', null),
  ('Lahore — Textile', 'Pakistan', 'Lahore', 'Textile', 'preferred', 5000000),
  ('Faisalabad — Textile', 'Pakistan', 'Faisalabad', 'Textile', 'preferred', 5000000),
  ('UAE — Jewellery', 'UAE', null, 'Jewellery', 'exclusive', 10000000),
  ('Saudi Arabia — Hospitality', 'Saudi Arabia', null, 'Hospitality', 'preferred', 8000000)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- system_settings
-- ----------------------------------------------------------------------------

insert into public.system_settings (key, value, description) values
  ('deal_protection_days', '{"days": 90}', 'Number of days a registered deal is protected after approval.'),
  ('payout_minimum_pkr', '{"amount": 5000}', 'Minimum payout threshold, local currency (PKR).'),
  ('payout_minimum_usd', '{"amount": 50}', 'Minimum payout threshold, international (USD equivalent).'),
  ('mdf_rate_percent', '{"min": 2, "max": 5}', 'Marketing Development Fund range as % of qualifying sales, Gold+ tiers.'),
  ('exclusive_territory_min_annual_sales', '{"amount": 10000000}', 'Minimum annual sales (PKR) to qualify for exclusive territory rights.')
on conflict (key) do update set value = excluded.value, description = excluded.description;

-- ----------------------------------------------------------------------------
-- roles, permissions, role_permissions (requires 0003_super_admin_rbac.sql)
-- ----------------------------------------------------------------------------

insert into public.roles (key, name, description, is_system) values
  ('super_admin', 'Super Admin', 'Complete, unconditional system access.', true),
  ('partner_manager', 'Partner Manager', 'Partners, applications, tiers and territories.', false),
  ('sales_manager', 'Sales Manager', 'Leads, opportunities and deal approvals.', false),
  ('finance_manager', 'Finance Manager', 'Commissions, payouts and MDF.', false),
  ('product_manager', 'Product Manager', 'Products, categories and pricing.', false),
  ('training_manager', 'Training Manager', 'Academy, certifications and content assets.', false),
  ('support_manager', 'Support Manager', 'Support tickets and knowledge base.', false)
on conflict (key) do update set name = excluded.name, description = excluded.description;

insert into public.permissions (key, label, group_name) values
  ('partners.view', 'View partners', 'Partners'),
  ('partners.edit', 'Edit partners', 'Partners'),
  ('partners.suspend', 'Suspend / reactivate partners', 'Partners'),
  ('applications.review', 'Review partner applications', 'Partners'),
  ('tiers.manage', 'Manage partner tiers', 'Partners'),
  ('territories.manage', 'Manage territories & exclusivity', 'Partners'),
  ('deals.approve', 'Approve / reject deal registrations', 'Sales'),
  ('products.create', 'Create products', 'Products'),
  ('products.edit', 'Edit products & categories', 'Products'),
  ('pricing.manage', 'Manage pricing, commission rules, MAP & discounts', 'Products'),
  ('commissions.approve', 'Approve / reverse commissions', 'Finance'),
  ('payouts.process', 'Process payouts', 'Finance'),
  ('mdf.manage', 'Manage MDF requests', 'Finance'),
  ('training.manage', 'Manage courses & lessons', 'Content'),
  ('certifications.manage', 'Manage certifications', 'Content'),
  ('content.manage', 'Manage sales & marketing assets', 'Content'),
  ('support.manage', 'Manage support tickets', 'Support'),
  ('marketplace.manage', 'Manage public partner marketplace', 'Channel'),
  ('compliance.manage', 'Manage fraud/compliance flags', 'Channel'),
  ('reports.view', 'View reports & analytics', 'System'),
  ('settings.manage', 'Manage system settings & SLA terms', 'System'),
  ('admins.manage', 'Manage admin users (Super Admin only, not delegable)', 'System'),
  ('audit.view', 'View audit logs', 'System')
on conflict (key) do update set label = excluded.label, group_name = excluded.group_name;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('partner_manager', 'partners.view'), ('partner_manager', 'partners.edit'), ('partner_manager', 'partners.suspend'),
  ('partner_manager', 'applications.review'), ('partner_manager', 'tiers.manage'), ('partner_manager', 'territories.manage'),
  ('partner_manager', 'reports.view'),
  ('sales_manager', 'deals.approve'), ('sales_manager', 'partners.view'), ('sales_manager', 'reports.view'),
  ('finance_manager', 'commissions.approve'), ('finance_manager', 'payouts.process'), ('finance_manager', 'mdf.manage'),
  ('finance_manager', 'reports.view'),
  ('product_manager', 'products.create'), ('product_manager', 'products.edit'), ('product_manager', 'pricing.manage'),
  ('product_manager', 'reports.view'),
  ('training_manager', 'training.manage'), ('training_manager', 'certifications.manage'), ('training_manager', 'content.manage'),
  ('training_manager', 'reports.view'),
  ('support_manager', 'support.manage'), ('support_manager', 'reports.view')
) as perm(role_key, key)
join public.roles r on r.key = perm.role_key
join public.permissions p on p.key = perm.key
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- sla_terms
-- ----------------------------------------------------------------------------

insert into public.sla_terms (party, category, term, sort_order) values
  ('digitalsofts', 'leads', 'Qualified leads provided where available', 1),
  ('digitalsofts', 'enablement', 'Product training and sales materials', 2),
  ('digitalsofts', 'enablement', 'Demo support on request', 3),
  ('digitalsofts', 'support', 'Technical support per partner tier', 4),
  ('digitalsofts', 'platform', 'Partner portal access and uptime', 5),
  ('digitalsofts', 'finance', 'Commission transparency and timely payouts', 6),
  ('digitalsofts', 'product', 'Ongoing product updates', 7),
  ('partner', 'conduct', 'Ethical selling practices', 1),
  ('partner', 'conduct', 'Trained representatives', 2),
  ('partner', 'conduct', 'Accurate product information to customers', 3),
  ('partner', 'support', 'Customer support per assigned tier', 4),
  ('partner', 'finance', 'Payment and reporting compliance', 5),
  ('partner', 'sales', 'Minimum sales target where applicable', 6),
  ('partner', 'pricing', 'No unauthorized discounts beyond tier authority', 7),
  ('partner', 'ip', 'No misuse of Digitalsofts IP or branding', 8)
on conflict (party, category, term) do nothing;
