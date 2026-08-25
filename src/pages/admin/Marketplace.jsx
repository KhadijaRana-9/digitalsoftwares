import { useState } from 'react'
import { Store, Search, Star, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { PageHeader, Input, Badge, Button, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function Marketplace() {
  const toast = useToast()
  const [search, setSearch] = useState('')

  const partnersQ = useSupaQuery(['marketplace_partners'], (sb) =>
    sb.from('partner_profiles').select('*, profile:profiles(full_name, email), tier:partner_tiers(name)').eq('status', 'active').order('company')
  )

  const updateMutation = useSupaMutation(
    (sb, { id, payload }) => sb.from('partner_profiles').update(payload).eq('id', id).select().single(),
    { invalidate: [['marketplace_partners']], onSuccess: () => toast.success('Updated.'), onError: (e) => toast.error(e.message) }
  )

  const partners = (partnersQ.data ?? []).filter(
    (p) => !search || p.company?.toLowerCase().includes(search.toLowerCase()) || p.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Partner Marketplace" subtitle='Control who appears in the public "Find a Partner" directory.' />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners…" className="pl-10" />
      </div>

      {partnersQ.isLoading && <SkeletonRows rows={5} />}
      {partnersQ.isError && <ErrorState onRetry={partnersQ.refetch} />}
      {partnersQ.isSuccess && partners.length === 0 && <EmptyState icon={Store} title="No active partners yet" />}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-5 py-3">Partner</th>
              <th className="px-5 py-3">Tier</th>
              <th className="px-5 py-3">Public</th>
              <th className="px-5 py-3">Featured</th>
              <th className="px-5 py-3">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {partners.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{p.company || p.profile?.full_name}</p>
                  <p className="text-xs text-ink-soft">{p.country}{p.city ? `, ${p.city}` : ''}</p>
                </td>
                <td className="px-5 py-3.5 text-ink-soft">{p.tier?.name}</td>
                <td className="px-5 py-3.5">
                  <Button
                    size="sm"
                    variant={p.is_public ? 'subtle' : 'outline'}
                    icon={p.is_public ? Eye : EyeOff}
                    loading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: p.id, payload: { is_public: !p.is_public } })}
                  >
                    {p.is_public ? 'Listed' : 'Hidden'}
                  </Button>
                </td>
                <td className="px-5 py-3.5">
                  <Button
                    size="sm"
                    variant={p.is_featured ? 'subtle' : 'ghost'}
                    icon={Star}
                    loading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: p.id, payload: { is_featured: !p.is_featured } })}
                  >
                    {p.is_featured ? 'Featured' : 'Feature'}
                  </Button>
                </td>
                <td className="px-5 py-3.5">
                  <Button
                    size="sm"
                    variant={p.is_verified ? 'subtle' : 'ghost'}
                    icon={ShieldCheck}
                    loading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: p.id, payload: { is_verified: !p.is_verified } })}
                  >
                    {p.is_verified ? 'Verified' : 'Verify'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
