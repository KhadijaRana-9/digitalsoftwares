import { useMemo, useState } from 'react'
import { Percent } from 'lucide-react'
import { PageHeader, Tabs, Badge, StatCard, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency, formatDate } from '../../lib/utils.js'
import { COMMISSION_STATUSES, COMMISSION_STATUS_LABELS } from '../../lib/constants.js'

export default function Commissions() {
  const { user } = useAuth()
  const [status, setStatus] = useState('all')

  const commissionsQ = useSupaQuery(
    ['commissions_full', user?.id],
    (sb) =>
      sb
        .from('commissions')
        .select('*, product:products(name), customer:customers(company_name)')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false }),
    { enabled: Boolean(user?.id) }
  )

  const commissions = commissionsQ.data ?? []
  const filtered = useMemo(() => (status === 'all' ? commissions : commissions.filter((c) => c.status === status)), [commissions, status])

  const totals = useMemo(() => {
    const sum = (predicate) => commissions.filter(predicate).reduce((s, c) => s + Number(c.amount), 0)
    return {
      pending: sum((c) => c.status === 'pending'),
      payable: sum((c) => c.status === 'payable'),
      paid: sum((c) => c.status === 'paid'),
    }
  }, [commissions])

  const tabs = [
    { value: 'all', label: 'All', count: commissions.length },
    ...COMMISSION_STATUSES.map((s) => ({ value: s, label: COMMISSION_STATUS_LABELS[s], count: commissions.filter((c) => c.status === s).length })),
  ]

  return (
    <div>
      <PageHeader title="Commissions" subtitle="Your commission ledger — paid only once the underlying customer payment is collected." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={formatCurrency(totals.pending)} icon={Percent} />
        <StatCard label="Payable" value={formatCurrency(totals.payable)} icon={Percent} accent />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} icon={Percent} />
      </div>

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {commissionsQ.isLoading && <SkeletonRows rows={6} />}
      {commissionsQ.isError && <ErrorState onRetry={commissionsQ.refetch} />}
      {commissionsQ.isSuccess && filtered.length === 0 && (
        <EmptyState icon={Percent} title="No commissions yet" description="Commissions are created automatically when a registered deal closes as won." />
      )}

      {commissionsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Rate</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-orange-50/40">
                    <td className="px-5 py-3.5 font-medium text-ink">{c.customer?.company_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.product?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 capitalize text-ink-soft">{c.commission_type.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.commission_percent}%</td>
                    <td className="px-5 py-3.5 font-bold text-ink">{formatCurrency(c.amount)}</td>
                    <td className="px-5 py-3.5"><Badge status={c.status}>{COMMISSION_STATUS_LABELS[c.status]}</Badge></td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatDate(c.earned_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
