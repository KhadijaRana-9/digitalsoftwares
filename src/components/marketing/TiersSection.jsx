import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, Star, Users, Wallet, Briefcase } from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import Drawer from '../ui/Drawer.jsx'
import Button from '../ui/Button.jsx'
import { tiers, progression } from '../../data/content.js'

export default function TiersSection() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  return (
    <section id="tiers" className="relative bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Program Architecture"
          title="One partner network. Five levels of commitment."
          subtitle="Partners progress through the network, earning more margin and ownership as they prove themselves. Click a tier to see the full picture."
        />

        {/* Progression stepper */}
        <Reveal delay={0.1} className="mt-10 overflow-x-auto pb-2">
          <div className="flex min-w-[640px] items-center justify-between gap-2 sm:min-w-0">
            {progression.map((step, i) => (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      i === 0
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-ink-soft sm:text-sm">{step}</span>
                </div>
                {i < progression.length - 1 && (
                  <div className="mx-2 h-0.5 flex-1 rounded bg-gradient-to-r from-orange-300 to-orange-100 sm:mx-3" />
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Tier cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={0.05 * i}>
              <button
                onClick={() => setSelected(tier)}
                className={`group relative flex h-full w-full flex-col rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 ${
                  tier.featured
                    ? 'border-orange-400 bg-ink text-white shadow-xl shadow-orange-900/20'
                    : 'border-line bg-white hover:border-orange-300 hover:shadow-lg'
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-soft">
                    <Star className="h-3 w-3 fill-white" /> Most Popular
                  </span>
                )}
                <h3 className={`text-lg font-bold ${tier.featured ? 'text-white' : 'text-ink'}`}>
                  {tier.name}
                </h3>
                <p className={`mt-1 text-sm ${tier.featured ? 'text-orange-200' : 'text-orange-600'}`}>
                  {tier.tagline}
                </p>

                <div className={`mt-5 flex items-baseline gap-1.5 ${tier.featured ? 'text-white' : 'text-ink'}`}>
                  <span className="text-3xl font-black">{tier.revenue}</span>
                </div>
                <p className={`text-xs font-medium uppercase tracking-wide ${tier.featured ? 'text-orange-300' : 'text-ink-soft'}`}>
                  Revenue opportunity
                </p>

                <div className={`mt-5 h-px w-full ${tier.featured ? 'bg-white/15' : 'bg-line'}`} />

                <div className={`mt-5 flex items-center justify-between text-xs font-semibold ${tier.featured ? 'text-orange-100' : 'text-ink-soft'}`}>
                  <span>Investment</span>
                  <span>{tier.investment}</span>
                </div>

                <div
                  className={`mt-5 flex flex-1 items-end gap-1 text-sm font-semibold ${
                    tier.featured ? 'text-orange-200' : 'text-orange-600'
                  }`}
                >
                  Explore tier <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name} subtitle={selected?.tagline}>
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-cream p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <Wallet className="h-3.5 w-3.5" /> Revenue opportunity
                </p>
                <p className="mt-1 text-xl font-black text-ink">{selected.revenue}</p>
              </div>
              <div className="rounded-xl bg-cream p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <Briefcase className="h-3.5 w-3.5" /> Investment level
                </p>
                <p className="mt-1 text-xl font-black text-ink">{selected.investment}</p>
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-600">
                <Check className="h-3.5 w-3.5" /> What this partner does
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{selected.does}</p>
            </div>

            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-600">
                <Users className="h-3.5 w-3.5" /> Best fit for
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{selected.who}</p>
            </div>

            {selected.featured && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-xs font-semibold text-orange-700">
                Most partners land here — it's the tier with the best balance of ownership and support.
              </div>
            )}

            <Button className="w-full" icon={ArrowUpRight} onClick={() => navigate(`/apply?tier=${selected.id}`)}>
              Apply as {selected.name}
            </Button>
          </div>
        )}
      </Drawer>
    </section>
  )
}
