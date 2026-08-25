import { useMemo, useState } from 'react'
import { Plus, GitBranch, Send } from 'lucide-react'
import {
  PageHeader, Button, Input, Select, Textarea, FormField, Modal, Drawer,
  EmptyState, ErrorState, SkeletonCards,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency, formatDate, timeAgo } from '../../lib/utils.js'
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from '../../lib/constants.js'

const emptyForm = { name: '', value: '', probability: 20, stage: 'qualified', expected_close_date: '', product_id: '', notes: '' }

export default function Opportunities() {
  const { user } = useAuth()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')

  const oppsQ = useSupaQuery(
    ['opportunities', user?.id],
    (sb) => sb.from('opportunities').select('*, product:products(name), customer:customers(company_name)').eq('partner_id', user.id).order('created_at', { ascending: false }),
    { enabled: Boolean(user?.id) }
  )
  const productsQ = useSupaQuery(['products_active'], (sb) => sb.from('products').select('id, name').eq('is_active', true).order('name'))
  const activitiesQ = useSupaQuery(
    ['opp_activities', selected?.id],
    (sb) => sb.from('opportunity_activities').select('*').eq('opportunity_id', selected.id).order('created_at', { ascending: false }),
    { enabled: Boolean(selected?.id) }
  )

  const createMutation = useSupaMutation(
    (sb, payload) => sb.from('opportunities').insert({ ...payload, partner_id: user.id }).select().single(),
    {
      invalidate: [['opportunities', user?.id]],
      onSuccess: () => { toast.success('Opportunity created.'); setModalOpen(false); setForm(emptyForm) },
      onError: (e) => toast.error(e.message),
    }
  )

  const stageMutation = useSupaMutation(
    (sb, { id, stage }) => sb.from('opportunities').update({ stage }).eq('id', id).select().single(),
    {
      invalidate: [['opportunities', user?.id]],
      onSuccess: (data) => { toast.success(`Moved to ${OPPORTUNITY_STAGE_LABELS[data.stage]}.`); setSelected(data) },
      onError: (e) => toast.error(e.message),
    }
  )

  const addNoteMutation = useSupaMutation(
    (sb, text) => sb.from('opportunity_activities').insert({ opportunity_id: selected.id, partner_id: user.id, note: text }).select().single(),
    { invalidate: [['opp_activities', selected?.id]], onSuccess: () => setNote(''), onError: (e) => toast.error(e.message) }
  )

  const opportunities = oppsQ.data ?? []
  const columns = useMemo(
    () => OPPORTUNITY_STAGES.map((stage) => ({ stage, items: opportunities.filter((o) => o.stage === stage) })),
    [opportunities]
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({ ...form, value: form.value ? Number(form.value) : 0, probability: Number(form.probability), expected_close_date: form.expected_close_date || null, product_id: form.product_id || null })
  }

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="Your pipeline from qualified through won or lost."
        action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add Opportunity</Button>}
      />

      {oppsQ.isLoading && <SkeletonCards count={6} className="lg:grid-cols-6" />}
      {oppsQ.isError && <ErrorState onRetry={oppsQ.refetch} />}
      {oppsQ.isSuccess && opportunities.length === 0 && (
        <EmptyState icon={GitBranch} title="No opportunities yet" description="Create your first opportunity to start tracking the pipeline." action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Add Opportunity</Button>} />
      )}

      {oppsQ.isSuccess && opportunities.length > 0 && (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-[16rem]">
          {columns.map((col) => (
            <div key={col.stage} className="flex min-w-[16rem] flex-col rounded-2xl border border-line bg-cream/60 p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">{OPPORTUNITY_STAGE_LABELS[col.stage]}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-ink-soft">{col.items.length}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {col.items.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="rounded-xl border border-line bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-ink">{o.name}</p>
                    <p className="mt-1 text-xs text-ink-soft">{o.customer?.company_name ?? o.product?.name ?? '—'}</p>
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-orange-600">{formatCurrency(o.value)}</span>
                      <span className="text-ink-soft">{o.probability}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add opportunity" size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Opportunity name" required className="sm:col-span-2">
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. ABC Textile — Production ERP" />
          </FormField>
          <FormField label="Product">
            <Select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}>
              <option value="">Select a product</option>
              {(productsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Stage">
            <Select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}>
              {OPPORTUNITY_STAGES.map((s) => <option key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</option>)}
            </Select>
          </FormField>
          <FormField label="Value (PKR)">
            <Input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          </FormField>
          <FormField label="Probability (%)">
            <Input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value }))} />
          </FormField>
          <FormField label="Expected close date" className="sm:col-span-2">
            <Input type="date" value={form.expected_close_date} onChange={(e) => setForm((f) => ({ ...f, expected_close_date: e.target.value }))} />
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create opportunity</Button>
          </div>
        </form>
      </Modal>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name} subtitle="Opportunity detail">
        {selected && (
          <div className="space-y-6">
            <FormField label="Stage">
              <Select value={selected.stage} onChange={(e) => stageMutation.mutate({ id: selected.id, stage: e.target.value })}>
                {OPPORTUNITY_STAGES.map((s) => <option key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</option>)}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Value" value={formatCurrency(selected.value)} />
              <Info label="Probability" value={`${selected.probability}%`} />
              <Info label="Product" value={selected.product?.name} />
              <Info label="Customer" value={selected.customer?.company_name} />
              <Info label="Expected close" value={formatDate(selected.expected_close_date)} />
              <Info label="Created" value={formatDate(selected.created_at)} />
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Notes</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.notes}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-orange-600">Activity history</h4>
              <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNoteMutation.mutate(note.trim()) }} className="mt-3 flex gap-2">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log an update…" />
                <Button type="submit" size="sm" icon={Send} loading={addNoteMutation.isPending}>Log</Button>
              </form>
              <div className="mt-4 space-y-3 border-l-2 border-orange-100 pl-4">
                {(activitiesQ.data ?? []).length === 0 && <p className="text-xs text-ink-soft">No activity logged yet.</p>}
                {(activitiesQ.data ?? []).map((a) => (
                  <div key={a.id}>
                    <p className="text-sm text-ink">{a.note}</p>
                    <p className="text-xs text-ink-soft">{timeAgo(a.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
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
