import { useState } from 'react'
import { Plus, Percent, Tag } from 'lucide-react'
import {
  PageHeader, Tabs, Button, Input, Select, Textarea, FormField, Modal,
  Badge, SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency } from '../../lib/utils.js'

const ruleEmptyForm = { name: '', scope_type: 'tier', tier_id: '', product_id: '', partner_id: '', commission_percent: '', recurring: false, notes: '' }
const mapEmptyForm = { product_id: '', territory_id: '', map_price: '', currency: 'USD', requires_approval_below: true }

export default function Pricing() {
  const toast = useToast()
  const [tab, setTab] = useState('rules')
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [ruleForm, setRuleForm] = useState(ruleEmptyForm)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [mapForm, setMapForm] = useState(mapEmptyForm)

  const rulesQ = useSupaQuery(['commission_rules'], (sb) =>
    sb.from('commission_rules').select('*, tier:partner_tiers(name), product:products(name)').order('created_at', { ascending: false })
  )
  const mapQ = useSupaQuery(['map_rules'], (sb) =>
    sb.from('map_rules').select('*, product:products(name), territory:territories(name)').order('created_at', { ascending: false })
  )
  const tiersQ = useSupaQuery(['all_tiers'], (sb) => sb.from('partner_tiers').select('id, name').order('sort_order'))
  const productsQ = useSupaQuery(['products_active'], (sb) => sb.from('products').select('id, name').eq('is_active', true).order('name'))
  const territoriesQ = useSupaQuery(['territories_all'], (sb) => sb.from('territories').select('id, name').order('name'))

  const ruleMutation = useSupaMutation(
    (sb, payload) => sb.from('commission_rules').insert(payload).select().single(),
    { invalidate: [['commission_rules']], onSuccess: () => { toast.success('Rule created.'); setRuleModalOpen(false); setRuleForm(ruleEmptyForm) }, onError: (e) => toast.error(e.message) }
  )
  const ruleToggle = useSupaMutation(
    (sb, { id, is_active }) => sb.from('commission_rules').update({ is_active }).eq('id', id).select().single(),
    { invalidate: [['commission_rules']], onError: (e) => toast.error(e.message) }
  )
  const mapMutation = useSupaMutation(
    (sb, payload) => sb.from('map_rules').insert(payload).select().single(),
    { invalidate: [['map_rules']], onSuccess: () => { toast.success('MAP rule created.'); setMapModalOpen(false); setMapForm(mapEmptyForm) }, onError: (e) => toast.error(e.message) }
  )

  const submitRule = (e) => {
    e.preventDefault()
    ruleMutation.mutate({
      name: ruleForm.name,
      scope_type: ruleForm.scope_type,
      tier_id: ruleForm.scope_type === 'tier' ? ruleForm.tier_id || null : null,
      product_id: ruleForm.scope_type === 'product' ? ruleForm.product_id || null : null,
      partner_id: ruleForm.scope_type === 'partner' ? ruleForm.partner_id || null : null,
      commission_percent: Number(ruleForm.commission_percent) || 0,
      recurring: ruleForm.recurring,
      notes: ruleForm.notes,
    })
  }

  const submitMap = (e) => {
    e.preventDefault()
    mapMutation.mutate({
      product_id: mapForm.product_id,
      territory_id: mapForm.territory_id || null,
      map_price: Number(mapForm.map_price) || 0,
      currency: mapForm.currency,
      requires_approval_below: mapForm.requires_approval_below,
    })
  }

  return (
    <div>
      <PageHeader title="Pricing & Rules" subtitle="Commission rule engine and Minimum Advertised Price (MAP) enforcement." />

      <Tabs
        tabs={[
          { value: 'rules', label: 'Commission Rules' },
          { value: 'map', label: 'MAP Rules' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-4"
      />

      {tab === 'rules' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button icon={Plus} onClick={() => setRuleModalOpen(true)}>Add Rule</Button>
          </div>
          {rulesQ.isLoading && <SkeletonRows rows={4} />}
          {rulesQ.isError && <ErrorState onRetry={rulesQ.refetch} />}
          {rulesQ.isSuccess && (rulesQ.data ?? []).length === 0 && (
            <EmptyState icon={Percent} title="No commission rule overrides yet" description="Base rates come from Partner Tiers × Products. Add a rule here only for exceptions." />
          )}
          <div className="space-y-2">
            {(rulesQ.data ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
                <div>
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-ink-soft">
                    {r.scope_type} · {r.tier?.name || r.product?.name || 'Specific partner'} {r.recurring && '· recurring'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-orange-600">{r.commission_percent}%</span>
                  <Badge tone={r.is_active ? 'green' : 'gray'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => ruleToggle.mutate({ id: r.id, is_active: !r.is_active })}>
                    {r.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'map' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button icon={Plus} onClick={() => setMapModalOpen(true)}>Add MAP Rule</Button>
          </div>
          {mapQ.isLoading && <SkeletonRows rows={4} />}
          {mapQ.isError && <ErrorState onRetry={mapQ.refetch} />}
          {mapQ.isSuccess && (mapQ.data ?? []).length === 0 && (
            <EmptyState icon={Tag} title="No MAP rules yet" description="Partners can't publicly undercut these prices without approval." />
          )}
          <div className="space-y-2">
            {(mapQ.data ?? []).map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
                <div>
                  <p className="font-semibold text-ink">{m.product?.name}</p>
                  <p className="text-xs text-ink-soft">{m.territory?.name ?? 'All territories'}</p>
                </div>
                <span className="text-lg font-black text-ink">{formatCurrency(m.map_price, m.currency)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={ruleModalOpen} onClose={() => setRuleModalOpen(false)} title="Add commission rule">
        <form onSubmit={submitRule} className="space-y-4">
          <FormField label="Rule name" required><Input required value={ruleForm.name} onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Scope">
            <Select value={ruleForm.scope_type} onChange={(e) => setRuleForm((f) => ({ ...f, scope_type: e.target.value }))}>
              <option value="tier">Tier override</option>
              <option value="product">Product override</option>
              <option value="partner">Specific partner override</option>
            </Select>
          </FormField>
          {ruleForm.scope_type === 'tier' && (
            <FormField label="Tier">
              <Select value={ruleForm.tier_id} onChange={(e) => setRuleForm((f) => ({ ...f, tier_id: e.target.value }))}>
                <option value="">Select tier</option>
                {(tiersQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </FormField>
          )}
          {ruleForm.scope_type === 'product' && (
            <FormField label="Product">
              <Select value={ruleForm.product_id} onChange={(e) => setRuleForm((f) => ({ ...f, product_id: e.target.value }))}>
                <option value="">Select product</option>
                {(productsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormField>
          )}
          <FormField label="Commission %" required><Input required type="number" value={ruleForm.commission_percent} onChange={(e) => setRuleForm((f) => ({ ...f, commission_percent: e.target.value }))} /></FormField>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={ruleForm.recurring} onChange={(e) => setRuleForm((f) => ({ ...f, recurring: e.target.checked }))} className="h-4 w-4 rounded border-line text-orange-500" />
            Recurring (applies every billing cycle)
          </label>
          <FormField label="Notes"><Textarea value={ruleForm.notes} onChange={(e) => setRuleForm((f) => ({ ...f, notes: e.target.value }))} /></FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRuleModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={ruleMutation.isPending}>Create rule</Button>
          </div>
        </form>
      </Modal>

      <Modal open={mapModalOpen} onClose={() => setMapModalOpen(false)} title="Add MAP rule">
        <form onSubmit={submitMap} className="space-y-4">
          <FormField label="Product" required>
            <Select required value={mapForm.product_id} onChange={(e) => setMapForm((f) => ({ ...f, product_id: e.target.value }))}>
              <option value="">Select product</option>
              {(productsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Territory" hint="Leave blank to apply everywhere">
            <Select value={mapForm.territory_id} onChange={(e) => setMapForm((f) => ({ ...f, territory_id: e.target.value }))}>
              <option value="">All territories</option>
              {(territoriesQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FormField>
          <FormField label="MAP price" required><Input required type="number" value={mapForm.map_price} onChange={(e) => setMapForm((f) => ({ ...f, map_price: e.target.value }))} /></FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setMapModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mapMutation.isPending}>Create MAP rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
