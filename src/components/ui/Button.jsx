import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const variants = {
  primary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-soft disabled:hover:bg-orange-500',
  dark: 'bg-ink text-white hover:bg-orange-600',
  outline: 'border border-line bg-white text-ink hover:border-orange-300 hover:text-orange-600',
  ghost: 'text-ink-soft hover:bg-orange-50 hover:text-orange-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  subtle: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
}

const Button = forwardRef(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, className, children, icon: Icon, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
