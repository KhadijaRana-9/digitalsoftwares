import { cn } from '../../lib/utils.js'

export default function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('rounded-2xl border border-line bg-white', className)} {...props}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
