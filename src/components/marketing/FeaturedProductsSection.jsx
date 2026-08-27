import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Package } from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatCurrencyCompact } from '../../lib/utils.js'
import { PRODUCT_TYPE_LABELS } from '../../lib/constants.js'

export default function FeaturedProductsSection() {
  const productsQuery = useSupaQuery(['products_featured_home'], (sb) =>
    sb.from('products').select('*, category:product_categories(*)').eq('is_active', true).order('name')
  )

  // One representative product per category, up to 8 — real diversity across
  // the actual catalog rather than an arbitrary/fabricated "featured" flag.
  const featured = useMemo(() => {
    const list = productsQuery.data ?? []
    const seen = new Set()
    const picked = []
    for (const p of list) {
      if (seen.has(p.category_id)) continue
      seen.add(p.category_id)
      picked.push(p)
      if (picked.length === 8) break
    }
    return picked
  }, [productsQuery.data])

  if (productsQuery.isLoading || featured.length === 0) return null

  return (
    <section id="solutions" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Product Catalog"
          title="Real Digitalsofts solutions, ready to sell"
          subtitle={`${productsQuery.data?.length ?? ''} products across 12 industries — from retail and hospitality to oil & gas and manufacturing.`}
        />

        <Reveal delay={0.1} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
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
              <h3 className="mt-3 line-clamp-1 font-bold text-ink group-hover:text-orange-600">{p.name}</h3>
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-soft">{p.description}</p>
              <p className="mt-3 text-sm font-bold text-ink">
                {!p.pricing_confirmed && <span className="font-normal text-ink-soft">From </span>}
                {formatCurrencyCompact(p.retail_price, p.currency)}
                <span className="text-xs font-medium text-ink-soft">/yr</span>
              </p>
            </Link>
          ))}
        </Reveal>

        <Reveal delay={0.2} className="mt-8 flex justify-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition-all hover:border-orange-300 hover:text-orange-600"
          >
            <Package className="h-4 w-4" /> Browse the full catalog
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
