import { useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { BarChart3, Target, Clock, Repeat } from 'lucide-react'
import { PageHeader, Card, CardHeader, StatCard, EmptyState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../lib/constants.js'

const COLORS = ['#ffd1a8', '#ffb070', '#ff8a3d', '#f9670e', '#ea4a08', '#22c55e', '#ef4444']

export default function Performance() {
  const { user } = useAuth()

  const leadsQ = useSupaQuery(
    ['perf_leads', user?.id],
    (sb) => sb.from('leads').select('status, created_at').eq('partner_id', user.id),
    { enabled: Boolean(user?.id) }
  )
  const customersQ = useSupaQuery(
    ['perf_customers', user?.id],
    (sb) => sb.from('customers').select('id, account_status, created_at').eq('partner_id', user.id),
    { enabled: Boolean(user?.id) }
  )

  const leads = leadsQ.data ?? []
  const customers = customersQ.data ?? []

  const funnel = useMemo(
    () => LEAD_STATUSES.map((s) => ({ status: LEAD_STATUS_LABELS[s], count: leads.filter((l) => l.status === s).length })),
    [leads]
  )

  const firstLeadDays = useMemo(() => {
    if (leads.length === 0) return null
    const earliest = leads.reduce((min, l) => (new Date(l.created_at) < new Date(min.created_at) ? l : min), leads[0])
    return Math.max(0, Math.floor((Date.now() - new Date(earliest.created_at)) / 86400000))
  }, [leads])

  const churn = useMemo(() => {
    if (customers.length === 0) return 0
    const churned = customers.filter((c) => c.account_status === 'churned').length
    return Math.round((churned / customers.length) * 100)
  }, [customers])

  return (
    <div>
      <PageHeader title="Performance" subtitle="Your funnel, activation and retention metrics." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Leads" value={leads.length} icon={Target} />
        <StatCard label="Days Since First Lead" value={firstLeadDays ?? '—'} icon={Clock} />
        <StatCard label="Customer Churn" value={`${churn}%`} icon={Repeat} />
      </div>

      <Card>
        <CardHeader title="Lead funnel" subtitle="Where your pipeline stands today" />
        <div className="h-72 p-4">
          {leads.length === 0 ? (
            <EmptyState icon={BarChart3} title="No lead data yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid stroke="#f0e4d8" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#4a3f3a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#4a3f3a' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0e4d8', fontSize: 12 }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  )
}
