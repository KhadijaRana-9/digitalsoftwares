import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications.js'
import { timeAgo, cn } from '../../lib/utils.js'

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications()

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-orange-300 hover:text-orange-600"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-card"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-bold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading && <p className="px-4 py-6 text-center text-xs text-ink-soft">Loading…</p>}
              {!isLoading && notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-ink-soft">You're all caught up.</p>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'block border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-orange-50/60',
                    !n.is_read && 'bg-orange-50/40'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />}
                    <div className={cn(n.is_read && 'pl-3.5')}>
                      <p className="text-xs font-semibold text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{n.message}</p>
                      <p className="mt-1 text-[11px] text-ink-soft/70">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
