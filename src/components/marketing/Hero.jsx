import { motion } from 'framer-motion'
import { ArrowUpRight, PlayCircle, Sparkles } from 'lucide-react'
import { stats } from '../../data/content.js'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-orange-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -top-24 left-[-15%] h-[420px] w-[420px] rounded-full bg-orange-100/70 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pt-24 lg:px-8 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Digitalsofts Partner Network
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Build a real business <span className="text-gradient">selling Digitalsofts</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            A distribution channel, not an affiliate link. Introduce leads, refer deals, resell
            under partner pricing, or own a territory — across 120+ business solutions spanning
            retail, manufacturing, oil &amp; gas, hospitality, agriculture, poultry, logistics and
            real estate.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#apply"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-orange-600 hover:shadow-lg active:scale-[0.98] sm:w-auto"
            >
              Apply to Become a Partner
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="#tiers"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-all hover:border-orange-300 hover:text-orange-600 sm:w-auto"
            >
              <PlayCircle className="h-4 w-4" />
              Explore the 5 Tiers
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-white/70 px-4 py-6 text-center shadow-sm backdrop-blur-sm"
            >
              <div className="text-3xl font-black text-orange-500">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-soft">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
