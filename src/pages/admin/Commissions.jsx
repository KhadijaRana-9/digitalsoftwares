import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Percent, ArrowRight, Undo2 } from 'lucide-react'
import { PageHeader, Tabs, Badge, Button, ConfirmDialog, StatCard, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { formatCurrency, formatDate } from '../../lib/utils.js'
import { COMMISSION_STATUSES, COMMISSION_STATUS_LABELS } from '../../lib/constants.js'

const NEXT_STATUS = { pending: 'approved', approved: 'payable', payable: 'paid' }

export default function AdminCommissions() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('all')
  const [reversing, setReversing] = useState(null)

  const commissionsQ = useSupaQuery(['admin_commissions_full'], (sb) =>
    sb.from('commissions').select('*, partner:profiles!partner_id(full_name, email), customer:customers(company_name), product:products(name)').order('created_at', { ascending: false })
  )

  const advanceMutation = useSupaMutation(
    (sb, { id, newStatus }) => {
      const extra = newStatus === 'payable' ? { payable_date: new Date().toISOString().slice(0, 10) } : {}
      return sb.from('commissions').update({ status: newStatus, ...extra }).eq('id', id).select().single()
    },
    { invalidate: [['admin_commissions_full']], onSuccess: () => toast.success('Commission advanced.'), onError: (e) => toast.error(e.message) }
  )

  const reverseMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const { data, error } = await supabase.rpc('reverse_commission', { p_commission_id: id, p_reason: reason })
      if (error) throw error
      return data
    },
    onSuccess: () => { toast.success('Commission reversed.'); queryClient.invalidateQueries({ queryKey: ['admin_commissions_full'] }); setReversing(null) },
    onError: (e) => toast.error(e.message),
  })

  const commissions = commissionsQ.data ?? []
  const filtered = useMemo(() => (status === 'all' ? commissions : commissions.filter((c) => c.status === status)), [commissions, status])
  const tabs = [
    { value: 'all', label: 'All', count: commissions.length },
    ...COMMISSION_STATUSES.map((s) => ({ value: s, label: COMMISSION_STATUS_LABELS[s], count: commissions.filter((c) => c.status === s).length })),
  ]

  const totalOutstanding = commissions.filter((c) => ['pending', 'approved', 'payable'].includes(c.status)).reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div>
      <PageHeader title="Commissions" subtitle="Review and advance commissions through pending → approved → payable → paid." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total commission expense" value={formatCurrency(commissions.reduce((s, c) => s + Number(c.amount), 0))} icon={Percent} />
        <StatCard label="Outstanding (not yet paid)" value={formatCurrency(totalOutstanding)} icon={Percent} accent />
      </div>

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {commissionsQ.isLoading && <SkeletonRows rows={6} />}
      {commissionsQ.isError && <ErrorState onRetry={commissionsQ.refetch} />}
      {commissionsQ.isSuccess && filtered.length === 0 && <EmptyState icon={Percent} title="No commissions here" />}

      {commissionsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Earned</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3.5 font-medium text-ink">{c.partner?.full_name}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.customer?.company_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.product?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 font-bold text-ink">{formatCurrency(c.amount)}</td>
                    <td className="px-5 py-3.5"><Badge status={c.status}>{COMMISSION_STATUS_LABELS[c.status]}</Badge></td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatDate(c.earned_date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {NEXT_STATUS[c.status] && (
                          <Button
                            size="sm"
                            variant="subtle"
                            icon={ArrowRight}
                            loading={advanceMutation.isPending}
                            onClick={() => advanceMutation.mutate({ id: c.id, newStatus: NEXT_STATUS[c.status] })}
                          >
                            Mark {COMMISSION_STATUS_LABELS[NEXT_STATUS[c.status]]}
                          </Button>
                        )}
                        {!['reversed', 'pending'].includes(c.status) && (
                          <Button size="sm" variant="ghost" icon={Undo2} onClick={() => setReversing(c)}>Reverse</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(reversing)}
        onClose={() => setReversing(null)}
        onConfirm={(reason) => reverseMutation.mutate({ id: reversing.id, reason })}
        title="Reverse commission"
        description={`Reverse ${formatCurrency(reversing?.amount)} owed to ${reversing?.partner?.full_name}? Use this for refunds, chargebacks or cancellations.`}
        confirmLabel="Reverse commission"
        requireReason
        loading={reverseMutation.isPending}
      />
    </div>
  )
}
