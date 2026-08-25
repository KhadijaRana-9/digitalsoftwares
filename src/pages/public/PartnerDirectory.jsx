import { useState } from 'react'
import { Search, Users, ShieldCheck, Star, MapPin } from 'lucide-react'
import PublicNavbar from '../../components/layout/PublicNavbar.jsx'
import PublicFooter from '../../components/layout/PublicFooter.jsx'
import { Input, SkeletonCards, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'

export default function PartnerDirectory() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')

  const partnersQ = useSupaQuery(['public_directory'], (sb) =>
    sb.from('partner_directory').select('*').order('is_featured', { ascending: false })
  )

  const partners = partnersQ.data ?? []
  const countries = ['all', ...new Set(partners.map((p) => p.country).filter(Boolean))]
  const filtered = partners.filter((p) => {
    const matchesCountry = country === 'all' || p.country === country
    const matchesSearch = !search || p.company?.toLowerCase().includes(search.toLowerCase()) || p.industry?.toLowerCase().includes(search.toLowerCase())
    return matchesCountry && matchesSearch
  })

  return (
    <div className="min-h-screen bg-cream text-ink antialiased">
      <PublicNavbar />

      <section className="border-b border-line bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Partner Directory
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">Find a Digitalsofts Partner</h1>
          <p className="mt-3 max-w-2xl text-base text-ink-soft">
            Certified resellers and implementation partners near you.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company or industry…" className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {countries.map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    country === c ? 'bg-orange-500 text-white' : 'bg-orange-50 text-ink-soft hover:bg-orange-100'
                  }`}
                >
                  {c === 'all' ? 'All countries' : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        {partnersQ.isLoading && <SkeletonCards count={6} className="sm:grid-cols-2 lg:grid-cols-3" />}
        {partnersQ.isError && <ErrorState onRetry={partnersQ.refetch} />}
        {partnersQ.isSuccess && filtered.length === 0 && (
          <EmptyState icon={Users} title="No partners listed yet" description="Check back soon — our certified partner network is growing." />
        )}
        {partnersQ.isSuccess && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-ink">{p.company || 'Digitalsofts Partner'}</h3>
                  {p.is_featured && <Star className="h-4 w-4 shrink-0 fill-orange-400 text-orange-400" />}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft"><MapPin className="h-3 w-3" /> {[p.city, p.country].filter(Boolean).join(', ') || 'Location on request'}</p>
                {p.public_bio && <p className="mt-3 line-clamp-3 text-sm text-ink-soft">{p.public_bio}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">{p.tier_name}</span>
                  {p.industry && <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink-soft">{p.industry}</span>}
                  {p.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}
