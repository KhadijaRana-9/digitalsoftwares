import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  Users, ClipboardList, UserCheck, Award, MapPin, Ban, TrendingUp, Percent, Wallet,
  Target, GitBranch, Handshake, UserPlus, XCircle, RefreshCw, Repeat, Sparkles,
} from 'lucide-react'
import { PageHeader, StatCard, Card, CardHeader, Select, SkeletonCards, EmptyState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatCurrency } from '../../lib/utils.js'

const COLORS = ['#ffd1a8', '#ffb070', '#ff8a3d', '#f9670e', '#ea4a08']

function periodStart(period) {
  const now = new Date()
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  if (period === 'year') return new Date(now.getFullYear(), 0, 1)
  return null
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')

  const partnersQ = useSupaQuery(['dash_partners'], (sb) =>
    sb.from('partner_profiles').select('id, status, country, created_at, tier:partner_tiers(id, name, key)')
  )
  const applicationsQ = useSupaQuery(['dash_applications'], (sb) => sb.from('partner_applications').select('id, status'))
  const commissionsQ = useSupaQuery(['dash_commissions'], (sb) =>
    sb.from('commissions').select('id, amount, status, commission_type, partner_id, earned_date')
  )
  const payoutsQ = useSupaQuery(['dash_payouts'], (sb) => sb.from('payouts').select('amount, status'))
  const leadsQ = useSupaQuery(['dash_leads'], (sb) => sb.from('leads').select('id, status, partner_id, created_at'))
  const oppsQ = useSupaQuery(['dash_opps'], (sb) => sb.from('opportunities').select('id, stage, value, partner_id'))
  const dealsQ = useSupaQuery(['dash_deals'], (sb) => sb.from('deal_registrations').select('id, status, estimated_value, created_at'))
  const customersQ = useSupaQuery(['dash_customers'], (sb) => sb.from('customers').select('id, account_status, partner_id, created_at'))

  const loading = partnersQ.isLoading || commissionsQ.isLoading || leadsQ.isLoading

  const start = periodStart(period)
  const inPeriod = (dateStr) => !start || new Date(dateStr) >= start

  const partners = useMemo(() => {
    const all = partnersQ.data ?? []
    return tierFilter === 'all' ? all : all.filter((p) => p.tier?.key === tierFilter)
  }, [partnersQ.data, tierFilter])

  const partnerIdSet = useMemo(() => new Set(partners.map((p) => p.id)), [partners])
  const scopedByPartner = (rows) => (tierFilter === 'all' ? rows : rows.filter((r) => partnerIdSet.has(r.partner_id)))

  const commissions = useMemo(() => scopedByPartner(commissionsQ.data ?? []).filter((c) => inPeriod(c.earned_date)), [commissionsQ.data, tierFilter, period]) // eslint-disable-line react-hooks/exhaustive-deps
  const leads = useMemo(() => scopedByPartner(leadsQ.data ?? []).filter((l) => inPeriod(l.created_at)), [leadsQ.data, tierFilter, period]) // eslint-disable-line react-hooks/exhaustive-deps
  const deals = useMemo(() => (dealsQ.data ?? []).filter((d) => inPeriod(d.created_at)), [dealsQ.data, period]) // eslint-disable-line react-hooks/exhaustive-deps
  const opportunities = useMemo(() => scopedByPartner(oppsQ.data ?? []), [oppsQ.data, tierFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  const customers = useMemo(() => scopedByPartner(customersQ.data ?? []).filter((c) => inPeriod(c.created_at)), [customersQ.data, tierFilter, period]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Partner KPIs ----
  const totalPartners = partners.length
  const activePartners = partners.filter((p) => p.status === 'active').length
  const suspendedPartners = partners.filter((p) => p.status === 'suspended').length
  const pendingApplications = (applicationsQ.data ?? []).filter((a) => ['submitted', 'under_review', 'more_info_required'].includes(a.status)).length
  const approvedApplications = (applicationsQ.data ?? []).filter((a) => a.status === 'approved').length
  const certifiedPartners = partners.filter((p) => p.tier?.key === 'certified').length
  const strategicPartners = partners.filter((p) => p.tier?.key === 'strategic').length

  // ---- Revenue / Commission KPIs ----
  const totalRevenue = commissions.reduce((s, c) => s + Number(c.amount), 0)
  const recurringRevenue = commissions.filter((c) => c.commission_type === 'recurring').reduce((s, c) => s + Number(c.amount), 0)
  const revenuePerActivePartner = activePartners ? totalRevenue / activePartners : 0
  const pendingCommissions = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0)
  const approvedCommissions = commissions.filter((c) => c.status === 'approved').reduce((s, c) => s + Number(c.amount), 0)
  const payableCommissions = commissions.filter((c) => c.status === 'payable').reduce((s, c) => s + Number(c.amount), 0)
  const paidCommissions = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0)
  const reversedCommissions = commissions.filter((c) => c.status === 'reversed').reduce((s, c) => s + Number(c.amount), 0)
  const paidPayouts = (payoutsQ.data ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const commissionRevenueRatio = totalRevenue ? Math.round((totalRevenue / (totalRevenue + paidPayouts || 1)) * 100) : 0

  // ---- Sales KPIs ----
  const qualifiedLeads = leads.filter((l) => !['new', 'lost'].includes(l.status)).length
  const wonLeads = leads.filter((l) => l.status === 'won').length
  const conversionRate = leads.length ? Math.round((wonLeads / leads.length) * 100) : 0
  const registeredDeals = deals.length
  const wonDeals = deals.filter((d) => d.status === 'closed').length
  const lostDeals = deals.filter((d) => d.status === 'rejected').length
  const pipelineValue = opportunities.filter((o) => !['won', 'lost'].includes(o.stage)).reduce((s, o) => s + Number(o.value || 0), 0)

  // ---- Customer KPIs ----
  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.account_status === 'active').length
  const churnedCustomers = customers.filter((c) => c.account_status === 'churned').length
  const retentionRate = totalCustomers ? Math.round(((totalCustomers - churnedCustomers) / totalCustomers) * 100) : 100

  const tierDistribution = useMemo(() => {
    const counts = {}
    partners.forEach((p) => { const name = p.tier?.name ?? 'Unknown'; counts[name] = (counts[name] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [partners])

  const submittedDeals = (dealsQ.data ?? []).filter((d) => d.status === 'submitted').length

  return (
    <div>
      <PageHeader title="Super Admin Dashboard" subtitle="Network-wide health, revenue and commission performance." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto">
          <option value="all">All time</option>
          <option value="month">This month</option>
          <option value="quarter">This quarter</option>
          <option value="year">This year</option>
        </Select>
        <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="w-auto">
          <option value="all">All tiers</option>
          {[...new Map(partnersQ.data?.map((p) => [p.tier?.key, p.tier]) ?? []).values()].filter(Boolean).map((t) => (
            <option key={t.key} value={t.key}>{t.name}</option>
          ))}
        </Select>
      </div>

      {/* Headline KPI — explicitly the most important metric per the program spec */}
      <Card className="mb-6 overflow-hidden border-orange-300 bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-100">
              <Sparkles className="h-3.5 w-3.5" /> North-star metric
            </p>
            <p className="mt-1 text-3xl font-black sm:text-4xl">{formatCurrency(revenuePerActivePartner)}</p>
            <p className="mt-1 text-sm text-orange-100">Revenue per Active Partner</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-2xl font-black">{activePartners}</p>
              <p className="text-xs text-orange-100">Active partners</p>
            </div>
            <div>
              <p className="text-2xl font-black">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-orange-100">Partner-generated revenue</p>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <SkeletonCards count={8} />
      ) : (
        <>
          <KpiSection title="Partner KPIs">
            <StatCard label="Total Partners" value={totalPartners} icon={Users} onClick={() => navigate('/admin/partners')} />
            <StatCard label="Pending Applications" value={pendingApplications} icon={ClipboardList} onClick={() => navigate('/admin/applications')} />
            <StatCard label="Approved Applications" value={approvedApplications} icon={UserPlus} onClick={() => navigate('/admin/applications')} />
            <StatCard label="Active Partners" value={activePartners} icon={UserCheck} accent onClick={() => navigate('/admin/partners')} />
            <StatCard label="Certified Partners" value={certifiedPartners} icon={Award} onClick={() => navigate('/admin/partners')} />
            <StatCard label="Strategic Partners" value={strategicPartners} icon={MapPin} onClick={() => navigate('/admin/partners')} />
            <StatCard label="Suspended Partners" value={suspendedPartners} icon={Ban} onClick={() => navigate('/admin/partners')} />
          </KpiSection>

          <KpiSection title="Revenue KPIs">
            <StatCard label="Partner-generated Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} accent onClick={() => navigate('/admin/commissions')} />
            <StatCard label="Partner-generated Pipeline" value={formatCurrency(pipelineValue)} icon={GitBranch} onClick={() => navigate('/admin/deals')} />
            <StatCard label="Recurring Revenue" value={formatCurrency(recurringRevenue)} icon={Repeat} onClick={() => navigate('/admin/commissions')} />
            <StatCard label="Revenue per Active Partner" value={formatCurrency(revenuePerActivePartner)} icon={Sparkles} onClick={() => navigate('/admin/reports')} />
          </KpiSection>

          <KpiSection title="Commission KPIs">
            <StatCard label="Pending" value={formatCurrency(pendingCommissions)} icon={Percent} onClick={() => navigate('/admin/commissions')} />
            <StatCard label="Approved" value={formatCurrency(approvedCommissions)} icon={Percent} onClick={() => navigate('/admin/commissions')} />
            <StatCard label="Payable" value={formatCurrency(payableCommissions)} icon={Percent} onClick={() => navigate('/admin/payouts')} />
            <StatCard label="Paid" value={formatCurrency(paidCommissions)} icon={Wallet} onClick={() => navigate('/admin/payouts')} />
            <StatCard label="Reversed" value={formatCurrency(reversedCommissions)} icon={XCircle} onClick={() => navigate('/admin/commissions')} />
            <StatCard label="Commission / Revenue Ratio" value={`${commissionRevenueRatio}%`} icon={Percent} />
          </KpiSection>

          <KpiSection title="Sales KPIs">
            <StatCard label="Total Leads" value={leads.length} icon={Target} />
            <StatCard label="Qualified Leads" value={qualifiedLeads} icon={Target} />
            <StatCard label="Opportunities" value={opportunities.length} icon={GitBranch} />
            <StatCard label="Registered Deals" value={registeredDeals} icon={Handshake} onClick={() => navigate('/admin/deals')} />
            <StatCard label="Won Deals" value={wonDeals} icon={Handshake} onClick={() => navigate('/admin/deals')} />
            <StatCard label="Lost Deals" value={lostDeals} icon={XCircle} onClick={() => navigate('/admin/deals')} />
            <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={Target} />
          </KpiSection>

          <KpiSection title="Customer KPIs">
            <StatCard label="Total Customers" value={totalCustomers} icon={Users} onClick={() => navigate('/admin/renewals')} />
            <StatCard label="Active Customers" value={activeCustomers} icon={UserCheck} onClick={() => navigate('/admin/renewals')} />
            <StatCard label="Churned Customers" value={churnedCustomers} icon={XCircle} onClick={() => navigate('/admin/renewals')} />
            <StatCard label="Retention Rate" value={`${retentionRate}%`} icon={RefreshCw} />
          </KpiSection>
        </>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Deals awaiting review"
            subtitle="Newly submitted deal registrations"
            action={<Link to="/admin/deals" className="text-xs font-semibold text-orange-600 hover:underline">Review deals</Link>}
          />
          <div className="p-5">
            {submittedDeals === 0 ? (
              <EmptyState icon={Handshake} title="Nothing pending" description="All deal registrations are reviewed." />
            ) : (
              <p className="text-3xl font-black text-orange-600">
                {submittedDeals}
                <span className="ml-2 text-sm font-medium text-ink-soft">deals waiting for approval</span>
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Tier distribution" />
          <div className="h-64 p-4">
            {tierDistribution.length === 0 ? (
              <EmptyState title="No partners yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {tierDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0e4d8', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpiSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  )
}
