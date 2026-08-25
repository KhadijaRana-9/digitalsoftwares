import { motion } from 'framer-motion'
import { cn } from '../../lib/utils.js'

export default function StatCard({ label, value, icon: Icon, trend, trendLabel, onClick, accent = false }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col rounded-2xl border border-line bg-white p-5 text-left transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              accent ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-500'
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <motion.p
        key={String(value)}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-3 text-2xl font-black text-ink"
      >
        {value}
      </motion.p>
      {trendLabel && <p className="mt-1 text-xs text-ink-soft">{trendLabel}</p>}
    </Tag>
  )
}
