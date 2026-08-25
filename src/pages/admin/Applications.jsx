import { useMemo, useState } from 'react'
import { ClipboardList, Check, X, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Tabs, Badge, Drawer, Button, Textarea, SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { formatDate } from '../../lib/utils.js'
import { scoreApplication } from '../../lib/screening.js'
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, TIER_LABELS } from '../../lib/constants.js'

export default function Applications() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('submitted')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')

  const appsQ = useSupaQuery(['admin_applications'], (sb) =>
    sb.from('partner_applications').select('*').order('created_at', { ascending: false })
  )

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, notes: n }) => {
      const { data, error } = await supabase.rpc('review_partner_application', {
        p_application_id: id, p_decision: decision, p_notes: n || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      toast.success(`Application ${vars.decision.replace('_', ' ')}.`)
      queryClient.invalidateQueries({ queryKey: ['admin_applications'] })
      setSelected(null)
      setNotes('')
    },
    onError: (e) => toast.error(e.message || 'Could not update application.'),
  })

  const apps = appsQ.data ?? []
  const filtered = useMemo(() => (status === 'all' ? apps : apps.filter((a) => a.status === status)), [apps, status])

  const tabs = [
    { value: 'all', label: 'All', count: apps.length },
    ...APPLICATION_STATUSES.map((s) => ({ value: s, label: APPLICATION_STATUS_LABELS[s], count: apps.filter((a) => a.status === s).length })),
  ]

  return (
    <div>
      <PageHeader title="Partner Applications" subtitle="Screen and approve incoming partner applications." />

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {appsQ.isLoading && <SkeletonRows rows={6} />}
      {appsQ.isError && <ErrorState onRetry={appsQ.refetch} />}
      {appsQ.isSuccess && filtered.length === 0 && <EmptyState icon={ClipboardList} title="No applications here" />}

      {appsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Applicant</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Requested tier</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer transition-colors hover:bg-orange-50/40">
                  <td className="px-5 py-3.5 font-medium text-ink">{a.full_name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{a.company || '—'}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{TIER_LABELS[a.partner_type] ?? a.partner_type}</td>
                  <td className="px-5 py-3.5"><Badge status={a.status}>{APPLICATION_STATUS_LABELS[a.status]}</Badge></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.full_name} subtitle={selected?.reference_code}>
        {selected && (
          <div className="space-y-6">
            <Badge status={selected.status}>{APPLICATION_STATUS_LABELS[selected.status]}</Badge>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Email" value={selected.email} />
              <Info label="Phone" value={selected.phone} />
              <Info label="Company" value={selected.company} />
              <Info label="Website" value={selected.website} />
              <Info label="Country" value={selected.country} />
              <Info label="City" value={selected.city} />
              <Info label="Industry" value={selected.industry} />
              <Info label="Territory" value={selected.territory} />
              <Info label="Requested tier" value={TIER_LABELS[selected.partner_type]} />
              <Info label="Experience" value={selected.experience} />
              <Info label="Customer base" value={selected.customer_base} />
              <Info label="Submitted" value={formatDate(selected.created_at)} />
            </div>

            <ScreeningRecommendation app={selected} />

            {selected.status === 'submitted' && (
              <div className="space-y-3 border-t border-line pt-5">
                <Textarea placeholder="Optional note to the applicant…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button icon={Check} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: selected.id, decision: 'approved', notes })}>
                    Approve
                  </Button>
                  <Button variant="outline" icon={MessageCircleQuestion} onClick={() => reviewMutation.mutate({ id: selected.id, decision: 'more_info_required', notes })}>
                    Request info
                  </Button>
                  <Button variant="danger" icon={X} onClick={() => reviewMutation.mutate({ id: selected.id, decision: 'rejected', notes })}>
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {selected.review_notes && (
              <div className="rounded-xl bg-cream p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Review note</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.review_notes}</p>
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

function ScreeningRecommendation({ app }) {
  const { score, maxScore, recommended, reasons } = scoreApplication(app)
  const matches = recommended === app.partner_type
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-700">
        <Sparkles className="h-3.5 w-3.5" /> Automated screening (advisory only)
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-ink-soft">
          Recommended tier: <strong className="text-ink">{TIER_LABELS[recommended]}</strong>
          {!matches && <span className="ml-1.5 text-amber-700">(applicant requested {TIER_LABELS[app.partner_type]})</span>}
        </span>
        <span className="text-xs font-semibold text-orange-700">{score}/{maxScore}</span>
      </div>
      <ul className="mt-2 space-y-0.5">
        {reasons.map((r) => <li key={r} className="text-[11px] text-ink-soft">{r}</li>)}
      </ul>
    </div>
  )
}
