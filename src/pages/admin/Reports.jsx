import { useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { Trophy, TrendingUp, Users, Percent } from 'lucide-react'
import { PageHeader, Card, CardHeader, StatCard, EmptyState, SkeletonCards } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatCurrency } from '../../lib/utils.js'

const COLORS = ['#ffd1a8', '#ffb070', '#ff8a3d', '#f9670e', '#ea4a08', '#c1350a']

export default function Reports() {
  const commissionsQ = useSupaQuery(['reports_commissions'], (sb) =>
    sb.from('commissions').select('amount, partner_id, partner:profiles!partner_id(full_name), product:products(name, category:product_categories(vertical))')
  )
  const partnersQ = useSupaQuery(['reports_partners'], (sb) => sb.from('partner_profiles').select('id, status'))

  const commissions = commissionsQ.data ?? []
  const activePartners = (partnersQ.data ?? []).filter((p) => p.status === 'active').length

  const leaderboard = useMemo(() => {
    const byPartner = {}
    commissions.forEach((c) => {
      const key = c.partner_id
      if (!byPartner[key]) byPartner[key] = { name: c.partner?.full_name ?? 'Unknown', revenue: 0 }
      byPartner[key].revenue += Number(c.amount)
    })
    return Object.values(byPartner).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [commissions])

  const byVertical = useMemo(() => {
    const map = {}
    commissions.forEach((c) => {
      const vertical = c.product?.category?.vertical ?? 'Other'
      map[vertical] = (map[vertical] || 0) + Number(c.amount)
    })
    return Object.entries(map).map(([vertical, revenue]) => ({ vertical, revenue })).sort((a, b) => b.revenue - a.revenue)
  }, [commissions])

  const totalRevenue = commissions.reduce((s, c) => s + Number(c.amount), 0)
  const revenuePerActivePartner = activePartners ? totalRevenue / activePartners : 0

  return (
    <div>
      <PageHeader title="Reports" subtitle="Revenue by partner and vertical — revenue per active partner is the north-star metric." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue per Active Partner" value={formatCurrency(revenuePerActivePartner)} icon={TrendingUp} accent />
        <StatCard label="Active Partners" value={activePartners} icon={Users} />
        <StatCard label="Total Commission Revenue" value={formatCurrency(totalRevenue)} icon={Percent} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top partners" subtitle="By commission revenue generated" />
          <div className="p-5">
            {leaderboard.length === 0 ? (
              <EmptyState icon={Trophy} title="No revenue recorded yet" />
            ) : (
              <div className="space-y-2">
                {leaderboard.map((p, i) => (
                  <div key={p.name + i} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5">
                    <span className="flex items-center gap-2.5 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-600">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="text-sm font-bold text-ink">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Revenue by vertical" />
          <div className="h-80 p-4">
            {byVertical.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byVertical} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#f0e4d8" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#4a3f3a' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="vertical" width={90} tick={{ fontSize: 11, fill: '#4a3f3a' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #f0e4d8', fontSize: 12 }} />
                  <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                    {byVertical.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
