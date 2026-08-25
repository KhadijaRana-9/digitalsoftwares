import { Link } from 'react-router-dom'

export default function AuthShell({ title, subtitle, children, width = 'max-w-md' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <div className={`relative w-full ${width}`}>
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black text-white shadow-soft">
            DS
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Digitalsofts <span className="text-orange-500">Partner Network</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
          <h1 className="text-xl font-black text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
