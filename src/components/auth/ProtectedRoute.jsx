import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
    </div>
  )
}

// role="admin" covers both 'admin' and 'super_admin' — super_admin is a
// superset of admin access, never a separate silo. permission="x.y" adds a
// further gate for a specific route within the admin area (e.g. Audit Logs
// requires 'audit.view'); super_admin always passes.
export function ProtectedRoute({ role, permission }) {
  const { session, loading, isPartner, isStaff, isCustomer, isApprovedPartner, hasPermission, homePath } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role === 'partner' && !isPartner) {
    return <Navigate to={homePath} replace />
  }
  if (role === 'admin' && !isStaff) {
    return <Navigate to={homePath} replace />
  }
  if (role === 'customer' && !isCustomer) {
    return <Navigate to={homePath} replace />
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/admin/dashboard" replace state={{ deniedPermission: permission }} />
  }

  const pendingAllowed = ['/partner/pending', '/partner/profile']
  if (role === 'partner' && !isApprovedPartner && !pendingAllowed.includes(location.pathname)) {
    return <Navigate to="/partner/pending" replace />
  }

  return <Outlet />
}

export function GuestRoute({ children }) {
  const { session, loading, homePath } = useAuth()
  if (loading) return <FullScreenLoader />
  if (session) {
    return <Navigate to={homePath} replace />
  }
  return children
}
