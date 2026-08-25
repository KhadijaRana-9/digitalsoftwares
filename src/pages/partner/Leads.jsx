import { useMemo, useState } from 'react'
import { Plus, Search, Target, Send } from 'lucide-react'
import {
  PageHeader, Button, Input, Select, Textarea, FormField, Modal, Drawer, Tabs,
  Badge, Pagination, SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency, formatDate, timeAgo } from '../../lib/utils.js'
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../lib/constants.js'

const PAGE_SIZE = 8
const emptyForm = {
  company_name: '', contact_name: '', contact_email: '', contact_phone: '',
  industry: '', country: '', estimated_value: '', expected_close_date: '', notes: '',
}

export default function Leads() {
  const { user } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')

  const leadsQ = useSupaQuery(['leads', user?.id], (sb) =>
    sb.from('leads').select('*, product:products(name)').eq('partner_id', user.id).order('created_at', { ascending: false }),
    { enabled: Boolean(user?.id) }
  )

  const activitiesQ = useSupaQuery(
    ['lead_activities', selected?.id],
    (sb) => sb.from('lead_activities').select('*').eq('lead_id', selected.id).order('created_at', { ascending: false }),
    { enabled: Boolean(selected?.id) }
  )

  const saveMutation = useSupaMutation(
    (sb, payload) =>
      editing
        ? sb.from('leads').update(payload).eq('id', editing.id).select().single()
        : sb.from('leads').insert({ ...payload, partner_id: user.id }).select().single(),
    {
      invalidate: [['leads', user?.id]],
      onSuccess: () => {
        toast.success(editing ? 'Lead updated.' : 'Lead created.')
        setModalOpen(false)
      },
      onError: (e) => toast.error(e.message || 'Could not save lead.'),
    }
  )

  const statusMutation = useSupaMutation(
    (sb, { id, status: newStatus }) => sb.from('leads').update({ status: newStatus }).eq('id', id).select().single(),
    {
      invalidate: [['leads', user?.id]],
      onSuccess: () => toast.success('Status updated.'),
      onError: (e) => toast.error(e.message),
    }
  )

  const addNoteMutation = useSupaMutation(
    (sb, text) => sb.from('lead_activities').insert({ lead_id: selected.id, partner_id: user.id, note: text }).select().single(),
    {
      invalidate: [['lead_activities', selected?.id]],
      onSuccess: () => setNote(''),
      onError: (e) => toast.error(e.message),
    }
  )

  const leads = leadsQ.data ?? []
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchStatus = status === 'all' || l.status === status
      const matchSearch = !search || l.company_name.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [leads, status, search])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }
  const openEdit = (lead) => {
    setEditing(lead)
    setForm({ ...emptyForm, ...lead, estimated_value: lead.estimated_value ?? '' })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      ...form,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      expected_close_date: form.expected_close_date || null,
    })
  }

  const tabs = [
    { value: 'all', label: 'All', count: leads.length },
    ...LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s], count: leads.filter((l) => l.status === s).length })),
  ]

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Track everyone you've introduced to Digitalsofts, from first contact to won or lost."
        action={<Button icon={Plus} onClick={openCreate}>Add Lead</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} active={status} onChange={(v) => { setStatus(v); setPage(1) }} />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search company…" className="pl-10" />
        </div>
      </div>

      {leadsQ.isLoading && <SkeletonRows rows={6} />}
      {leadsQ.isError && <ErrorState onRetry={leadsQ.refetch} />}
      {leadsQ.isSuccess && filtered.length === 0 && (
        <EmptyState icon={Target} title="No leads yet" description="Add your first lead to start tracking the pipeline." action={<Button size="sm" icon={Plus} onClick={openCreate}>Add Lead</Button>} />
      )}

      {leadsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Est. value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className="cursor-pointer transition-colors hover:bg-orange-50/50"
                  >
                    <td className="px-5 py-3.5 font-medium text-ink">{lead.company_name}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{lead.product?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatCurrency(lead.estimated_value)}</td>
                    <td className="px-5 py-3.5"><Badge status={lead.status}>{LEAD_STATUS_LABELS[lead.status]}</Badge></td>
                    <td className="px-5 py-3.5 text-ink-soft">{timeAgo(lead.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit lead' : 'Add lead'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Company name" required>
            <Input required value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
          </FormField>
          <FormField label="Contact name">
            <Input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
          </FormField>
          <FormField label="Contact email">
            <Input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
          </FormField>
          <FormField label="Contact phone">
            <Input value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
          </FormField>
          <FormField label="Industry">
            <Input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          </FormField>
          <FormField label="Country">
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </FormField>
          <FormField label="Estimated value (PKR)">
            <Input type="number" min="0" value={form.estimated_value} onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))} />
          </FormField>
          <FormField label="Expected close date">
            <Input type="date" value={form.expected_close_date} onChange={(e) => setForm((f) => ({ ...f, expected_close_date: e.target.value }))} />
          </FormField>
          {editing && (
            <FormField label="Status" className="sm:col-span-2">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
              </Select>
            </FormField>
          )}
          <FormField label="Notes" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create lead'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail drawer */}
      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.company_name} subtitle="Lead detail">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge status={selected.status}>{LEAD_STATUS_LABELS[selected.status]}</Badge>
              <Select
                value={selected.status}
                onChange={(e) => {
                  statusMutation.mutate({ id: selected.id, status: e.target.value })
                  setSelected((s) => ({ ...s, status: e.target.value }))
                }}
                className="w-auto"
              >
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Contact" value={selected.contact_name} />
              <Info label="Email" value={selected.contact_email} />
              <Info label="Phone" value={selected.contact_phone} />
              <Info label="Industry" value={selected.industry} />
              <Info label="Country" value={selected.country} />
              <Info label="Est. value" value={formatCurrency(selected.estimated_value)} />
              <Info label="Expected close" value={formatDate(selected.expected_close_date)} />
              <Info label="Created" value={formatDate(selected.created_at)} />
            </div>

            {selected.notes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-orange-600">Notes</h4>
                <p className="mt-2 text-sm text-ink-soft">{selected.notes}</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>Edit lead details</Button>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-orange-600">Activity timeline</h4>
              <form
                onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNoteMutation.mutate(note.trim()) }}
                className="mt-3 flex gap-2"
              >
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a call, email, or update…" />
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
