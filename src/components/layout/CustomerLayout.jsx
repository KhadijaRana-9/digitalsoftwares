import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppSidebar from './AppSidebar.jsx'
import AppTopbar from './AppTopbar.jsx'
import { customerNav } from '../../lib/nav.js'

export default function CustomerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const current = customerNav.find((n) => location.pathname.startsWith(n.to))

  return (
    <div className="flex min-h-screen bg-cream">
      <AppSidebar items={customerNav} label="Customer Portal" mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppTopbar title={current?.label ?? 'Dashboard'} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
