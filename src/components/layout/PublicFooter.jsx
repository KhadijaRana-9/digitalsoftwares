import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Program',
    links: [
      { label: 'Affiliate', href: '/#tiers' },
      { label: 'Referral Partner', href: '/#tiers' },
      { label: 'Reseller', href: '/#tiers' },
      { label: 'Certified Reseller', href: '/#tiers' },
      { label: 'Strategic Partner', href: '/#tiers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Product Catalog', href: '/products' },
      { label: 'Partner Academy', href: '/#program-details' },
      { label: 'Commission Structure', href: '/#commissions' },
      { label: 'Deal Registration', href: '/#program-details' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Become a Partner', href: '/apply' },
      { label: 'Partner Login', href: '/login' },
      { label: 'Reset Password', href: '/forgot-password' },
    ],
  },
]

export default function PublicFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black text-white">
                DS
              </span>
              <span className="text-[15px] font-bold tracking-tight text-ink">
                Digitalsofts <span className="text-orange-500">Partner Network</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              A distribution ecosystem for 120+ business solutions across retail, manufacturing,
              oil &amp; gas, hospitality, agriculture, poultry, logistics and real estate.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-ink">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('/#') ? (
                      <a href={l.href} className="text-sm text-ink-soft transition-colors hover:text-orange-600">
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.href} className="text-sm text-ink-soft transition-colors hover:text-orange-600">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-xs text-ink-soft sm:flex-row">
          <p>© {new Date().getFullYear()} Digitalsofts. All rights reserved.</p>
          <p>Commissions paid on collected revenue only. Terms apply.</p>
        </div>
      </div>
    </footer>
  )
}
