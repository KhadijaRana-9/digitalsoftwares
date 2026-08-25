import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, UserCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { initials } from '../../lib/utils.js'

export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { profile, signOut, isAdmin } = useAuth()

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 transition-colors hover:border-orange-300"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[11px] font-bold text-white">
          {initials(profile?.full_name || profile?.email || 'DS')}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white shadow-card"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold text-ink">{profile?.full_name || 'Partner'}</p>
              <p className="truncate text-xs text-ink-soft">{profile?.email}</p>
            </div>
            <div className="p-1.5">
              {!isAdmin && (
                <Link
                  to="/partner/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-orange-50 hover:text-orange-700"
                >
                  <UserCircle className="h-4 w-4" /> My profile
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
