import { Layers } from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import { verticals } from '../../data/content.js'

export default function VerticalsSection() {
  return (
    <section id="verticals" className="relative bg-orange-50/60 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Vertical Specialists"
          title="Recruit specialists, not generalists"
          subtitle={
            'Digitalsofts → Industry Specialist → Customers beats Digitalsofts → generic salesperson → customers, every time. Each vertical has its own dedicated partner track.'
          }
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {verticals.map((v, i) => (
            <Reveal key={v.name} delay={0.04 * i}>
              <div className="group h-full rounded-2xl border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink">{v.name} Partner</h3>
                    <p className="text-xs text-ink-soft">Vertical specialist track</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {v.products.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
