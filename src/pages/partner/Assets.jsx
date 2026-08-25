import { useState } from 'react'
import { Search, FolderOpen, Download, FileText } from 'lucide-react'
import { PageHeader, Input, SkeletonCards, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Assets() {
  const { partnerProfile } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const assetsQ = useSupaQuery(['assets'], (sb) => sb.from('assets').select('*').order('created_at', { ascending: false }))

  const myTierKey = partnerProfile?.tier?.key
  const visible = (assetsQ.data ?? []).filter((a) => !a.tier_restriction?.length || a.tier_restriction.includes(myTierKey))
  const categories = ['all', ...new Set(visible.map((a) => a.category))]
  const filtered = visible.filter((a) => {
    const matchesCategory = category === 'all' || a.category === category
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div>
      <PageHeader title="Sales & Marketing Assets" subtitle="Brochures, decks, case studies and templates ready to send." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…" className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                category === c ? 'bg-orange-500 text-white' : 'bg-orange-50 text-ink-soft hover:bg-orange-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {assetsQ.isLoading && <SkeletonCards count={6} className="sm:grid-cols-2 lg:grid-cols-3" />}
      {assetsQ.isError && <ErrorState onRetry={assetsQ.refetch} />}
      {assetsQ.isSuccess && filtered.length === 0 && (
        <EmptyState icon={FolderOpen} title="No assets available yet" description="Your Digitalsofts admin can upload brochures, decks and templates from the admin console." />
      )}

      {assetsQ.isSuccess && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <a
              key={a.id}
              href={a.file_url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white">
                <FileText className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold text-ink">{a.title}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-soft">{a.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                <Download className="h-3.5 w-3.5" /> View / Download
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
