import { useMemo, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { PageHeader, Input, Select, Drawer, Badge, SkeletonRows, EmptyState, ErrorState, Pagination } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { formatDateTime, titleCase } from '../../lib/utils.js'

const PAGE_SIZE = 15

export default function AuditLogs() {
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  const logsQ = useSupaQuery(['audit_logs'], (sb) =>
    sb.from('audit_logs').select('*, actor:profiles(full_name, email)').order('created_at', { ascending: false }).limit(500)
  )

  const logs = logsQ.data ?? []
  const entityTypes = ['all', ...new Set(logs.map((l) => l.entity_type))]

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchesType = entityType === 'all' || l.entity_type === entityType
      const matchesSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.actor?.full_name?.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [logs, entityType, search])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every sensitive change, recorded automatically — never editable, never deleted." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search action or actor…" className="pl-10" />
        </div>
        <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1) }} className="w-auto">
          {entityTypes.map((t) => <option key={t} value={t}>{t === 'all' ? 'All entities' : t}</option>)}
        </Select>
      </div>

      {logsQ.isLoading && <SkeletonRows rows={8} />}
      {logsQ.isError && <ErrorState onRetry={logsQ.refetch} />}
      {logsQ.isSuccess && filtered.length === 0 && <EmptyState icon={ScrollText} title="No audit events match" />}

      {logsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paged.map((l) => (
                <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer transition-colors hover:bg-orange-50/40">
                  <td className="px-5 py-3.5 font-medium text-ink">{titleCase(l.action)}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{l.entity_type}</td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {l.actor?.full_name ?? 'System'} {l.actor_role && <Badge tone="gray" className="ml-1.5">{titleCase(l.actor_role)}</Badge>}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.action ? titleCase(selected.action) : ''} subtitle={selected ? formatDateTime(selected.created_at) : ''}>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Entity" value={selected.entity_type} />
              <Info label="Entity ID" value={selected.entity_id} />
              <Info label="Actor" value={selected.actor?.full_name} />
              <Info label="Role" value={selected.actor_role} />
            </div>
            {selected.reason && (
              <div className="rounded-xl bg-orange-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Reason</p>
                <p className="mt-1 text-sm text-ink-soft">{selected.reason}</p>
              </div>
            )}
            {selected.before && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Before</p>
                <pre className="mt-1 overflow-x-auto rounded-xl bg-cream p-3 text-[11px] text-ink-soft">{JSON.stringify(selected.before, null, 2)}</pre>
              </div>
            )}
            {selected.after && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">After</p>
                <pre className="mt-1 overflow-x-auto rounded-xl bg-cream p-3 text-[11px] text-ink-soft">{JSON.stringify(selected.after, null, 2)}</pre>
              </div>
            )}
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
      <p className="mt-0.5 break-all text-ink">{value || '—'}</p>
    </div>
  )
}
