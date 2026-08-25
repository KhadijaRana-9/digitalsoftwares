import { useState } from 'react'
import { Plus, Landmark } from 'lucide-react'
import { PageHeader, Button, Input, Select, FormField, Modal, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency } from '../../lib/utils.js'
import { TERRITORY_MODELS } from '../../lib/constants.js'

const emptyForm = { name: '', country: '', region: '', vertical: '', model: 'non_exclusive', min_annual_sales: '' }

export default function Territories() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const territoriesQ = useSupaQuery(['territories'], (sb) => sb.from('territories').select('*').order('name'))

  const createMutation = useSupaMutation(
    (sb, payload) => sb.from('territories').insert(payload).select().single(),
    {
      invalidate: [['territories']],
      onSuccess: () => { toast.success('Territory created.'); setModalOpen(false); setForm(emptyForm) },
      onError: (e) => toast.error(e.message),
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({ ...form, min_annual_sales: form.min_annual_sales ? Number(form.min_annual_sales) : null })
  }

  const territories = territoriesQ.data ?? []

  return (
    <div>
      <PageHeader title="Territories" subtitle="Define exclusive, preferred and non-exclusive territory rights." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add Territory</Button>} />

      {territoriesQ.isLoading && <SkeletonRows rows={4} />}
      {territoriesQ.isError && <ErrorState onRetry={territoriesQ.refetch} />}
      {territoriesQ.isSuccess && territories.length === 0 && <EmptyState icon={Landmark} title="No territories defined yet" action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Add Territory</Button>} />}

      {territoriesQ.isSuccess && territories.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {territories.map((t) => (
            <div key={t.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-ink">{t.name}</h3>
                <Badge status={t.model} tone={t.model === 'exclusive' ? 'orange' : t.model === 'preferred' ? 'amber' : 'gray'}>
                  {t.model.replace('_', ' ')}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{[t.region, t.country].filter(Boolean).join(', ')} · {t.vertical}</p>
              {t.min_annual_sales && (
                <p className="mt-3 text-xs text-ink-soft">Min. annual sales: <strong className="text-ink">{formatCurrency(t.min_annual_sales)}</strong></p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add territory">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. UAE — Jewellery" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Country"><Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></FormField>
            <FormField label="Region"><Input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} /></FormField>
          </div>
          <FormField label="Vertical"><Input value={form.vertical} onChange={(e) => setForm((f) => ({ ...f, vertical: e.target.value }))} /></FormField>
          <FormField label="Model">
            <Select value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}>
              {TERRITORY_MODELS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </Select>
          </FormField>
          <FormField label="Minimum annual sales (PKR)" hint="Required for preferred/exclusive rights">
            <Input type="number" min="0" value={form.min_annual_sales} onChange={(e) => setForm((f) => ({ ...f, min_annual_sales: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create territory</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
