import { AlertTriangle, Inbox, DatabaseZap } from 'lucide-react'
import Button from './Button.jsx'
import { isSupabaseConfigured } from '../../lib/supabase.js'

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-cream/60 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  const notConfigured = !isSupabaseConfigured
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        {notConfigured ? <DatabaseZap className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
      </span>
      <h3 className="mt-4 text-sm font-bold text-ink">
        {notConfigured ? 'Supabase is not connected yet' : 'Something went wrong'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
        {notConfigured
          ? 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, run the migration in supabase/migrations, then restart the dev server.'
          : message || 'Please try again in a moment.'}
      </p>
      {onRetry && !notConfigured && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
