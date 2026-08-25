// Business-rule constants that mirror seeded Supabase rows (partner_tiers,
// system_settings). Kept here as typed fallbacks/labels for the UI — the
// authoritative values live in the database so admins can change them
// without a deploy.

export const PARTNER_TIERS = ['affiliate', 'referral', 'reseller', 'certified', 'strategic']

export const TIER_LABELS = {
  affiliate: 'DS Affiliate',
  referral: 'DS Referral Partner',
  reseller: 'DS Reseller',
  certified: 'DS Certified Partner',
  strategic: 'DS Strategic Partner',
}

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'demo', 'proposal', 'won', 'lost']

export const LEAD_STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  demo: 'Demo',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

export const OPPORTUNITY_STAGES = [
  'qualified',
  'demo',
  'proposal',
  'negotiation',
  'won',
  'lost',
]

export const OPPORTUNITY_STAGE_LABELS = {
  qualified: 'Qualified',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export const DEAL_STATUSES = ['submitted', 'approved', 'rejected', 'expired', 'closed']

export const DEAL_STATUS_LABELS = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  closed: 'Closed',
}

export const COMMISSION_STATUSES = ['pending', 'approved', 'payable', 'paid', 'reversed']

export const COMMISSION_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  payable: 'Payable',
  paid: 'Paid',
  reversed: 'Reversed',
}

export const PAYOUT_STATUSES = ['pending', 'processing', 'paid', 'failed']

export const APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'more_info_required',
  'approved',
  'rejected',
]

export const APPLICATION_STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  more_info_required: 'More Information Required',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed']

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent']

export const CERTIFICATION_TYPES = ['sales', 'implementation', 'technical']

export const CERTIFICATION_TYPE_LABELS = {
  sales: 'Sales Certified',
  implementation: 'Implementation Certified',
  technical: 'Technical Certified',
}

export const TERRITORY_MODELS = ['non_exclusive', 'preferred', 'exclusive']

// Mirrors product_categories.vertical in Supabase (source: Digitalsofts
// product catalog — 12 categories actually published on digitalsofts.com).
export const VERTICALS = [
  'Retail', 'Oil & Gas', 'Manufacturing', 'Textile', 'Hospitality', 'SME ERP',
  'Logistics', 'Real Estate', 'Poultry', 'Agriculture', 'Visa Consultancy', 'Electronics',
]

export const PRODUCT_TYPES = ['one_time', 'saas', 'service']

export const PRODUCT_TYPE_LABELS = {
  one_time: 'One-time License',
  saas: 'SaaS / Subscription',
  service: 'Professional Service',
}

export const ROLES = { PARTNER: 'partner', ADMIN: 'admin', SUPER_ADMIN: 'super_admin', CUSTOMER: 'customer' }

export const STATUS_TONES = {
  new: 'blue', contacted: 'amber', qualified: 'violet', demo: 'violet',
  proposal: 'amber', won: 'green', lost: 'red',
  submitted: 'blue', under_review: 'amber', more_info_required: 'amber',
  approved: 'green', rejected: 'red', expired: 'gray', closed: 'gray',
  pending: 'amber', payable: 'blue', paid: 'green', reversed: 'red',
  processing: 'blue', failed: 'red',
  open: 'blue', in_progress: 'amber', waiting: 'amber', resolved: 'green',
  qualified_stage: 'violet', negotiation: 'amber',
  completed: 'green', investigating: 'amber', warned: 'amber', suspended: 'red',
  commission_cancelled: 'red', terminated: 'red', dismissed: 'gray',
}

// Mirrors public.permissions — the canonical set lives in the database
// (seed.sql), this is only used for local UI grouping/labels before the
// query resolves.
export const PERMISSION_GROUPS = ['Partners', 'Sales', 'Products', 'Finance', 'Content', 'Support', 'Channel', 'System']

export const MDF_STATUSES = ['submitted', 'approved', 'rejected', 'completed']

export const DISCOUNT_REQUEST_STATUSES = ['submitted', 'approved', 'rejected']

export const FRAUD_FLAG_STATUSES = [
  'open', 'investigating', 'warned', 'suspended', 'commission_cancelled', 'terminated', 'dismissed',
]

export const FRAUD_FLAG_TYPES = [
  'self_referral', 'fake_lead', 'fake_account', 'duplicate_registration', 'cookie_stuffing',
  'spam', 'misleading_claims', 'unauthorized_discount', 'trademark_abuse', 'impersonation',
  'false_promises', 'unauthorized_contract', 'other',
]
