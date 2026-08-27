import { useMemo, useState } from 'react'
import { Search, Package, Check, ExternalLink } from 'lucide-react'
import { PageHeader, Input, Drawer, Button, Badge, SkeletonCards, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency } from '../../lib/utils.js'
import { PRODUCT_TYPE_LABELS } from '../../lib/constants.js'

export default function PartnerProducts() {
  const { partnerProfile } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(null)

  const categoriesQ = useSupaQuery(['product_categories'], (sb) => sb.from('product_categories').select('*').order('name'))
  const productsQ = useSupaQuery(
    ['partner_products', partnerProfile?.tier_id],
    (sb) =>
      sb
        .from('products')
        .select('*, category:product_categories(*), pricing:product_pricing(partner_price, commission_percent, recurring_commission_percent, tier_id)')
        .eq('is_active', true)
        .order('name'),
    { enabled: Boolean(partnerProfile?.tier_id) }
  )

  const withPricing = useMemo(() => {
    return (productsQ.data ?? []).map((p) => {
      const pricing = p.pricing?.find((pr) => pr.tier_id === partnerProfile?.tier_id)
      const isSaas = p.product_type === 'saas'
      // SaaS: partner sells at the same price and earns a recurring % commission —
      // there's no wholesale discount, so "margin" is the commission payout, not
      // retail-minus-partner-price (which would always compute to zero here).
      const estimatedEarnings = pricing
        ? isSaas
          ? Math.round((pricing.partner_price * pricing.commission_percent) / 100)
          : p.retail_price - pricing.partner_price
        : 0
      const marginPct = isSaas ? pricing?.commission_percent ?? 0 : pricing?.partner_price ? Math.round((estimatedEarnings / p.retail_price) * 100) : 0
      return { ...p, myPricing: pricing, isSaas, estimatedEarnings, marginPct }
    })
  }, [productsQ.data, partnerProfile])

  const filtered = withPricing.filter((p) => {
    const matchesCategory = category === 'all' || p.category_id === category
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div>
      <PageHeader title="Products & Pricing" subtitle={`Your product catalog and commission rates as a ${partnerProfile?.tier?.name ?? 'partner'}.`} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>All</FilterChip>
          {(categoriesQ.data ?? []).map((c) => (
            <FilterChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.vertical}</FilterChip>
          ))}
        </div>
      </div>

      {productsQ.isLoading && <SkeletonCards count={6} className="sm:grid-cols-2 lg:grid-cols-3" />}
      {productsQ.isError && <ErrorState onRetry={productsQ.refetch} />}
      {productsQ.isSuccess && filtered.length === 0 && <EmptyState icon={Package} title="No products found" />}

      {productsQ.isSuccess && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="flex flex-col rounded-2xl border border-line bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">{p.category?.vertical}</span>
                <span className="text-[11px] font-medium text-ink-soft">{PRODUCT_TYPE_LABELS[p.product_type]}</span>
              </div>
              <h3 className="mt-3 font-bold text-ink">{p.name}</h3>
              {!p.pricing_confirmed && <Badge tone="amber" className="mt-2 w-fit">Indicative pricing</Badge>}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-ink-soft">{p.isSaas ? 'Price / yr' : 'Your price'}</p>
                  <p className="text-lg font-black text-ink">{formatCurrency(p.myPricing?.partner_price, p.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase text-ink-soft">Commission</p>
                  <p className="text-lg font-black text-orange-600">{p.myPricing?.commission_percent ?? '—'}%</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name} subtitle={selected?.category?.vertical}>
        {selected && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-ink-soft">{selected.description}</p>

            {selected.features?.length > 0 && (
              <ul className="space-y-2">
                {selected.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /> {f}
                  </li>
                ))}
              </ul>
            )}

            {!selected.pricing_confirmed && (
              <Badge tone="amber">Indicative pricing — confirmed with Digitalsofts before contract</Badge>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-cream p-4">
                <p className="text-xs font-semibold uppercase text-ink-soft">{selected.isSaas ? 'Price / yr' : 'Retail price'}</p>
                <p className="mt-1 text-xl font-black text-ink">{formatCurrency(selected.retail_price, selected.currency)}</p>
              </div>
              <div className="rounded-xl bg-cream p-4">
                <p className="text-xs font-semibold uppercase text-ink-soft">{selected.isSaas ? 'Your commission' : 'Your price'}</p>
                <p className="mt-1 text-xl font-black text-ink">
                  {selected.isSaas ? `${selected.myPricing?.commission_percent ?? '—'}%` : formatCurrency(selected.myPricing?.partner_price, selected.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase text-orange-700">{selected.isSaas ? 'Est. earnings / yr' : 'Your margin'}</p>
                <p className="mt-1 text-xl font-black text-orange-700">{formatCurrency(selected.estimatedEarnings, selected.currency)}</p>
              </div>
              <div className="rounded-xl bg-orange-500 p-4 text-white">
                <p className="text-xs font-semibold uppercase text-orange-100">{selected.isSaas ? 'Recurring' : 'Margin %'}</p>
                <p className="mt-1 text-xl font-black">{selected.isSaas ? 'Every renewal' : `${selected.marginPct}%`}</p>
              </div>
            </div>

            {selected.isSaas && (
              <p className="text-xs text-ink-soft">
                Commission pays out every cycle the customer stays active — the earnings estimate above is per year, at{' '}
                <strong className="text-ink">{selected.myPricing?.commission_percent ?? '—'}%</strong> of the annual price.
              </p>
            )}

            {selected.source_url && (
              <a
                href={selected.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline"
              >
                View product page on digitalsofts.com <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => window.location.assign('/partner/leads')}>Add as a lead</Button>
              <Button variant="outline" className="flex-1" onClick={() => window.location.assign('/partner/assets')}>Sales assets</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
        active ? 'bg-orange-500 text-white' : 'bg-orange-50 text-ink-soft hover:bg-orange-100'
      }`}
    >
      {children}
    </button>
  )
}
