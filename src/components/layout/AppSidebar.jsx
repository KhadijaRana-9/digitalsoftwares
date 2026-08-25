import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils.js'

export default function AppSidebar({ items, groups, label, roleBadge, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-line bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-black text-white">
            DS
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-bold text-ink">Digitalsofts</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-orange-500">{label}</p>
          </div>
        </div>

        {roleBadge && (
          <div className="border-b border-line px-5 py-2.5">
            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
              {roleBadge}
            </span>
          </div>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {groups
            ? groups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItem key={item.to} item={item} onClose={onClose} />
                    ))}
                  </div>
                </div>
              ))
            : items.map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
        </nav>

        <div className="border-t border-line p-4">
          <a
            href="/"
            className="block rounded-xl bg-orange-50 px-3 py-2.5 text-center text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100"
          >
            ← Back to website
          </a>
        </div>
      </aside>
    </>
  )
}

function NavItem({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-orange-500 text-white shadow-soft'
            : 'text-ink-soft hover:bg-orange-50 hover:text-orange-700'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </NavLink>
  )
}
