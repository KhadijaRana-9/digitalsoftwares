import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { publicNav } from '../../lib/nav.js'

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { session, homePath } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-cream/85 backdrop-blur-lg shadow-[0_1px_0_0_var(--color-line)]' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black text-white shadow-soft">
            DS
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Digitalsofts <span className="text-orange-500">Partner Network</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {publicNav.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-orange-600"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <Link
              to={homePath}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-orange-600 hover:shadow-lg"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink-soft transition-colors hover:text-orange-600">
                Login
              </Link>
              <Link
                to="/apply"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-orange-600 hover:shadow-lg"
              >
                Become a Partner
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-line bg-cream lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {publicNav.map((l) => (
                <a
                  key={l.to}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-orange-50 hover:text-orange-600"
                >
                  {l.label}
                </a>
              ))}
              {session ? (
                <Link
                  to={homePath}
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-orange-50 hover:text-orange-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/apply"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white"
                  >
                    Become a Partner
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
