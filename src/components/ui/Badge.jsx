import { cn } from '../../lib/utils.js'
import { STATUS_TONES } from '../../lib/constants.js'

const TONE_CLASSES = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
  orange: 'bg-orange-100 text-orange-700',
}

export default function Badge({ status, tone, children, className }) {
  const resolvedTone = tone || STATUS_TONES[status] || 'gray'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      {children ?? status?.replace(/_/g, ' ')}
    </span>
  )
}
