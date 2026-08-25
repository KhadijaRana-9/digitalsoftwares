import { forwardRef } from 'react'
import { cn } from '../../lib/utils.js'

const inputClass =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/50 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 disabled:bg-orange-50/50 disabled:text-ink-soft'

export function Label({ children, required, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
      {children} {required && <span className="text-orange-500">*</span>}
    </label>
  )
}

export const Input = forwardRef(({ className, error, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, error && 'border-red-300 focus:border-red-400 focus:ring-red-500/10', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef(({ className, error, rows = 4, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(inputClass, 'resize-none', error && 'border-red-300', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef(({ className, error, children, ...props }, ref) => (
  <select ref={ref} className={cn(inputClass, 'appearance-none bg-white', error && 'border-red-300', className)} {...props}>
    {children}
  </select>
))
Select.displayName = 'Select'

export function FieldError({ children }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>
}

export function FormField({ label, required, error, htmlFor, children, hint, className }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  )
}
