import { cn } from '../../lib/utils.js'

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition-all',
            active === t.value
              ? 'bg-orange-500 text-white shadow-soft'
              : 'bg-orange-50 text-ink-soft hover:bg-orange-100 hover:text-orange-700'
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className={cn('ml-1.5', active === t.value ? 'text-orange-100' : 'text-ink-soft/70')}>
              ({t.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
