import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppSidebar from './AppSidebar.jsx'
import AppTopbar from './AppTopbar.jsx'
import { adminNav, adminNavGroups } from '../../lib/nav.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const { isSuperAdmin, hasPermission, adminRoleName } = useAuth()

  // ProtectedRoute redirects here with this state when a permission gate
  // blocks a route — without this, that redirect is silent and reads as a
  // broken link rather than an explained "you don't have access" bounce.
  // Depend on the primitive value alone, not `location.state`/`toast`/
  // `navigate` themselves — those are new object/function references on
  // renders unrelated to this, which turned this into an infinite loop.
  const deniedPermission = location.state?.deniedPermission
  useEffect(() => {
    if (!deniedPermission) return
    toast.error("You don't have permission to view that page.")
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deniedPermission])

  const visibleGroups = useMemo(() => {
    return adminNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.superAdminOnly) return isSuperAdmin
          if (item.permission) return hasPermission(item.permission)
          return true
        }),
      }))
      .filter((group) => group.items.length > 0)
  }, [isSuperAdmin, hasPermission])

  const current = adminNav.find((n) => location.pathname.startsWith(n.to))

  return (
    <div className="flex min-h-screen bg-cream">
      <AppSidebar
        groups={visibleGroups}
        label="Admin Console"
        roleBadge={isSuperAdmin ? 'Super Admin' : adminRoleName ?? 'Staff'}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppTopbar title={current?.label ?? 'Dashboard'} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
