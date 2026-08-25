import { useState } from 'react'
import { Plus, Boxes, Save, ExternalLink } from 'lucide-react'
import {
  PageHeader, Button, Input, Select, Textarea, FormField, Modal, Drawer,
  Badge, ConfirmDialog, SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency, slugify } from '../../lib/utils.js'
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from '../../lib/constants.js'

const CURRENCIES = ['USD', 'PKR']
const emptyForm = {
  name: '', category_id: '', description: '', features: '', product_type: 'saas',
  retail_price: '', currency: 'USD', source_url: '', pricing_confirmed: false, is_active: true,
}

export default function AdminProducts() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pricingProduct, setPricingProduct] = useState(null)
  const [pricingDraft, setPricingDraft] = useState({})
  const [deactivating, setDeactivating] = useState(null)

  const productsQ = useSupaQuery(['admin_products'], (sb) => sb.from('products').select('*, category:product_categories(*)').order('name'))
  const categoriesQ = useSupaQuery(['product_categories'], (sb) => sb.from('product_categories').select('*').order('name'))
  const tiersQ = useSupaQuery(['all_tiers'], (sb) => sb.from('partner_tiers').select('*').order('sort_order'))
  const pricingQ = useSupaQuery(
    ['product_pricing', pricingProduct?.id],
    (sb) => sb.from('product_pricing').select('*').eq('product_id', pricingProduct.id),
    { enabled: Boolean(pricingProduct?.id) }
  )

  const saveMutation = useSupaMutation(
    (sb, payload) =>
      editing
        ? sb.from('products').update(payload).eq('id', editing.id).select().single()
        : sb.from('products').insert({ ...payload, slug: slugify(payload.name) }).select().single(),
    {
      invalidate: [['admin_products']],
      onSuccess: () => { toast.success(editing ? 'Product updated.' : 'Product created.'); setModalOpen(false) },
      onError: (e) => toast.error(e.message),
    }
  )

  const toggleMutation = useSupaMutation(
    (sb, { id, is_active }) => sb.from('products').update({ is_active }).eq('id', id).select().single(),
    { invalidate: [['admin_products']], onSuccess: () => toast.success('Product status updated.'), onError: (e) => toast.error(e.message) }
  )

  const pricingMutation = useSupaMutation(
    (sb, rows) => sb.from('product_pricing').upsert(rows, { onConflict: 'product_id,tier_id' }).select(),
    {
      invalidate: [['product_pricing', pricingProduct?.id]],
      onSuccess: () => toast.success('Pricing saved.'),
      onError: (e) => toast.error(e.message),
    }
  )

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ ...emptyForm, ...p, features: (p.features ?? []).join(', '), category_id: p.category_id ?? '' })
    setModalOpen(true)
  }

  const openPricing = (p) => {
    setPricingProduct(p)
    setPricingDraft({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      name: form.name,
      category_id: form.category_id || null,
      description: form.description,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      product_type: form.product_type,
      retail_price: Number(form.retail_price) || 0,
      currency: form.currency,
      source_url: form.source_url || null,
      pricing_confirmed: form.pricing_confirmed,
      is_active: form.is_active,
    })
  }

  const savePricing = (tierId) => {
    const existing = (pricingQ.data ?? []).find((p) => p.tier_id === tierId)
    const draft = pricingDraft[tierId] ?? {}
    pricingMutation.mutate([{
      id: existing?.id,
      product_id: pricingProduct.id,
      tier_id: tierId,
      partner_price: Number(draft.partner_price ?? existing?.partner_price ?? 0),
      commission_percent: Number(draft.commission_percent ?? existing?.commission_percent ?? 0),
      recurring_commission_percent: draft.recurring_commission_percent ?? existing?.recurring_commission_percent ?? null,
    }])
  }

  const products = productsQ.data ?? []

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage the catalog and per-tier pricing." action={<Button icon={Plus} onClick={openCreate}>Add Product</Button>} />

      {productsQ.isLoading && <SkeletonRows rows={6} />}
      {productsQ.isError && <ErrorState onRetry={productsQ.refetch} />}
      {productsQ.isSuccess && products.length === 0 && <EmptyState icon={Boxes} title="No products yet" action={<Button size="sm" icon={Plus} onClick={openCreate}>Add Product</Button>} />}

      {productsQ.isSuccess && products.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Retail price</th>
                <th className="px-5 py-3">Pricing</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3.5 font-medium text-ink">
                    <div className="flex items-center gap-1.5">
                      {p.name}
                      {p.source_url && (
                        <a href={p.source_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-ink-soft hover:text-orange-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{p.category?.vertical ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{PRODUCT_TYPE_LABELS[p.product_type]}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatCurrency(p.retail_price, p.currency)}</td>
                  <td className="px-5 py-3.5"><Badge tone={p.pricing_confirmed ? 'green' : 'amber'}>{p.pricing_confirmed ? 'Confirmed' : 'Draft'}</Badge></td>
                  <td className="px-5 py-3.5"><Badge status={p.is_active ? 'active' : 'inactive'} tone={p.is_active ? 'green' : 'gray'} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs font-semibold text-orange-600 hover:underline">Edit</button>
                      <button onClick={() => openPricing(p)} className="text-xs font-semibold text-orange-600 hover:underline">Pricing</button>
                      <button
                        onClick={() => (p.is_active ? setDeactivating(p) : toggleMutation.mutate({ id: p.id, is_active: true }))}
                        className="text-xs font-semibold text-ink-soft hover:underline"
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit product' : 'Add product'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Product name" required className="sm:col-span-2">
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Category">
            <Select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Uncategorized</option>
              {(categoriesQ.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.vertical}</option>)}
            </Select>
          </FormField>
          <FormField label="Type">
            <Select value={form.product_type} onChange={(e) => setForm((f) => ({ ...f, product_type: e.target.value }))}>
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</option>)}
            </Select>
          </FormField>
          <FormField label="Retail price / yr">
            <Input type="number" min="0" value={form.retail_price} onChange={(e) => setForm((f) => ({ ...f, retail_price: e.target.value }))} />
          </FormField>
          <FormField label="Currency">
            <Select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField label="Source URL" className="sm:col-span-2" hint="Live product page on digitalsofts.com, if any">
            <Input value={form.source_url} onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))} placeholder="https://www.digitalsofts.com/products/…" />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Features (comma-separated)" className="sm:col-span-2">
            <Input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="POS, Inventory, Barcode" />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium text-ink sm:col-span-2">
            <input
              type="checkbox"
              checked={form.pricing_confirmed}
              onChange={(e) => setForm((f) => ({ ...f, pricing_confirmed: e.target.checked }))}
              className="h-4 w-4 rounded border-line text-orange-500 focus:ring-orange-400"
            />
            Pricing confirmed by Digitalsofts leadership (unchecked = shown as "Draft price" everywhere)
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editing ? 'Save changes' : 'Create product'}</Button>
          </div>
        </form>
      </Modal>

      <Drawer open={Boolean(pricingProduct)} onClose={() => setPricingProduct(null)} title={`Pricing — ${pricingProduct?.name}`} subtitle="Per-tier partner price and commission">
        {pricingProduct && (
          <div className="space-y-3">
            {(tiersQ.data ?? []).map((tier) => {
              const existing = (pricingQ.data ?? []).find((p) => p.tier_id === tier.id)
              const draft = pricingDraft[tier.id] ?? {}
              return (
                <div key={tier.id} className="rounded-xl border border-line p-4">
                  <p className="text-sm font-bold text-ink">{tier.name}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <FormField label="Partner price">
                      <Input
                        type="number"
                        defaultValue={existing?.partner_price ?? ''}
                        onChange={(e) => setPricingDraft((d) => ({ ...d, [tier.id]: { ...d[tier.id], partner_price: e.target.value } }))}
                      />
                    </FormField>
                    <FormField label="Commission %">
                      <Input
                        type="number"
                        defaultValue={existing?.commission_percent ?? ''}
                        onChange={(e) => setPricingDraft((d) => ({ ...d, [tier.id]: { ...d[tier.id], commission_percent: e.target.value } }))}
                      />
                    </FormField>
                  </div>
                  <Button size="sm" variant="outline" icon={Save} className="mt-3" loading={pricingMutation.isPending} onClick={() => savePricing(tier.id)}>
                    Save
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deactivating)}
        onClose={() => setDeactivating(null)}
        onConfirm={() => { toggleMutation.mutate({ id: deactivating.id, is_active: false }); setDeactivating(null) }}
        title="Deactivate product"
        description={`"${deactivating?.name}" will disappear from the public catalog and partner pricing pages. Existing deals and commissions are unaffected.`}
        confirmLabel="Deactivate"
        loading={toggleMutation.isPending}
      />
    </div>
  )
}
