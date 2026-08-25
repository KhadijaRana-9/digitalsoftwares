import { useState } from 'react'
import { Plus, ShieldAlert } from 'lucide-react'
import { PageHeader, Tabs, Button, Input, Select, Textarea, FormField, Modal, Drawer, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDateTime, titleCase } from '../../lib/utils.js'
import { FRAUD_FLAG_STATUSES, FRAUD_FLAG_TYPES } from '../../lib/constants.js'

const emptyForm = { flag_type: 'self_referral', entity_type: 'partner', description: '', partner_id: '' }

export default function Compliance() {
  const toast = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState('open')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const flagsQ = useSupaQuery(['fraud_flags'], (sb) =>
    sb.from('fraud_flags').select('*, partner:profiles!partner_id(full_name, email)').order('created_at', { ascending: false })
  )
  const partnersQ = useSupaQuery(['partners_for_flag'], (sb) => sb.from('profiles').select('id, full_name').eq('role', 'partner').order('full_name'))

  const createMutation = useSupaMutation(
    (sb, payload) => sb.from('fraud_flags').insert({ ...payload, flagged_by: user.id }).select().single(),
    { invalidate: [['fraud_flags']], onSuccess: () => { toast.success('Flag created.'); setModalOpen(false); setForm(emptyForm) }, onError: (e) => toast.error(e.message) }
  )

  const resolveMutation = useSupaMutation(
    (sb, { id, newStatus, notes }) =>
      sb.from('fraud_flags').update({ status: newStatus, resolution_notes: notes, resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', id).select().single(),
    { invalidate: [['fraud_flags']], onSuccess: () => { toast.success('Flag updated.'); setSelected(null); setResolutionNotes('') }, onError: (e) => toast.error(e.message) }
  )

  const flags = flagsQ.data ?? []
  const filtered = status === 'all' ? flags : flags.filter((f) => f.status === status)
  const tabs = [
    { value: 'all', label: 'All', count: flags.length },
    ...FRAUD_FLAG_STATUSES.map((s) => ({ value: s, label: titleCase(s), count: flags.filter((f) => f.status === s).length })),
  ]

  return (
    <div>
      <PageHeader title="Fraud & Compliance" subtitle="Investigate flagged partner activity — nothing here is ever deleted." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Flag Activity</Button>} />

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {flagsQ.isLoading && <SkeletonRows rows={4} />}
      {flagsQ.isError && <ErrorState onRetry={flagsQ.refetch} />}
      {flagsQ.isSuccess && filtered.length === 0 && <EmptyState icon={ShieldAlert} title="Nothing flagged" />}

      <div className="space-y-2">
        {filtered.map((f) => (
          <button key={f.id} onClick={() => setSelected(f)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-orange-300">
            <div>
              <p className="font-semibold capitalize text-ink">{f.flag_type.replace(/_/g, ' ')}</p>
              <p className="text-xs text-ink-soft">{f.partner?.full_name ?? 'Unlinked'} · {formatDateTime(f.created_at)}</p>
            </div>
            <Badge status={f.status} />
          </button>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Flag suspicious activity">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <FormField label="Type">
            <Select value={form.flag_type} onChange={(e) => setForm((f) => ({ ...f, flag_type: e.target.value }))}>
              {FRAUD_FLAG_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </FormField>
          <FormField label="Partner" hint="Optional">
            <Select value={form.partner_id} onChange={(e) => setForm((f) => ({ ...f, partner_id: e.target.value }))}>
              <option value="">Not linked to a specific partner</option>
              {(partnersQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </FormField>
          <FormField label="Description" required><Textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create flag</Button>
          </div>
        </form>
      </Modal>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.flag_type ? titleCase(selected.flag_type) : ''} subtitle={selected?.partner?.full_name}>
        {selected && (
          <div className="space-y-5">
            <Badge status={selected.status} />
            <p className="text-sm text-ink-soft">{selected.description}</p>
            <p className="text-xs text-ink-soft">Flagged {formatDateTime(selected.created_at)}</p>

            {selected.resolution_notes && (
              <div className="rounded-xl bg-cream p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Resolution</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.resolution_notes}</p>
              </div>
            )}

            {!['dismissed', 'terminated'].includes(selected.status) && (
              <div className="space-y-3 border-t border-line pt-4">
                <Textarea placeholder="Investigation / resolution notes…" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} />
                <div className="flex flex-wrap gap-2">
                  {['investigating', 'warned', 'suspended', 'commission_cancelled', 'terminated', 'dismissed'].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === 'dismissed' ? 'outline' : s === 'terminated' ? 'danger' : 'subtle'}
                      loading={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate({ id: selected.id, newStatus: s, notes: resolutionNotes })}
                    >
                      {s.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
