import { useState } from 'react'
import { DollarSign, Check, X, CheckCircle2 } from 'lucide-react'
import { PageHeader, Tabs, Badge, Card, Input, Button, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency, formatDate, titleCase } from '../../lib/utils.js'
import { MDF_STATUSES } from '../../lib/constants.js'

export default function MDF() {
  const toast = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState('submitted')
  const [drafts, setDrafts] = useState({})

  const requestsQ = useSupaQuery(['mdf_requests'], (sb) =>
    sb.from('mdf_requests').select('*, partner:profiles!partner_id(full_name, email)').order('created_at', { ascending: false })
  )

  const reviewMutation = useSupaMutation(
    (sb, { id, decision, approved_amount, notes }) =>
      sb.from('mdf_requests').update({ status: decision, approved_amount, notes, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', id).select().single(),
    { invalidate: [['mdf_requests']], onSuccess: () => toast.success('MDF request updated.'), onError: (e) => toast.error(e.message) }
  )

  const completeMutation = useSupaMutation(
    (sb, id) => sb.from('mdf_requests').update({ status: 'completed' }).eq('id', id).select().single(),
    { invalidate: [['mdf_requests']], onSuccess: () => toast.success('Marked completed.'), onError: (e) => toast.error(e.message) }
  )

  const requests = requestsQ.data ?? []
  const filtered = status === 'all' ? requests : requests.filter((r) => r.status === status)
  const tabs = [
    { value: 'all', label: 'All', count: requests.length },
    ...MDF_STATUSES.map((s) => ({ value: s, label: titleCase(s), count: requests.filter((r) => r.status === s).length })),
  ]

  return (
    <div>
      <PageHeader title="Marketing Development Fund" subtitle="Allocate, approve and track MDF spend on partner marketing activities." />
      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {requestsQ.isLoading && <SkeletonRows rows={4} />}
      {requestsQ.isError && <ErrorState onRetry={requestsQ.refetch} />}
      {requestsQ.isSuccess && filtered.length === 0 && <EmptyState icon={DollarSign} title="No MDF requests here" />}

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{r.title}</p>
                <p className="text-xs text-ink-soft">{r.partner?.full_name} · {r.activity_type} · {formatDate(r.created_at)}</p>
                {r.notes && <p className="mt-2 text-sm text-ink-soft">{r.notes}</p>}
                {r.proof_url && <a href={r.proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-orange-600 hover:underline">View proof</a>}
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-ink">{formatCurrency(r.requested_amount)}</p>
                <Badge status={r.status} />
              </div>
            </div>
            {r.status === 'submitted' && (
              <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                <Input
                  type="number"
                  placeholder="Approved amount"
                  className="w-36"
                  defaultValue={r.requested_amount}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  icon={Check}
                  loading={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: r.id, decision: 'approved', approved_amount: Number(drafts[r.id] ?? r.requested_amount) })}
                >
                  Approve
                </Button>
                <Button size="sm" variant="danger" icon={X} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: r.id, decision: 'rejected', approved_amount: null })}>
                  Reject
                </Button>
              </div>
            )}
            {r.status === 'approved' && (
              <div className="mt-4 border-t border-line pt-4">
                <Button size="sm" variant="outline" icon={CheckCircle2} loading={completeMutation.isPending} onClick={() => completeMutation.mutate(r.id)}>
                  Mark completed
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink-soft">
        Rate reference: 2–5% of qualifying sales for Gold+ tiers — configurable in <span className="font-semibold text-ink">System Settings</span>.
      </p>
    </div>
  )
}
