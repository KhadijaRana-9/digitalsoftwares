import { useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { PageHeader, Tabs, Input, Badge, StatCard, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatCurrency, formatDate } from '../../lib/utils.js'

export default function Renewals() {
  const [search, setSearch] = useState('')
  const [dueWindow, setDueWindow] = useState('all')

  const subsQ = useSupaQuery(['admin_subscriptions'], (sb) =>
    sb.from('customer_products').select('*, customer:customers(company_name, partner:profiles(full_name)), product:products(name)').order('renewal_date')
  )

  const subs = subsQ.data ?? []
  const now = Date.now()
  const daysUntil = (d) => (d ? Math.ceil((new Date(d) - now) / 86400000) : null)

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      const matchesSearch = !search || s.customer?.company_name?.toLowerCase().includes(search.toLowerCase())
      const days = daysUntil(s.renewal_date)
      const matchesWindow =
        dueWindow === 'all' ||
        (dueWindow === 'overdue' && days !== null && days < 0) ||
        (dueWindow === '30' && days !== null && days >= 0 && days <= 30) ||
        (dueWindow === '90' && days !== null && days >= 0 && days <= 90)
      return matchesSearch && matchesWindow
    })
  }, [subs, search, dueWindow])

  const activeRevenue = subs.filter((s) => s.status === 'active').reduce((sum, s) => sum + Number(s.revenue || 0), 0)
  const dueSoon = subs.filter((s) => { const d = daysUntil(s.renewal_date); return d !== null && d >= 0 && d <= 30 }).length

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'overdue', label: 'Overdue' },
    { value: '30', label: 'Due in 30 days' },
    { value: '90', label: 'Due in 90 days' },
  ]

  return (
    <div>
      <PageHeader title="Subscriptions & Renewals" subtitle="Every recurring product line across all customers." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Recurring Revenue" value={formatCurrency(activeRevenue)} icon={RefreshCw} accent />
        <StatCard label="Renewals Due (30 days)" value={dueSoon} icon={RefreshCw} />
        <StatCard label="Total Subscriptions" value={subs.length} icon={RefreshCw} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} active={dueWindow} onChange={setDueWindow} />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer…" className="pl-10" />
        </div>
      </div>

      {subsQ.isLoading && <SkeletonRows rows={5} />}
      {subsQ.isError && <ErrorState onRetry={subsQ.refetch} />}
      {subsQ.isSuccess && filtered.length === 0 && <EmptyState icon={RefreshCw} title="No subscriptions in this window" />}

      {subsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Renewal date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => {
                const days = daysUntil(s.renewal_date)
                return (
                  <tr key={s.id}>
                    <td className="px-5 py-3.5 font-medium text-ink">{s.customer?.company_name}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.product?.name}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{s.customer?.partner?.full_name}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{formatCurrency(s.revenue)}</td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {formatDate(s.renewal_date)}
                      {days !== null && days < 0 && <span className="ml-1.5 text-xs font-semibold text-red-600">overdue</span>}
                    </td>
                    <td className="px-5 py-3.5"><Badge tone={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
