import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, Send } from 'lucide-react'
import { PageHeader, Card, CardHeader, Button, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { formatCurrency, formatDate } from '../../lib/utils.js'

export default function AdminPayouts() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const payableQ = useSupaQuery(['payable_commissions'], (sb) =>
    sb.from('commissions').select('id, amount, partner_id, partner:profiles!partner_id(full_name, email)').eq('status', 'payable')
  )
  const historyQ = useSupaQuery(['payout_history'], (sb) =>
    sb.from('payouts').select('*, partner:profiles(full_name, email)').order('created_at', { ascending: false })
  )

  const payoutMutation = useMutation({
    mutationFn: async ({ partnerId, commissionIds }) => {
      const { data, error } = await supabase.rpc('record_payout', { p_partner_id: partnerId, p_commission_ids: commissionIds })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Payout processed.')
      queryClient.invalidateQueries({ queryKey: ['payable_commissions'] })
      queryClient.invalidateQueries({ queryKey: ['payout_history'] })
    },
    onError: (e) => toast.error(e.message),
  })

  const byPartner = useMemo(() => {
    const groups = {}
    ;(payableQ.data ?? []).forEach((c) => {
      if (!groups[c.partner_id]) groups[c.partner_id] = { partner: c.partner, total: 0, ids: [] }
      groups[c.partner_id].total += Number(c.amount)
      groups[c.partner_id].ids.push(c.id)
    })
    return Object.entries(groups).map(([partnerId, g]) => ({ partnerId, ...g }))
  }, [payableQ.data])

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Batch payable commissions into a payout per partner." />

      <Card>
        <CardHeader title="Ready to pay" subtitle="Partners with payable commissions" />
        <div className="p-5">
          {payableQ.isLoading && <SkeletonRows rows={3} />}
          {payableQ.isError && <ErrorState onRetry={payableQ.refetch} />}
          {payableQ.isSuccess && byPartner.length === 0 && <EmptyState icon={Wallet} title="Nothing payable right now" />}
          <div className="space-y-3">
            {byPartner.map((g) => (
              <div key={g.partnerId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                <div>
                  <p className="font-semibold text-ink">{g.partner?.full_name}</p>
                  <p className="text-xs text-ink-soft">{g.partner?.email} · {g.ids.length} commission(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-orange-600">{formatCurrency(g.total)}</span>
                  <Button
                    size="sm"
                    icon={Send}
                    loading={payoutMutation.isPending}
                    onClick={() => payoutMutation.mutate({ partnerId: g.partnerId, commissionIds: g.ids })}
                  >
                    Process payout
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Payout history" />
        {historyQ.isLoading && <SkeletonRows rows={4} className="p-5" />}
        {historyQ.isSuccess && (historyQ.data ?? []).length === 0 && <div className="p-5"><EmptyState icon={Wallet} title="No payouts recorded yet" /></div>}
        {historyQ.isSuccess && (historyQ.data ?? []).length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {historyQ.data.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3.5 font-medium text-ink">{p.reference_code}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{p.partner?.full_name}</td>
                  <td className="px-5 py-3.5 font-bold text-ink">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3.5"><Badge status={p.status} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(p.processed_at || p.requested_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
