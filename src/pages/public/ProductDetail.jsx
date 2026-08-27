import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, ExternalLink, Mail } from 'lucide-react'
import PublicNavbar from '../../components/layout/PublicNavbar.jsx'
import PublicFooter from '../../components/layout/PublicFooter.jsx'
import { Button, Badge, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatCurrency, formatCurrencyCompact } from '../../lib/utils.js'
import { PRODUCT_TYPE_LABELS } from '../../lib/constants.js'

const OPPORTUNITY_COPY = {
  saas: 'Recurring revenue — earn commission every billing cycle for as long as the customer stays active, not just on the first sale.',
  one_time: 'One-time margin — buy at partner pricing and keep the difference, or earn a commission on the collected license fee.',
  service: 'Delivery-linked revenue — earn a share of the engagement while Digitalsofts (or your certified team) handles delivery.',
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-5 last:border-b-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <h3 className="text-sm font-bold uppercase tracking-wide text-orange-600">{title}</h3>
        <ChevronDown className={`h-4 w-4 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const productQuery = useSupaQuery(['product_detail', slug], (sb) =>
    sb.from('products').select('*, category:product_categories(*)').eq('slug', slug).single()
  )
  const relatedQuery = useSupaQuery(
    ['product_related', productQuery.data?.category_id],
    (sb) =>
      sb
        .from('products')
        .select('id, name, slug, retail_price, currency')
        .eq('category_id', productQuery.data.category_id)
        .eq('is_active', true)
        .neq('id', productQuery.data.id)
        .limit(3),
    { enabled: Boolean(productQuery.data?.category_id) }
  )

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-orange-100" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded-lg bg-orange-100" />
        </div>
      </div>
    )
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="min-h-screen bg-cream">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-6 py-24">
          <ErrorState title="Product not found" description="This product may have been renamed or is no longer active." onRetry={() => navigate('/products')} />
        </div>
        <PublicFooter />
      </div>
    )
  }

  const p = productQuery.data
  const related = relatedQuery.data ?? []

  return (
    <div className="min-h-screen bg-cream text-ink antialiased">
      <PublicNavbar />

      <section className="border-b border-line bg-white py-14">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-orange-600">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to products
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{p.category?.vertical}</span>
            <span className="text-xs font-medium text-ink-soft">{PRODUCT_TYPE_LABELS[p.product_type]}</span>
            {!p.pricing_confirmed && <Badge tone="amber">Indicative pricing</Badge>}
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{p.name}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{p.description}</p>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              {!p.pricing_confirmed && (
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Starting from</p>
              )}
              <p className="text-2xl font-black text-ink">
                {formatCurrency(p.retail_price, p.currency)}<span className="text-sm font-medium text-ink-soft">/yr</span>
              </p>
            </div>
            {p.source_url && (
              <a href={p.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline">
                View on digitalsofts.com <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {!p.pricing_confirmed && (
            <p className="mt-2 text-xs text-ink-soft">Final pricing is confirmed with Digitalsofts during partner onboarding.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Overview">
              <p className="text-sm leading-relaxed text-ink-soft">{p.description}</p>
            </Section>

            {p.features?.length > 0 && (
              <Section title="Key features">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /> {f}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Industry & use case">
              <p className="text-sm leading-relaxed text-ink-soft">
                Built for the <strong className="text-ink">{p.category?.vertical}</strong> vertical
                {p.category?.description ? ` — ${p.category.description}` : '.'}
              </p>
            </Section>

            <Section title="Partner opportunity" defaultOpen={false}>
              <p className="text-sm leading-relaxed text-ink-soft">{OPPORTUNITY_COPY[p.product_type]}</p>
            </Section>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h4 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Get involved</h4>
              <div className="mt-4 space-y-2.5">
                <Button className="w-full" icon={ArrowUpRight} onClick={() => navigate('/apply')}>
                  Become a Partner
                </Button>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">Refer a Customer</Button>
                </Link>
                <a href="mailto:sales@digitalsofts.com" className="block">
                  <Button variant="outline" className="w-full" icon={Mail}>Talk to Sales</Button>
                </a>
              </div>
              <p className="mt-3 text-xs text-ink-soft">Partner pricing and commission % are visible after login.</p>
            </div>

            {related.length > 0 && (
              <div className="rounded-2xl border border-line bg-white p-5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Related products</h4>
                <div className="mt-3 space-y-2">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      to={`/products/${r.slug}`}
                      className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5 text-sm transition-colors hover:border-orange-300 hover:bg-orange-50/50"
                    >
                      <span className="font-medium text-ink">{r.name}</span>
                      <span className="text-xs text-ink-soft">{formatCurrencyCompact(r.retail_price, r.currency)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
