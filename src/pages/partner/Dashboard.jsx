import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import {
  Wallet, Users, Target, TrendingUp, Percent, GitBranch, Plus,
  ClipboardCheck, Package, BookOpen, LifeBuoy, ArrowUpRight,
} from 'lucide-react'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageHeader, StatCard, Card, CardHeader, Badge, ProgressBar, Button, EmptyState, SkeletonCards } from '../../components/ui/index.js'
import { formatCurrency, formatDate, timeAgo } from '../../lib/utils.js'
import { LEAD_STATUS_LABELS } from '../../lib/constants.js'

export default function Dashboard() {
  const { user, profile, partnerProfile } = useAuth()

  const leadsQ = useSupaQuery(['dash_leads', user?.id], (sb) =>
    sb.from('leads').select('id, status, company_name, created_at').eq('partner_id', user.id)
  )
  const commissionsQ = useSupaQuery(['dash_commissions', user?.id], (sb) =>
    sb.from('commissions').select('id, amount, status, earned_date').eq('partner_id', user.id)
  )
  const customersQ = useSupaQuery(['dash_customers', user?.id], (sb) =>
    sb.from('customers').select('id, account_status').eq('partner_id', user.id)
  )
  const opportunitiesQ = useSupaQuery(['dash_opportunities', user?.id], (sb) =>
    sb.from('opportunities').select('id, stage, value').eq('partner_id', user.id)
  )
  const dealsQ = useSupaQuery(['dash_deals', user?.id], (sb) =>
    sb.from('deal_registrations').select('id, customer_company, status, estimated_value, created_at').eq('partner_id', user.id).order('created_at', { ascending: false }).limit(5)
  )
  const tiersQ = useSupaQuery(['all_tiers'], (sb) => sb.from('partner_tiers').select('*').order('sort_order'))

  const loading = leadsQ.isLoading || commissionsQ.isLoading || customersQ.isLoading || opportunitiesQ.isLoading

  const leads = leadsQ.data ?? []
  const commissions = commissionsQ.data ?? []
  const customers = customersQ.data ?? []
  const opportunities = opportunitiesQ.data ?? []

  const stats = useMemo(() => {
    const totalRevenue = commissions.reduce((s, c) => s + Number(c.amount), 0)
    const pending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0)
    const paid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0)
    const activeCustomers = customers.filter((c) => c.account_status === 'active').length
    const activeOpportunities = opportunities.filter((o) => !['won', 'lost'].includes(o.stage)).length
    const won = leads.filter((l) => l.status === 'won').length
    const conversionRate = leads.length ? Math.round((won / leads.length) * 100) : 0
    return { totalRevenue, pending, paid, activeCustomers, activeOpportunities, conversionRate }
  }, [commissions, customers, opportunities, leads])

  const chartData = useMemo(() => {
    const byMonth = {}
    commissions.forEach((c) => {
      const key = new Date(c.earned_date).toLocaleDateString('en-US', { month: 'short' })
      byMonth[key] = (byMonth[key] || 0) + Number(c.amount)
    })
    return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }))
  }, [commissions])

  const currentTier = partnerProfile?.tier
  const nextTier = useMemo(() => {
    if (!currentTier || !tiersQ.data) return null
    const idx = tiersQ.data.findIndex((t) => t.id === currentTier.id)
    return tiersQ.data[idx + 1] ?? null
  }, [currentTier, tiersQ.data])

  const tierProgressPct = useMemo(() => {
    if (!nextTier?.annual_sales_target || !partnerProfile) return 0
    return Math.min(100, ((partnerProfile.annual_sales_ytd ?? 0) / nextTier.annual_sales_target) * 100)
  }, [nextTier, partnerProfile])

  const quickActions = [
    { label: 'Add Lead', icon: Plus, to: '/partner/leads' },
    { label: 'Register Deal', icon: ClipboardCheck, to: '/partner/deals' },
    { label: 'View Products', icon: Package, to: '/partner/products' },
    { label: 'View Commissions', icon: Percent, to: '/partner/commissions' },
    { label: 'Academy', icon: BookOpen, to: '/partner/academy' },
    { label: 'Support', icon: LifeBuoy, to: '/partner/support' },
  ]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'partner'}`}
        subtitle={`${currentTier?.name ?? 'Partner'} · Referral code ${partnerProfile?.referral_code ?? '—'}`}
      />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Revenue Generated" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} accent />
          <StatCard label="Pending Commissions" value={formatCurrency(stats.pending)} icon={Wallet} />
          <StatCard label="Paid Commissions" value={formatCurrency(stats.paid)} icon={Percent} />
          <StatCard label="Active Customers" value={stats.activeCustomers} icon={Users} />
          <StatCard label="Active Opportunities" value={stats.activeOpportunities} icon={GitBranch} />
          <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} icon={Target} />
          <StatCard label="Current Tier" value={currentTier?.name ?? '—'} icon={TrendingUp} />
          <StatCard
            label="Next Tier"
            value={nextTier?.name ?? 'Top tier reached'}
            icon={ArrowUpRight}
            trendLabel={nextTier ? `${Math.round(tierProgressPct)}% of target` : undefined}
          />
        </div>
      )}

      {nextTier && (
        <Card className="mt-4 p-5">
          <div className="flex items-center justify-between text-sm font-semibold text-ink">
            <span>Progress to {nextTier.name}</span>
            <span className="text-ink-soft">
              {formatCurrency(partnerProfile?.annual_sales_ytd ?? 0)} / {formatCurrency(nextTier.annual_sales_target)}
            </span>
          </div>
          <ProgressBar value={tierProgressPct} className="mt-3" />
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Commission revenue" subtitle="Amount earned per month, all statuses" />
          <div className="h-64 p-4">
            {chartData.length === 0 ? (
              <EmptyState title="No commissions yet" description="They'll show up here once your first deal closes." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f9670e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f9670e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f0e4d8" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#4a3f3a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#4a3f3a' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f0e4d8', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#f9670e" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-2 p-4">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-cream px-3 py-4 text-center text-xs font-semibold text-ink-soft transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                <a.icon className="h-4 w-4 text-orange-500" />
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent leads" action={<Link to="/partner/leads" className="text-xs font-semibold text-orange-600 hover:underline">View all</Link>} />
          <div className="divide-y divide-line">
            {leads.length === 0 && <p className="px-5 py-8 text-center text-xs text-ink-soft">No leads yet.</p>}
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{l.company_name}</p>
                  <p className="text-xs text-ink-soft">{timeAgo(l.created_at)}</p>
                </div>
                <Badge status={l.status}>{LEAD_STATUS_LABELS[l.status]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent deals" action={<Link to="/partner/deals" className="text-xs font-semibold text-orange-600 hover:underline">View all</Link>} />
          <div className="divide-y divide-line">
            {(!dealsQ.data || dealsQ.data.length === 0) && <p className="px-5 py-8 text-center text-xs text-ink-soft">No deals registered yet.</p>}
            {(dealsQ.data ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{d.customer_company}</p>
                  <p className="text-xs text-ink-soft">{formatDate(d.created_at)} · {formatCurrency(d.estimated_value)}</p>
                </div>
                <Badge status={d.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
