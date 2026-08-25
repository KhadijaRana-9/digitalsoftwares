import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import { productCommissions, servicesMatrix, marginTiers } from '../../data/content.js'

const TABS = [
  { id: 'onetime', label: 'Licenses' },
  { id: 'saas', label: 'SaaS' },
  { id: 'services', label: 'Services' },
  { id: 'margins', label: 'Reseller Margins' },
]

export default function CommissionSection() {
  const [active, setActive] = useState('onetime')
  const [marginIndex, setMarginIndex] = useState(0)
  const current = productCommissions.find((p) => p.id === active)
  const activeMargin = marginTiers[marginIndex]

  return (
    <section id="commissions" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Commission Structure"
          title="Commissions paid only on collected revenue"
          subtitle="Pick a category to see how partners get paid — rates flex by product type and grow with tier and volume."
        />

        <Reveal delay={0.1} className="mt-10">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  active === t.id
                    ? 'bg-orange-500 text-white shadow-soft'
                    : 'bg-orange-50 text-ink-soft hover:bg-orange-100 hover:text-orange-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 min-h-[280px] overflow-hidden rounded-2xl border border-line bg-cream shadow-sm">
          <AnimatePresence mode="wait">
            {active !== 'services' && active !== 'margins' && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8"
              >
                <p className="text-sm font-medium text-orange-600">Example: {current.example}</p>
                <div className="mt-5 divide-y divide-line">
                  {current.rows.map((row) => (
                    <div key={row.tier} className="flex items-center justify-between gap-4 py-3.5">
                      <div>
                        <p className="font-semibold text-ink">{row.tier}</p>
                        <p className="text-xs text-ink-soft">{row.note}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-orange-500 px-3.5 py-1.5 text-sm font-bold text-white">
                        {row.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {active === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8"
              >
                <p className="text-sm font-medium text-orange-600">
                  Kept lean — delivery-heavy work stays well below SaaS/license margins.
                </p>
                <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="bg-orange-100/60 text-xs font-semibold uppercase tracking-wide text-orange-700">
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Affiliate</th>
                        <th className="px-4 py-3">Referral</th>
                        <th className="px-4 py-3">Reseller</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-white">
                      {servicesMatrix.map((s) => (
                        <tr key={s.service} className="transition-colors hover:bg-orange-50/50">
                          <td className="px-4 py-3 font-medium text-ink">{s.service}</td>
                          <td className="px-4 py-3 text-ink-soft">{s.affiliate}</td>
                          <td className="px-4 py-3 text-ink-soft">{s.referral}</td>
                          <td className="px-4 py-3 font-semibold text-orange-600">{s.reseller}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {active === 'margins' && (
              <motion.div
                key="margins"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8"
              >
                <p className="text-sm font-medium text-orange-600">Volume-based, reviewed annually — click a level.</p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {marginTiers.map((m, i) => (
                    <button
                      key={m.level}
                      onClick={() => setMarginIndex(i)}
                      className="flex flex-1 items-center"
                    >
                      <span
                        className={`flex h-9 w-full items-center justify-center rounded-full px-2 text-xs font-bold transition-all sm:text-sm ${
                          i === marginIndex
                            ? 'bg-orange-500 text-white shadow-soft'
                            : 'bg-white text-ink-soft hover:bg-orange-50'
                        }`}
                      >
                        {m.level.replace(' Reseller', '')}
                      </span>
                      {i < marginTiers.length - 1 && <span className="mx-1 h-0.5 w-3 shrink-0 rounded bg-orange-200 sm:w-4" />}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMargin.level}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-orange-200 bg-white p-5"
                  >
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                        <TrendingUp className="h-4 w-4 text-orange-500" /> {activeMargin.level}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">Annual volume: {activeMargin.sales}</p>
                    </div>
                    <span className="rounded-full bg-ink px-4 py-2 text-lg font-black text-white">{activeMargin.margin}</span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
