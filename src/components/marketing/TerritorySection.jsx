import { MapPin, Check } from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import { territoryModel, discountAuthority } from '../../data/content.js'

export default function TerritorySection() {
  return (
    <section className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Territory & Exclusivity"
          title="Exclusivity is earned, never automatic"
          subtitle="Territory or vertical rights unlock progressively as a partner proves commitment — and lapse automatically if annual targets are missed."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {territoryModel.map((t, i) => (
            <Reveal key={t.name} delay={0.08 * i}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  t.featured
                    ? 'border-orange-400 bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-xl'
                    : 'border-line bg-cream hover:border-orange-300 hover:shadow-lg'
                }`}
              >
                <MapPin className={`h-6 w-6 ${t.featured ? 'text-white' : 'text-orange-500'}`} />
                <h3 className={`mt-4 text-lg font-bold ${t.featured ? 'text-white' : 'text-ink'}`}>
                  {t.name}
                </h3>
                <p className={`mt-2 text-3xl font-black ${t.featured ? 'text-white' : 'text-orange-500'}`}>
                  {t.rate}
                </p>
                <p className={`mt-3 flex-1 text-sm leading-relaxed ${t.featured ? 'text-orange-50' : 'text-ink-soft'}`}>
                  {t.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Discount authority */}
        <Reveal delay={0.15} className="mt-16">
          <h3 className="text-lg font-bold text-ink">Controlled discount authority</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Anything beyond a tier's authority requires Digitalsofts approval — protecting minimum advertised price across the network.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {discountAuthority.map((d) => (
              <div
                key={d.tier}
                className="rounded-xl border border-line bg-cream px-3 py-4 text-center"
              >
                <p className="text-xs font-medium text-ink-soft">{d.tier}</p>
                <p className="mt-1.5 text-lg font-black text-orange-500">{d.discount}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
