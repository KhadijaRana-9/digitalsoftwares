import { Wallet } from 'lucide-react'
import { PageHeader, StatCard, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency, formatDate } from '../../lib/utils.js'

export default function Payouts() {
  const { user } = useAuth()

  const payoutsQ = useSupaQuery(
    ['payouts', user?.id],
    (sb) => sb.from('payouts').select('*').eq('partner_id', user.id).order('created_at', { ascending: false }),
    { enabled: Boolean(user?.id) }
  )
  const commissionsQ = useSupaQuery(
    ['commissions_for_payout', user?.id],
    (sb) => sb.from('commissions').select('amount, status').eq('partner_id', user.id),
    { enabled: Boolean(user?.id) }
  )
  const settingsQ = useSupaQuery(['payout_settings'], (sb) => sb.from('system_settings').select('*').in('key', ['payout_minimum_pkr', 'payout_minimum_usd']))

  const commissions = commissionsQ.data ?? []
  const payable = commissions.filter((c) => c.status === 'payable').reduce((s, c) => s + Number(c.amount), 0)
  const paidTotal = (payoutsQ.data ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const minPkr = settingsQ.data?.find((s) => s.key === 'payout_minimum_pkr')?.value?.amount ?? 5000

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Payable commissions are batched into a payout once they cross the minimum threshold." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Available for payout" value={formatCurrency(payable)} icon={Wallet} accent />
        <StatCard label="Total paid to date" value={formatCurrency(paidTotal)} icon={Wallet} />
        <StatCard label="Minimum payout" value={formatCurrency(minPkr)} icon={Wallet} trendLabel="or USD 50 equivalent internationally" />
      </div>

      {payoutsQ.isLoading && <SkeletonRows rows={4} />}
      {payoutsQ.isError && <ErrorState onRetry={payoutsQ.refetch} />}
      {payoutsQ.isSuccess && (payoutsQ.data ?? []).length === 0 && (
        <EmptyState icon={Wallet} title="No payouts yet" description="Your first payout will appear here once payable commissions cross the minimum threshold." />
      )}

      {payoutsQ.isSuccess && (payoutsQ.data ?? []).length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payoutsQ.data.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3.5 font-medium text-ink">{p.reference_code}</td>
                  <td className="px-5 py-3.5 font-bold text-ink">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3.5 capitalize text-ink-soft">{p.method.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5"><Badge status={p.status} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(p.processed_at || p.requested_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
