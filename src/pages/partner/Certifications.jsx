import { Award, ShieldCheck, Wrench, GraduationCap } from 'lucide-react'
import { PageHeader, Badge, SkeletonCards, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../lib/utils.js'
import { CERTIFICATION_TYPES, CERTIFICATION_TYPE_LABELS } from '../../lib/constants.js'

const ICONS = { sales: ShieldCheck, implementation: Wrench, technical: GraduationCap }

export default function Certifications() {
  const { user } = useAuth()

  const certsQ = useSupaQuery(
    ['certifications', user?.id],
    (sb) => sb.from('certifications').select('*').eq('partner_id', user.id),
    { enabled: Boolean(user?.id) }
  )

  const byType = Object.fromEntries((certsQ.data ?? []).map((c) => [c.type, c]))

  return (
    <div>
      <PageHeader title="Certifications" subtitle="Awarded automatically once you complete every lesson in a track." />

      {certsQ.isLoading && <SkeletonCards count={3} className="sm:grid-cols-3" />}
      {certsQ.isError && <ErrorState onRetry={certsQ.refetch} />}

      <div className="grid gap-4 sm:grid-cols-3">
        {CERTIFICATION_TYPES.map((type) => {
          const cert = byType[type]
          const Icon = ICONS[type]
          const completed = cert?.status === 'completed'
          return (
            <div
              key={type}
              className={`flex flex-col rounded-2xl border p-6 ${completed ? 'border-orange-300 bg-orange-50/50' : 'border-line bg-white'}`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${completed ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-ink">{CERTIFICATION_TYPE_LABELS[type]}</h3>
              <div className="mt-3">
                <Badge status={completed ? 'completed' : 'in_progress'} tone={completed ? 'green' : 'amber'}>
                  {completed ? 'Completed' : 'In progress'}
                </Badge>
              </div>
              {completed && (
                <p className="mt-3 text-xs text-ink-soft">Completed {formatDate(cert.completed_at)}</p>
              )}
              {!completed && (
                <p className="mt-3 text-xs text-ink-soft">Complete every lesson in the matching Academy track to earn this certification.</p>
              )}
            </div>
          )
        })}
      </div>

      {certsQ.isSuccess && (certsQ.data ?? []).length === 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <Award className="h-4 w-4" /> Head to the Academy to start earning your first certification.
        </div>
      )}
    </div>
  )
}
