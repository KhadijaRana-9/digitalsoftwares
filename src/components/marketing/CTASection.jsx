import { Link } from 'react-router-dom'
import { ArrowUpRight, LogIn, ShieldCheck, Clock, Percent } from 'lucide-react'
import Reveal from '../Reveal.jsx'

const points = [
  { icon: Clock, text: 'Most applications reviewed within 48 hours' },
  { icon: Percent, text: 'Real-time commission and payout tracking from day one' },
  { icon: ShieldCheck, text: '60–90 day deal protection on every registered opportunity' },
]

export default function CTASection() {
  return (
    <section id="apply" className="relative overflow-hidden bg-cream py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 shadow-sm">
            Apply Now
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Ready to build a Digitalsofts business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
            Create your partner account, tell us about your business, and get access to pricing,
            deal registration, commissions and the full partner portal.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-10">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-card sm:p-10">
            <div className="grid gap-4 sm:grid-cols-3">
              {points.map((p) => (
                <div key={p.text} className="flex items-start gap-3 rounded-xl bg-cream p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-snug text-ink-soft">{p.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/apply"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-orange-600 hover:shadow-lg active:scale-[0.98] sm:w-auto"
              >
                Apply to Become a Partner
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-all hover:border-orange-300 hover:text-orange-600 sm:w-auto"
              >
                <LogIn className="h-4 w-4" />
                Already a partner? Sign in
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
