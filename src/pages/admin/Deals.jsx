import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Handshake, Check, X, Trophy, AlertTriangle } from 'lucide-react'
import { PageHeader, Tabs, Badge, Drawer, Button, Textarea, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { formatCurrency, formatDate } from '../../lib/utils.js'
import { DEAL_STATUSES, DEAL_STATUS_LABELS } from '../../lib/constants.js'

export default function AdminDeals() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('submitted')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [conflicts, setConflicts] = useState(null)

  const dealsQ = useSupaQuery(['admin_deals'], (sb) =>
    sb.from('deal_registrations').select('*, product:products(name), partner:profiles!partner_id(full_name, email)').order('created_at', { ascending: false })
  )

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, notes: n, override = false }) => {
      const { data, error } = await supabase.rpc('review_deal_registration', {
        p_deal_id: id, p_decision: decision, p_notes: n || null, p_override: override,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Deal updated.')
      queryClient.invalidateQueries({ queryKey: ['admin_deals'] })
      setSelected(null); setNotes(''); setConflicts(null)
    },
    onError: async (e, vars) => {
      if (e.message?.includes('CONFLICTING_DEAL_EXISTS')) {
        const { data } = await supabase.rpc('find_conflicting_deals', {
          p_customer_company: selected.customer_company, p_product_id: selected.product_id, p_exclude_deal_id: vars.id,
        })
        setConflicts(data ?? [])
        toast.error('Another partner already has a live registration for this customer.')
        return
      }
      toast.error(e.message)
    },
  })

  const closeMutation = useMutation({
    mutationFn: async (dealId) => {
      const { data, error } = await supabase.rpc('close_deal_won', { p_deal_id: dealId })
      if (error) throw error
      return data
    },
    onSuccess: () => { toast.success('Deal closed — commission created.'); queryClient.invalidateQueries({ queryKey: ['admin_deals'] }); setSelected(null) },
    onError: (e) => toast.error(e.message),
  })

  const deals = dealsQ.data ?? []
  const filtered = useMemo(() => (status === 'all' ? deals : deals.filter((d) => d.status === status)), [deals, status])
  const tabs = [
    { value: 'all', label: 'All', count: deals.length },
    ...DEAL_STATUSES.map((s) => ({ value: s, label: DEAL_STATUS_LABELS[s], count: deals.filter((d) => d.status === s).length })),
  ]

  const openDeal = (d) => { setSelected(d); setConflicts(null); setNotes('') }

  return (
    <div>
      <PageHeader title="Deal Registrations" subtitle="Approve deals to open protection, then close them as won to trigger commission." />

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {dealsQ.isLoading && <SkeletonRows rows={6} />}
      {dealsQ.isError && <ErrorState onRetry={dealsQ.refetch} />}
      {dealsQ.isSuccess && filtered.length === 0 && <EmptyState icon={Handshake} title="Nothing here" />}

      {dealsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => openDeal(d)} className="cursor-pointer transition-colors hover:bg-orange-50/40">
                  <td className="px-5 py-3.5 font-medium text-ink">{d.customer_company}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{d.partner?.full_name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{d.product?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink">{formatCurrency(d.estimated_value)}</td>
                  <td className="px-5 py-3.5"><Badge status={d.status}>{DEAL_STATUS_LABELS[d.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.customer_company} subtitle={selected?.partner?.full_name}>
        {selected && (
          <div className="space-y-6">
            <Badge status={selected.status}>{DEAL_STATUS_LABELS[selected.status]}</Badge>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Partner email" value={selected.partner?.email} />
              <Info label="Product" value={selected.product?.name} />
              <Info label="Estimated value" value={formatCurrency(selected.estimated_value)} />
              <Info label="Country" value={selected.country} />
              <Info label="Industry" value={selected.industry} />
              <Info label="Submitted" value={formatDate(selected.created_at)} />
              {selected.status === 'approved' && (
                <>
                  <Info label="Protection start" value={formatDate(selected.protection_start)} />
                  <Info label="Protection end" value={formatDate(selected.protection_end)} />
                </>
              )}
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Partner notes</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.notes}</p>
              </div>
            )}
            {selected.is_override && (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Approved via override</strong> — {selected.override_reason}
              </div>
            )}

            {conflicts && conflicts.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" /> Conflicting registration — first approved wins
                </p>
                <div className="mt-2 space-y-1.5">
                  {conflicts.map((c) => (
                    <p key={c.id} className="text-xs text-amber-800">
                      {c.customer_company} — status <strong>{c.status}</strong>, submitted {formatDate(c.created_at)}
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-800">
                  Approving anyway requires a mandatory reason and is recorded in the Audit Log.
                </p>
              </div>
            )}

            {selected.status === 'submitted' && (
              <div className="space-y-3 border-t border-line pt-5">
                <Textarea
                  placeholder={conflicts ? 'Required: reason for overriding the conflict…' : 'Optional note…'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {conflicts ? (
                    <Button
                      variant="danger"
                      icon={AlertTriangle}
                      disabled={!notes.trim()}
                      loading={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: selected.id, decision: 'approved', notes, override: true })}
                    >
                      Approve anyway (override)
                    </Button>
                  ) : (
                    <Button icon={Check} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: selected.id, decision: 'approved', notes })}>
                      Approve
                    </Button>
                  )}
                  <Button variant="outline" icon={X} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: selected.id, decision: 'rejected', notes })}>
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {selected.status === 'approved' && (
              <div className="border-t border-line pt-5">
                <Button icon={Trophy} loading={closeMutation.isPending} onClick={() => closeMutation.mutate(selected.id)}>
                  Close as won — create commission
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-ink">{value || '—'}</p>
    </div>
  )
}
