import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }
const TONES = {
  success: 'border-green-200 bg-green-50 text-green-800 [&_svg]:text-green-500',
  error: 'border-red-200 bg-red-50 text-red-800 [&_svg]:text-red-500',
  info: 'border-orange-200 bg-orange-50 text-orange-800 [&_svg]:text-orange-500',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (message, { type = 'info', duration = 4500 } = {}) => {
      const id = crypto.randomUUID()
      setToasts((t) => [...t, { id, message, type }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const toast = {
    success: (msg, opts) => push(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => push(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => push(msg, { ...opts, type: 'info' }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-card ${TONES[t.type]}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
