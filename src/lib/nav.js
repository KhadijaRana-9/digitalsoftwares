import {
  LayoutDashboard, Target, Handshake, Users, GitBranch, Package, Wallet,
  Percent, Share2, FolderOpen, GraduationCap, Award, LifeBuoy, BarChart3,
  UserCircle, ClipboardList, Settings, ShieldCheck, Boxes, Landmark,
  Layers, Percent as PercentIcon, DollarSign, Gift, ShieldAlert, Store,
  UserPlus, ScrollText, KeyRound, RefreshCw, Tags,
} from 'lucide-react'

export const customerNav = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/support', label: 'Support', icon: LifeBuoy },
  { to: '/customer/profile', label: 'Profile', icon: UserCircle },
]

export const partnerNav = [
  { to: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/partner/leads', label: 'Leads', icon: Target },
  { to: '/partner/opportunities', label: 'Opportunities', icon: GitBranch },
  { to: '/partner/deals', label: 'Deals', icon: Handshake },
  { to: '/partner/customers', label: 'Customers', icon: Users },
  { to: '/partner/products', label: 'Products & Pricing', icon: Package },
  { to: '/partner/commissions', label: 'Commissions', icon: Percent },
  { to: '/partner/payouts', label: 'Payouts', icon: Wallet },
  { to: '/partner/referrals', label: 'Referrals', icon: Share2 },
  { to: '/partner/assets', label: 'Sales Assets', icon: FolderOpen },
  { to: '/partner/academy', label: 'Academy', icon: GraduationCap },
  { to: '/partner/certifications', label: 'Certifications', icon: Award },
  { to: '/partner/support', label: 'Support', icon: LifeBuoy },
  { to: '/partner/performance', label: 'Performance', icon: BarChart3 },
  { to: '/partner/profile', label: 'Profile', icon: UserCircle },
]

// Grouped admin nav — flattened via `adminNav` for search/breadcrumb lookup,
// grouped via `adminNavGroups` for the sidebar. `permission` gates
// visibility for role='admin' staff; super_admin always sees everything;
// items without a `permission` are visible to any staff member (read-only
// dashboards/reports are intentionally broad — see RLS design notes).
export const adminNavGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
    ],
  },
  {
    label: 'Partners',
    items: [
      { to: '/admin/partners', label: 'All Partners', icon: Users, permission: 'partners.view' },
      { to: '/admin/applications', label: 'Applications', icon: ClipboardList, permission: 'applications.review' },
      { to: '/admin/tiers', label: 'Partner Tiers', icon: Layers, permission: 'tiers.manage' },
      { to: '/admin/territories', label: 'Territories', icon: Landmark, permission: 'territories.manage' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/deals', label: 'Deal Registrations', icon: Handshake, permission: 'deals.approve' },
      { to: '/admin/renewals', label: 'Subscriptions & Renewals', icon: RefreshCw },
    ],
  },
  {
    label: 'Products & Commercial',
    items: [
      { to: '/admin/products', label: 'Products', icon: Boxes, permission: 'products.edit' },
      { to: '/admin/pricing', label: 'Pricing & Rules', icon: PercentIcon, permission: 'pricing.manage' },
      { to: '/admin/discounts', label: 'Discount Authority', icon: Tags, permission: 'pricing.manage' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/commissions', label: 'Commissions', icon: Percent, permission: 'commissions.approve' },
      { to: '/admin/payouts', label: 'Payouts', icon: Wallet, permission: 'payouts.process' },
      { to: '/admin/mdf', label: 'MDF', icon: DollarSign, permission: 'mdf.manage' },
      { to: '/admin/incentives', label: 'Incentives', icon: Gift },
    ],
  },
  {
    label: 'Content & Enablement',
    items: [
      { to: '/admin/assets', label: 'Sales & Marketing Assets', icon: FolderOpen, permission: 'content.manage' },
      { to: '/admin/academy', label: 'Courses & Certifications', icon: GraduationCap, permission: 'training.manage' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy, permission: 'support.manage' },
    ],
  },
  {
    label: 'Channel Management',
    items: [
      { to: '/admin/marketplace', label: 'Partner Marketplace', icon: Store, permission: 'marketplace.manage' },
      { to: '/admin/compliance', label: 'Fraud & Compliance', icon: ShieldAlert, permission: 'compliance.manage' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/admin-users', label: 'Admin Users', icon: UserPlus, superAdminOnly: true },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: KeyRound, superAdminOnly: true },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, permission: 'audit.view' },
      { to: '/admin/settings', label: 'System Settings', icon: Settings, permission: 'settings.manage' },
    ],
  },
]

export const adminNav = adminNavGroups.flatMap((g) => g.items)

export const publicNav = [
  { to: '/#tiers', label: 'Program' },
  { to: '/products', label: 'Products' },
  { to: '/partners', label: 'Find a Partner' },
  { to: '/#calculator', label: 'Calculator' },
]

export { ShieldCheck }
