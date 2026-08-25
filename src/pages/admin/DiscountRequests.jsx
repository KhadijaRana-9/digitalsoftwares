import { useState } from 'react'
import { Tags, Check, X } from 'lucide-react'
import { PageHeader, Tabs, Badge, Card, Textarea, Button, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate, titleCase } from '../../lib/utils.js'
import { DISCOUNT_REQUEST_STATUSES } from '../../lib/constants.js'

export default function DiscountRequests() {
  const toast = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState('submitted')
  const [notes, setNotes] = useState({})

  const requestsQ = useSupaQuery(['discount_requests'], (sb) =>
    sb.from('discount_requests').select('*, partner:profiles!partner_id(full_name, email), deal:deal_registrations(customer_company)').order('created_at', { ascending: false })
  )

  const reviewMutation = useSupaMutation(
    (sb, { id, decision, review_notes }) =>
      sb.from('discount_requests').update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_notes }).eq('id', id).select().single(),
    { invalidate: [['discount_requests']], onSuccess: () => toast.success('Request updated.'), onError: (e) => toast.error(e.message) }
  )

  const requests = requestsQ.data ?? []
  const filtered = status === 'all' ? requests : requests.filter((r) => r.status === status)
  const tabs = [
    { value: 'all', label: 'All', count: requests.length },
    ...DISCOUNT_REQUEST_STATUSES.map((s) => ({ value: s, label: titleCase(s), count: requests.filter((r) => r.status === s).length })),
  ]

  return (
    <div>
      <PageHeader title="Discount Authority" subtitle="Requests to discount beyond a partner's tier authority — everything above the limit needs approval." />
      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {requestsQ.isLoading && <SkeletonRows rows={4} />}
      {requestsQ.isError && <ErrorState onRetry={requestsQ.refetch} />}
      {requestsQ.isSuccess && filtered.length === 0 && <EmptyState icon={Tags} title="No requests here" />}

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{r.partner?.full_name}</p>
                <p className="text-xs text-ink-soft">{r.deal?.customer_company ?? 'No linked deal'} · {formatDate(r.created_at)}</p>
                <p className="mt-2 text-sm text-ink-soft">{r.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-orange-600">{r.requested_percent}%</p>
                <Badge status={r.status} />
              </div>
            </div>
            {r.status === 'submitted' && (
              <div className="mt-4 space-y-2 border-t border-line pt-4">
                <Textarea placeholder="Review notes (optional)" value={notes[r.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" icon={Check} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: r.id, decision: 'approved', review_notes: notes[r.id] })}>Approve</Button>
                  <Button size="sm" variant="danger" icon={X} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: r.id, decision: 'rejected', review_notes: notes[r.id] })}>Reject</Button>
                </div>
              </div>
            )}
            {r.review_notes && <p className="mt-3 text-xs text-ink-soft"><strong className="text-ink">Note:</strong> {r.review_notes}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
