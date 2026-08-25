import { useMemo, useState } from 'react'
import { Share2, Copy, Check, MousePointerClick, Target, Video, FileText, TrendingUp, RefreshCw } from 'lucide-react'
import { PageHeader, Card, CardHeader, StatCard, EmptyState, ErrorState, SkeletonCards } from '../../components/ui/index.js'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatCurrency } from '../../lib/utils.js'

const EVENT_META = {
  click: { label: 'Clicks', icon: MousePointerClick },
  lead: { label: 'Leads', icon: Target },
  demo: { label: 'Demos', icon: Video },
  quotation: { label: 'Quotations', icon: FileText },
  conversion: { label: 'Conversions', icon: TrendingUp },
  renewal: { label: 'Renewals', icon: RefreshCw },
}

export default function Referrals() {
  const { partnerProfile } = useAuth()
  const [copied, setCopied] = useState(false)

  const linkQ = useSupaQuery(
    ['referral_link', partnerProfile?.id],
    (sb) => sb.from('referral_links').select('*').eq('partner_id', partnerProfile.id).maybeSingle(),
    { enabled: Boolean(partnerProfile?.id) }
  )
  const eventsQ = useSupaQuery(
    ['referral_events', linkQ.data?.code],
    (sb) => sb.from('referral_events').select('*').eq('referral_code', linkQ.data.code),
    { enabled: Boolean(linkQ.data?.code) }
  )

  const fullUrl = linkQ.data ? `${window.location.origin}/?ref=${linkQ.data.code}` : ''

  const totals = useMemo(() => {
    const events = eventsQ.data ?? []
    const counts = {}
    let revenue = 0
    events.forEach((e) => {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1
      if (e.event_type === 'conversion') revenue += Number(e.value || 0)
    })
    return { counts, revenue }
  }, [eventsQ.data])

  const copy = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <PageHeader title="Referrals" subtitle="Your unique tracking link and conversion funnel." />

      {linkQ.isLoading && <SkeletonCards count={1} className="sm:grid-cols-1" />}
      {linkQ.isError && <ErrorState onRetry={linkQ.refetch} />}

      {linkQ.isSuccess && !linkQ.data && (
        <EmptyState icon={Share2} title="No referral link yet" description="Your referral link is generated automatically when your partner application is approved. Contact support if this looks wrong." />
      )}

      {linkQ.data && (
        <>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Your referral link</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 truncate rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-sm text-ink">
                {fullUrl}
              </div>
              <button
                onClick={copy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Referral code: <strong className="text-ink">{linkQ.data.code}</strong>
            </p>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(EVENT_META).map(([key, meta]) => (
              <StatCard key={key} label={meta.label} value={totals.counts[key] ?? 0} icon={meta.icon} />
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader title="Conversion revenue" subtitle="Total value attributed to conversion events on your link" />
            <div className="p-5">
              <p className="text-3xl font-black text-orange-600">{formatCurrency(totals.revenue)}</p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
