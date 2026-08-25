import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, Loader2, Package, Target, Users, GitBranch, FolderOpen, GraduationCap,
  Handshake, Wallet, LifeBuoy, ClipboardList,
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'

const PARTNER_SECTIONS = [
  { table: 'products', icon: Package, label: 'Products', column: 'name', to: (r) => `/products#${r.slug}` },
  { table: 'leads', icon: Target, label: 'Leads', column: 'company_name', to: () => '/partner/leads' },
  { table: 'customers', icon: Users, label: 'Customers', column: 'company_name', to: () => '/partner/customers' },
  { table: 'opportunities', icon: GitBranch, label: 'Opportunities', column: 'name', to: () => '/partner/opportunities' },
  { table: 'assets', icon: FolderOpen, label: 'Assets', column: 'title', to: () => '/partner/assets' },
  { table: 'courses', icon: GraduationCap, label: 'Academy', column: 'title', to: () => '/partner/academy' },
]

const STAFF_SECTIONS = [
  { table: 'products', icon: Package, label: 'Products', column: 'name', to: () => '/admin/products' },
  { table: 'partner_applications', icon: ClipboardList, label: 'Applications', column: 'full_name', to: () => '/admin/applications' },
  { table: 'deal_registrations', icon: Handshake, label: 'Deals', column: 'customer_company', to: () => '/admin/deals' },
  { table: 'support_tickets', icon: LifeBuoy, label: 'Support Tickets', column: 'subject', to: () => '/admin/support' },
  { table: 'payouts', icon: Wallet, label: 'Payouts', column: 'reference_code', to: () => '/admin/payouts' },
]

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { session, isStaff } = useAuth()

  const sections = isStaff ? [...STAFF_SECTIONS, PARTNER_SECTIONS[0]] : PARTNER_SECTIONS

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!term.trim() || !session) {
      setResults([])
      return
    }
    setLoading(true)
    const timeout = setTimeout(async () => {
      const settled = await Promise.all(
        sections.map(async (s) => {
          const { data } = await supabase.from(s.table).select('*').ilike(s.column, `%${term}%`).limit(4)
          return { ...s, items: data ?? [] }
        })
      )
      setResults(settled.filter((s) => s.items.length > 0))
      setLoading(false)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300)
    return () => clearTimeout(timeout)
  }, [term, session, isStaff])

  const go = (section, item) => {
    setOpen(false)
    setTerm('')
    navigate(section.to(item))
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-orange-300"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border border-line bg-cream px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
          Ctrl K
        </kbd>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-24">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-card"
              >
                <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                  <Search className="h-4 w-4 text-ink-soft" />
                  <input
                    ref={inputRef}
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={isStaff ? 'Search partners, deals, applications, tickets…' : 'Search products, leads, customers, assets…'}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/50"
                  />
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {!term && <p className="px-3 py-8 text-center text-xs text-ink-soft">Type to search across the portal.</p>}
                  {term && !loading && results.length === 0 && (
                    <p className="px-3 py-8 text-center text-xs text-ink-soft">No results for "{term}".</p>
                  )}
                  {results.map((section) => (
                    <div key={section.table} className="mb-2">
                      <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                        {section.label}
                      </p>
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => go(section, item)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-orange-50"
                        >
                          <section.icon className="h-3.5 w-3.5 text-orange-500" />
                          {item[section.column]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
