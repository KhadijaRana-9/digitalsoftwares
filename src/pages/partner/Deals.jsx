import { useMemo, useState } from 'react'
import { Plus, Handshake, ShieldCheck } from 'lucide-react'
import {
  PageHeader, Button, Input, Select, Textarea, FormField, Modal, Drawer, Tabs,
  Badge, SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency, formatDate } from '../../lib/utils.js'
import { DEAL_STATUSES, DEAL_STATUS_LABELS } from '../../lib/constants.js'

const emptyForm = {
  customer_company: '', contact_name: '', contact_email: '', industry: '',
  country: '', product_id: '', estimated_value: '', expected_close_date: '', notes: '',
}

export default function Deals() {
  const { user } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState(null)

  const dealsQ = useSupaQuery(
    ['deals', user?.id],
    (sb) => sb.from('deal_registrations').select('*, product:products(name)').eq('partner_id', user.id).order('created_at', { ascending: false }),
    { enabled: Boolean(user?.id) }
  )
  const productsQ = useSupaQuery(['products_active'], (sb) => sb.from('products').select('id, name').eq('is_active', true).order('name'))

  const createMutation = useSupaMutation(
    (sb, payload) => sb.from('deal_registrations').insert({ ...payload, partner_id: user.id }).select().single(),
    {
      invalidate: [['deals', user?.id]],
      onSuccess: () => { toast.success('Deal registered — pending Digitalsofts approval.'); setModalOpen(false); setForm(emptyForm) },
      onError: (e) => toast.error(e.message || 'Could not register deal.'),
    }
  )

  const deals = dealsQ.data ?? []
  const filtered = useMemo(() => (status === 'all' ? deals : deals.filter((d) => d.status === status)), [deals, status])

  const tabs = [
    { value: 'all', label: 'All', count: deals.length },
    ...DEAL_STATUSES.map((s) => ({ value: s, label: DEAL_STATUS_LABELS[s], count: deals.filter((d) => d.status === s).length })),
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({ ...form, estimated_value: form.estimated_value ? Number(form.estimated_value) : null, expected_close_date: form.expected_close_date || null, product_id: form.product_id || null })
  }

  const protectionDaysLeft = (deal) => {
    if (!deal.protection_end) return null
    const days = Math.ceil((new Date(deal.protection_end) - new Date()) / 86400000)
    return days
  }

  return (
    <div>
      <PageHeader
        title="Deal Registration"
        subtitle="Register an opportunity to lock in 60–90 days of protection once approved."
        action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Register Deal</Button>}
      />

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {dealsQ.isLoading && <SkeletonRows rows={5} />}
      {dealsQ.isError && <ErrorState onRetry={dealsQ.refetch} />}
      {dealsQ.isSuccess && filtered.length === 0 && (
        <EmptyState icon={Handshake} title="No deals registered" description="Register your first opportunity to protect your commission." action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Register Deal</Button>} />
      )}

      {dealsQ.isSuccess && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((deal) => {
            const daysLeft = protectionDaysLeft(deal)
            return (
              <button
                key={deal.id}
                onClick={() => setSelected(deal)}
                className="flex flex-col rounded-2xl border border-line bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-ink">{deal.customer_company}</h3>
                  <Badge status={deal.status}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{deal.product?.name ?? 'No product selected'}</p>
                <p className="mt-3 text-lg font-black text-ink">{formatCurrency(deal.estimated_value)}</p>
                {deal.status === 'approved' && daysLeft !== null && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {daysLeft > 0 ? `${daysLeft} days of protection left` : 'Protection window ended'}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register a deal" size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Customer / company" required className="sm:col-span-2">
            <Input required value={form.customer_company} onChange={(e) => setForm((f) => ({ ...f, customer_company: e.target.value }))} />
          </FormField>
          <FormField label="Contact name">
            <Input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
          </FormField>
          <FormField label="Contact email">
            <Input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
          </FormField>
          <FormField label="Industry">
            <Input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          </FormField>
          <FormField label="Country">
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </FormField>
          <FormField label="Product">
            <Select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}>
              <option value="">Select a product</option>
              {(productsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Estimated value (PKR)">
            <Input type="number" min="0" value={form.estimated_value} onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))} />
          </FormField>
          <FormField label="Expected close date" className="sm:col-span-2">
            <Input type="date" value={form.expected_close_date} onChange={(e) => setForm((f) => ({ ...f, expected_close_date: e.target.value }))} />
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Submit for approval</Button>
          </div>
        </form>
      </Modal>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.customer_company} subtitle="Deal registration">
        {selected && (
          <div className="space-y-5">
            <Badge status={selected.status}>{DEAL_STATUS_LABELS[selected.status]}</Badge>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Contact" value={selected.contact_name} />
              <Info label="Email" value={selected.contact_email} />
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
            {selected.review_notes && (
              <div className="rounded-xl bg-cream p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Reviewer note</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.review_notes}</p>
              </div>
            )}
            {selected.notes && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Your notes</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.notes}</p>
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
