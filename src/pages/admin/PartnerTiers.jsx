import { useState } from 'react'
import { Plus, Layers, Save } from 'lucide-react'
import {
  PageHeader, Button, Input, Textarea, FormField, Modal, Badge,
  SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency, slugify } from '../../lib/utils.js'

const emptyForm = {
  key: '', name: '', tagline: '', description: '',
  min_commission: 0, max_commission: 0, saas_commission: 0, service_commission: 0,
  discount_authority: 0, annual_sales_target: '', requirements: '', benefits: '',
  certification_required: false,
}

export default function PartnerTiers() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const tiersQ = useSupaQuery(['admin_tiers'], (sb) => sb.from('partner_tiers').select('*').order('sort_order'))

  const saveMutation = useSupaMutation(
    (sb, payload) =>
      editing
        ? sb.from('partner_tiers').update(payload).eq('id', editing.id).select().single()
        : sb.from('partner_tiers').insert({ ...payload, key: slugify(payload.name), sort_order: (tiersQ.data?.length ?? 0) + 1 }).select().single(),
    {
      invalidate: [['admin_tiers']],
      onSuccess: () => { toast.success(editing ? 'Tier updated.' : 'Tier created.'); setModalOpen(false) },
      onError: (e) => toast.error(e.message),
    }
  )

  const toggleMutation = useSupaMutation(
    (sb, { id, is_active }) => sb.from('partner_tiers').update({ is_active }).eq('id', id).select().single(),
    { invalidate: [['admin_tiers']], onSuccess: () => toast.success('Tier status updated.'), onError: (e) => toast.error(e.message) }
  )

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (t) => {
    setEditing(t)
    setForm({ ...emptyForm, ...t, annual_sales_target: t.annual_sales_target ?? '' })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      min_commission: Number(form.min_commission) || 0,
      max_commission: Number(form.max_commission) || 0,
      saas_commission: Number(form.saas_commission) || 0,
      service_commission: Number(form.service_commission) || 0,
      discount_authority: Number(form.discount_authority) || 0,
      annual_sales_target: form.annual_sales_target ? Number(form.annual_sales_target) : null,
      requirements: form.requirements,
      benefits: form.benefits,
      certification_required: form.certification_required,
    })
  }

  const tiers = tiersQ.data ?? []

  return (
    <div>
      <PageHeader
        title="Partner Tiers"
        subtitle="Affiliate → Referral → Reseller → Certified → Strategic — configurable, not hardcoded."
        action={<Button icon={Plus} onClick={openCreate}>Add Tier</Button>}
      />

      {tiersQ.isLoading && <SkeletonRows rows={5} />}
      {tiersQ.isError && <ErrorState onRetry={tiersQ.refetch} />}
      {tiersQ.isSuccess && tiers.length === 0 && <EmptyState icon={Layers} title="No tiers yet" action={<Button size="sm" icon={Plus} onClick={openCreate}>Add Tier</Button>} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {tiers.map((t) => (
          <div key={t.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-ink">{t.name}</h3>
                <p className="text-xs text-ink-soft">{t.tagline}</p>
              </div>
              <Badge tone={t.is_active ? 'green' : 'gray'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Commission" value={`${t.min_commission}–${t.max_commission}%`} />
              <Stat label="SaaS" value={`${t.saas_commission}%`} />
              <Stat label="Discount" value={`${t.discount_authority}%`} />
            </div>

            <p className="mt-3 text-xs text-ink-soft">
              Annual target: <strong className="text-ink">{t.annual_sales_target ? formatCurrency(t.annual_sales_target) : 'None'}</strong>
              {t.certification_required && <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-orange-700">Certification required</span>}
            </p>

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Edit</Button>
              <Button
                size="sm"
                variant={t.is_active ? 'ghost' : 'subtle'}
                loading={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
              >
                {t.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit tier' : 'Add tier'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="DS Reseller" />
          </FormField>
          <FormField label="Tagline" className="sm:col-span-2">
            <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
          </FormField>
          <FormField label="Min commission %"><Input type="number" value={form.min_commission} onChange={(e) => setForm((f) => ({ ...f, min_commission: e.target.value }))} /></FormField>
          <FormField label="Max commission %"><Input type="number" value={form.max_commission} onChange={(e) => setForm((f) => ({ ...f, max_commission: e.target.value }))} /></FormField>
          <FormField label="SaaS commission %"><Input type="number" value={form.saas_commission} onChange={(e) => setForm((f) => ({ ...f, saas_commission: e.target.value }))} /></FormField>
          <FormField label="Service commission %"><Input type="number" value={form.service_commission} onChange={(e) => setForm((f) => ({ ...f, service_commission: e.target.value }))} /></FormField>
          <FormField label="Discount authority %"><Input type="number" value={form.discount_authority} onChange={(e) => setForm((f) => ({ ...f, discount_authority: e.target.value }))} /></FormField>
          <FormField label="Annual sales target (PKR)"><Input type="number" value={form.annual_sales_target} onChange={(e) => setForm((f) => ({ ...f, annual_sales_target: e.target.value }))} /></FormField>
          <FormField label="Requirements" className="sm:col-span-2"><Textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} /></FormField>
          <FormField label="Benefits" className="sm:col-span-2"><Textarea value={form.benefits} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))} /></FormField>
          <label className="flex items-center gap-2 text-sm font-medium text-ink sm:col-span-2">
            <input type="checkbox" checked={form.certification_required} onChange={(e) => setForm((f) => ({ ...f, certification_required: e.target.checked }))} className="h-4 w-4 rounded border-line text-orange-500" />
            Certification required for this tier
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" icon={Save} loading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create tier'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-cream p-2">
      <p className="text-[10px] font-semibold uppercase text-ink-soft">{label}</p>
      <p className="text-sm font-black text-ink">{value}</p>
    </div>
  )
}
