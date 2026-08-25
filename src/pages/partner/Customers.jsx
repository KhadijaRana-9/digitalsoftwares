import { useState } from 'react'
import { Users, Search } from 'lucide-react'
import { PageHeader, Input, Drawer, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency, formatDate } from '../../lib/utils.js'

export default function Customers() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const customersQ = useSupaQuery(
    ['customers', user?.id],
    (sb) => sb.from('customers').select('*').eq('partner_id', user.id).order('created_at', { ascending: false }),
    { enabled: Boolean(user?.id) }
  )
  const productsQ = useSupaQuery(
    ['customer_products', selected?.id],
    (sb) => sb.from('customer_products').select('*, product:products(name)').eq('customer_id', selected.id),
    { enabled: Boolean(selected?.id) }
  )

  const customers = (customersQ.data ?? []).filter((c) => !search || c.company_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Customers" subtitle="Accounts created once your registered deals close as won." />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" className="pl-10" />
      </div>

      {customersQ.isLoading && <SkeletonRows rows={5} />}
      {customersQ.isError && <ErrorState onRetry={customersQ.refetch} />}
      {customersQ.isSuccess && customers.length === 0 && (
        <EmptyState icon={Users} title="No customers yet" description="Once a registered deal is marked won, the customer appears here automatically." />
      )}

      {customersQ.isSuccess && customers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Industry</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer transition-colors hover:bg-orange-50/50">
                  <td className="px-5 py-3.5 font-medium text-ink">{c.company_name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{c.contact_name || '—'}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{c.industry || '—'}</td>
                  <td className="px-5 py-3.5"><Badge status={c.account_status} tone={c.account_status === 'active' ? 'green' : 'gray'} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.company_name} subtitle="Customer detail">
        {selected && (
          <div className="space-y-5">
            <Badge status={selected.account_status} tone={selected.account_status === 'active' ? 'green' : 'gray'} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Contact" value={selected.contact_name} />
              <Info label="Email" value={selected.contact_email} />
              <Info label="Phone" value={selected.contact_phone} />
              <Info label="Industry" value={selected.industry} />
              <Info label="Country" value={selected.country} />
              <Info label="Customer since" value={formatDate(selected.created_at)} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-orange-600">Products purchased</h4>
              <div className="mt-3 space-y-2">
                {(productsQ.data ?? []).length === 0 && <p className="text-xs text-ink-soft">No products recorded yet.</p>}
                {(productsQ.data ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
                    <span className="font-medium text-ink">{p.product?.name}</span>
                    <span className="text-ink-soft">{formatCurrency(p.revenue)}</span>
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
