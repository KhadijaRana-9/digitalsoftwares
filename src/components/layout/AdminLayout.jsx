import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppSidebar from './AppSidebar.jsx'
import AppTopbar from './AppTopbar.jsx'
import { adminNav, adminNavGroups } from '../../lib/nav.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { isSuperAdmin, hasPermission, adminRoleName } = useAuth()

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
