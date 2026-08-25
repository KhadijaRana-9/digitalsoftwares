import { motion } from 'framer-motion'
import { cn } from '../../lib/utils.js'

export default function ProgressBar({ value = 0, className, trackClassName, fillClassName }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-orange-100', trackClassName, className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn('h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600', fillClassName)}
      />
    </div>
  )
}
