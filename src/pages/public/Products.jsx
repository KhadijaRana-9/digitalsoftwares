import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package } from 'lucide-react'
import PublicNavbar from '../../components/layout/PublicNavbar.jsx'
import PublicFooter from '../../components/layout/PublicFooter.jsx'
import { Input, SkeletonCards, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatCurrencyCompact } from '../../lib/utils.js'
import { PRODUCT_TYPE_LABELS } from '../../lib/constants.js'

export default function Products() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const categoriesQuery = useSupaQuery(['product_categories'], (sb) =>
    sb.from('product_categories').select('*').order('name')
  )
  const productsQuery = useSupaQuery(['products_public'], (sb) =>
    sb.from('products').select('*, category:product_categories(*)').eq('is_active', true).order('name')
  )

  const filtered = useMemo(() => {
    const list = productsQuery.data ?? []
    return list.filter((p) => {
      const matchesCategory = category === 'all' || p.category_id === category
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [productsQuery.data, category, search])

  return (
    <div className="min-h-screen bg-cream text-ink antialiased">
      <PublicNavbar />

      <section className="border-b border-line bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Product Catalog
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
            {productsQuery.data?.length ?? '32'} confirmed products across 12 industries
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-soft">
            The Phase 1 partner catalog, drawn directly from the Digitalsofts product lineup. Sign in as a partner to see
            wholesale pricing and your commission on every product.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('all')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  category === 'all' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-ink-soft hover:bg-orange-100'
                }`}
              >
                All
              </button>
              {(categoriesQuery.data ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    category === c.id ? 'bg-orange-500 text-white' : 'bg-orange-50 text-ink-soft hover:bg-orange-100'
                  }`}
                >
                  {c.vertical}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        {productsQuery.isLoading && <SkeletonCards count={6} className="sm:grid-cols-2 lg:grid-cols-3" />}
        {productsQuery.isError && <ErrorState onRetry={productsQuery.refetch} />}
        {productsQuery.isSuccess && filtered.length === 0 && (
          <EmptyState icon={Package} title="No products match your search" description="Try a different keyword or category." />
        )}
        {productsQuery.isSuccess && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                    {p.category?.vertical}
                  </span>
                  <span className="text-[11px] font-medium text-ink-soft">{PRODUCT_TYPE_LABELS[p.product_type]}</span>
                </div>
                <h3 className="mt-3 font-bold text-ink group-hover:text-orange-600">{p.name}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-soft">{p.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    {!p.pricing_confirmed && (
                      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">From</p>
                    )}
                    <p className="text-base font-bold text-ink">{formatCurrencyCompact(p.retail_price, p.currency)}<span className="text-xs font-medium text-ink-soft">/yr</span></p>
                  </div>
                  {!p.pricing_confirmed && (
                    <span className="text-[11px] font-medium text-ink-soft">Indicative</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}
