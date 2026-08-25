import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute right-0 top-0 h-full w-full ${width} overflow-y-auto bg-white shadow-2xl`}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <h2 className="text-base font-bold text-ink">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-orange-50 hover:text-orange-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
