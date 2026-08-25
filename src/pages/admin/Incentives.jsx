import { useState } from 'react'
import { Plus, Gift } from 'lucide-react'
import { PageHeader, Button, Input, Select, Textarea, FormField, Modal, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency } from '../../lib/utils.js'

const emptyForm = { title: '', description: '', target_amount: '', bonus_amount: '', bonus_type: 'cash', period: 'quarterly', is_active: true }

export default function Incentives() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const incentivesQ = useSupaQuery(['admin_incentives'], (sb) => sb.from('incentives').select('*').order('target_amount'))

  const createMutation = useSupaMutation(
    (sb, payload) => sb.from('incentives').insert(payload).select().single(),
    { invalidate: [['admin_incentives']], onSuccess: () => { toast.success('Incentive created.'); setModalOpen(false); setForm(emptyForm) }, onError: (e) => toast.error(e.message) }
  )

  const toggleMutation = useSupaMutation(
    (sb, { id, is_active }) => sb.from('incentives').update({ is_active }).eq('id', id).select().single(),
    { invalidate: [['admin_incentives']], onError: (e) => toast.error(e.message) }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      title: form.title, description: form.description, target_amount: Number(form.target_amount) || 0,
      bonus_amount: form.bonus_amount ? Number(form.bonus_amount) : null, bonus_type: form.bonus_type,
      period: form.period, is_active: form.is_active,
    })
  }

  const incentives = incentivesQ.data ?? []

  return (
    <div>
      <PageHeader title="Partner Incentives" subtitle="Quarterly and annual bonus rules." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add Incentive</Button>} />

      {incentivesQ.isLoading && <SkeletonRows rows={4} />}
      {incentivesQ.isError && <ErrorState onRetry={incentivesQ.refetch} />}
      {incentivesQ.isSuccess && incentives.length === 0 && <EmptyState icon={Gift} title="No incentives yet" action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Add Incentive</Button>} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {incentives.map((i) => (
          <div key={i.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-ink">{i.title}</h3>
              <Badge tone={i.is_active ? 'green' : 'gray'}>{i.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">{i.description}</p>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5">
              <span className="text-xs font-semibold text-orange-700">{formatCurrency(i.target_amount)} target</span>
              <span className="font-black text-orange-700">{i.bonus_amount ? formatCurrency(i.bonus_amount) : i.bonus_type.replace('_', ' ')}</span>
            </div>
            <Button size="sm" variant="ghost" className="mt-3" onClick={() => toggleMutation.mutate({ id: i.id, is_active: !i.is_active })}>
              {i.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add incentive">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Target amount (PKR)" required><Input required type="number" value={form.target_amount} onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))} /></FormField>
            <FormField label="Period">
              <Select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bonus amount (PKR)" hint="Leave blank for a status upgrade">
              <Input type="number" value={form.bonus_amount} onChange={(e) => setForm((f) => ({ ...f, bonus_amount: e.target.value }))} />
            </FormField>
            <FormField label="Bonus type">
              <Select value={form.bonus_type} onChange={(e) => setForm((f) => ({ ...f, bonus_type: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="status_upgrade">Status upgrade</option>
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create incentive</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
