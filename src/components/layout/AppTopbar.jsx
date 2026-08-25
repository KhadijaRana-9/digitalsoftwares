import { Menu } from 'lucide-react'
import GlobalSearch from './GlobalSearch.jsx'
import NotificationsDropdown from './NotificationsDropdown.jsx'
import ProfileMenu from './ProfileMenu.jsx'

export default function AppTopbar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-base font-bold text-ink sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>
        <NotificationsDropdown />
        <ProfileMenu />
      </div>
    </header>
  )
}
