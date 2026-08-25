import { useState } from 'react'
import { Search, Users, Ban, CheckCircle2, Landmark, Plus } from 'lucide-react'
import { PageHeader, Input, Select, Badge, Drawer, Button, ConfirmDialog, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatCurrency, formatDate } from '../../lib/utils.js'
import { TERRITORY_MODELS } from '../../lib/constants.js'

export default function Partners() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [assignTerritory, setAssignTerritory] = useState('')
  const [assignModel, setAssignModel] = useState('non_exclusive')

  const partnersQ = useSupaQuery(['admin_partners_full'], (sb) =>
    sb.from('partner_profiles').select('*, profile:profiles(full_name, email, phone), tier:partner_tiers(*)').order('created_at', { ascending: false })
  )
  const tiersQ = useSupaQuery(['all_tiers'], (sb) => sb.from('partner_tiers').select('*').order('sort_order'))
  const territoriesQ = useSupaQuery(['territories_all'], (sb) => sb.from('territories').select('*').order('name'))
  const assignmentsQ = useSupaQuery(
    ['partner_territories', selected?.id],
    (sb) => sb.from('partner_territories').select('*, territory:territories(name, model)').eq('partner_id', selected.id),
    { enabled: Boolean(selected?.id) }
  )

  const updateMutation = useSupaMutation(
    (sb, { id, payload }) => sb.from('partner_profiles').update(payload).eq('id', id).select().single(),
    { invalidate: [['admin_partners_full']], onSuccess: (data) => { toast.success('Partner updated.'); setSelected(data) }, onError: (e) => toast.error(e.message) }
  )

  const grantMutation = useSupaMutation(
    (sb, payload) => sb.from('partner_territories').insert(payload).select().single(),
    { invalidate: [['partner_territories', selected?.id]], onSuccess: () => toast.success('Territory granted.'), onError: (e) => toast.error(e.message) }
  )

  const revokeMutation = useSupaMutation(
    (sb, id) => sb.from('partner_territories').update({ status: 'expired' }).eq('id', id).select().single(),
    { invalidate: [['partner_territories', selected?.id]], onSuccess: () => toast.success('Territory revoked.'), onError: (e) => toast.error(e.message) }
  )

  const handleSuspend = (reason) => {
    updateMutation.mutate({ id: selected.id, payload: { status: 'suspended', status_reason: reason } })
    setSuspendOpen(false)
  }

  const partners = (partnersQ.data ?? []).filter(
    (p) => !search || p.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) || p.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Partners" subtitle="Every approved partner in the network." />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners…" className="pl-10" />
      </div>

      {partnersQ.isLoading && <SkeletonRows rows={6} />}
      {partnersQ.isError && <ErrorState onRetry={partnersQ.refetch} />}
      {partnersQ.isSuccess && partners.length === 0 && <EmptyState icon={Users} title="No partners yet" />}

      {partnersQ.isSuccess && partners.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Annual sales YTD</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {partners.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)} className="cursor-pointer transition-colors hover:bg-orange-50/40">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{p.profile?.full_name}</p>
                    <p className="text-xs text-ink-soft">{p.company || p.profile?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{p.tier?.name}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink">{formatCurrency(p.annual_sales_ytd)}</td>
                  <td className="px-5 py-3.5"><Badge status={p.status} tone={p.status === 'active' ? 'green' : 'red'} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.profile?.full_name} subtitle={selected?.profile?.email}>
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Phone" value={selected.profile?.phone} />
              <Info label="Company" value={selected.company} />
              <Info label="Country" value={selected.country} />
              <Info label="City" value={selected.city} />
              <Info label="Referral code" value={selected.referral_code} />
              <Info label="Annual sales YTD" value={formatCurrency(selected.annual_sales_ytd)} />
            </div>

            {selected.status === 'suspended' && selected.status_reason && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                <strong>Suspended:</strong> {selected.status_reason}
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Tier</p>
              <Select
                value={selected.tier_id}
                onChange={(e) => updateMutation.mutate({ id: selected.id, payload: { tier_id: e.target.value } })}
              >
                {(tiersQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>

            <div className="flex gap-2">
              {selected.status === 'active' ? (
                <Button variant="danger" icon={Ban} onClick={() => setSuspendOpen(true)}>Suspend partner</Button>
              ) : (
                <Button icon={CheckCircle2} loading={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: selected.id, payload: { status: 'active', status_reason: null } })}>
                  Reactivate partner
                </Button>
              )}
            </div>

            <div className="border-t border-line pt-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-600">
                <Landmark className="h-3.5 w-3.5" /> Territory & exclusivity
              </p>
              <div className="space-y-2">
                {(assignmentsQ.data ?? []).length === 0 && <p className="text-xs text-ink-soft">No territory assigned.</p>}
                {(assignmentsQ.data ?? []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                    <span>{a.territory?.name} <span className="text-xs text-ink-soft">({a.model.replace('_', ' ')})</span></span>
                    <div className="flex items-center gap-2">
                      <Badge tone={a.status === 'active' ? 'green' : 'gray'}>{a.status}</Badge>
                      {a.status === 'active' && (
                        <button onClick={() => revokeMutation.mutate(a.id)} className="text-xs font-semibold text-red-600 hover:underline">Revoke</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Select value={assignTerritory} onChange={(e) => setAssignTerritory(e.target.value)} className="w-auto">
                  <option value="">Select territory</option>
                  {(territoriesQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
                <Select value={assignModel} onChange={(e) => setAssignModel(e.target.value)} className="w-auto">
                  {TERRITORY_MODELS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </Select>
                <Button
                  size="sm"
                  icon={Plus}
                  disabled={!assignTerritory}
                  loading={grantMutation.isPending}
                  onClick={() => grantMutation.mutate({ partner_id: selected.id, territory_id: assignTerritory, model: assignModel })}
                >
                  Grant
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={handleSuspend}
        title="Suspend partner"
        description={`Suspend ${selected?.profile?.full_name}? They'll lose portal access immediately.`}
        confirmLabel="Suspend"
        requireReason
        loading={updateMutation.isPending}
      />
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
