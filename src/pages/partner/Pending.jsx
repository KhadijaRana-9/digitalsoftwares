import { useNavigate } from 'react-router-dom'
import { Clock, LogOut, RefreshCcw, Ban } from 'lucide-react'
import { useSupaQuery } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button, Badge, ErrorState } from '../../components/ui/index.js'
import { APPLICATION_STATUS_LABELS } from '../../lib/constants.js'
import { formatDate } from '../../lib/utils.js'

export default function Pending() {
  const { user, signOut, isApprovedPartner, isSuspendedPartner, partnerProfile } = useAuth()
  const navigate = useNavigate()

  const { data: application, isLoading, isError, refetch } = useSupaQuery(
    ['my_application', user?.id],
    (sb) => sb.from('partner_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    { enabled: Boolean(user?.id) && !isSuspendedPartner }
  )

  if (isApprovedPartner) {
    navigate('/partner/dashboard', { replace: true })
    return null
  }

  if (isSuspendedPartner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-card sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Ban className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-xl font-black text-ink">Your partner account is suspended</h1>
          {partnerProfile?.status_reason && (
            <p className="mt-3 rounded-xl bg-cream p-3 text-left text-sm text-ink-soft">
              <strong className="text-ink">Reason:</strong> {partnerProfile.status_reason}
            </p>
          )}
          <p className="mt-4 text-sm text-ink-soft">
            Contact your Digitalsofts partner manager if you believe this is a mistake.
          </p>
          <Button variant="ghost" icon={LogOut} className="mt-6" onClick={() => signOut().then(() => navigate('/login'))}>
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-card sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <Clock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-black text-ink">Your application is under review</h1>

        {isLoading && <p className="mt-3 text-sm text-ink-soft">Loading your application…</p>}
        {isError && <ErrorState onRetry={refetch} />}

        {application && (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              Reference <strong className="text-ink">{application.reference_code}</strong>, submitted{' '}
              {formatDate(application.created_at)}.
            </p>
            <div className="mt-4 flex justify-center">
              <Badge status={application.status}>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
            </div>
            {application.review_notes && (
              <p className="mt-4 rounded-xl bg-cream p-3 text-left text-sm text-ink-soft">
                <strong className="text-ink">Reviewer note:</strong> {application.review_notes}
              </p>
            )}
          </>
        )}

        {!isLoading && !application && !isError && (
          <p className="mt-3 text-sm text-ink-soft">
            We couldn't find an application on this account yet. If you just signed up, try refreshing in a moment.
          </p>
        )}

        <p className="mt-5 text-xs text-ink-soft">
          Most applications are reviewed within 48 hours. You'll get a notification the moment a decision is made.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" icon={RefreshCcw} onClick={() => refetch()}>
            Refresh status
          </Button>
          <Button variant="ghost" icon={LogOut} onClick={() => signOut().then(() => navigate('/login'))}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
