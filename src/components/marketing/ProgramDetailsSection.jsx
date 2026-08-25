import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Target, Handshake, Wallet, Package, Megaphone, GraduationCap,
  Award, LifeBuoy, BookOpen, TrendingUp, ShieldCheck, Wrench, CheckCircle2, Gift,
  PackageCheck, Zap, Users2, ShieldOff,
} from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import {
  dealRegistrationSteps, portalModules, portalStats, certifications, academyTracks,
  incentiveBonuses, businessInBox, personas, guardrails, roadmap, kpis,
} from '../../data/content.js'

const certIcons = [ShieldCheck, Wrench, GraduationCap]
const moduleIcons = [Target, Handshake, Users, TrendingUp, Wallet, Wallet, Package, Megaphone, GraduationCap, LifeBuoy, BookOpen, Award]

const TABS = [
  { id: 'deals', label: 'Deal Registration' },
  { id: 'portal', label: 'Partner Portal' },
  { id: 'academy', label: 'Academy' },
  { id: 'incentives', label: 'Incentives & MDF' },
  { id: 'kit', label: 'Business-in-a-Box' },
  { id: 'recruitment', label: 'Who Should Join' },
  { id: 'guardrails', label: 'Guardrails & Roadmap' },
]

export default function ProgramDetailsSection() {
  const [active, setActive] = useState('deals')

  return (
    <section id="program-details" className="relative bg-orange-50/60 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="How the Program Runs"
          title="Every operational detail, one click away"
          subtitle="Deal protection, the partner portal, certification, incentives, and the guardrails that keep the network healthy."
        />

        <Reveal delay={0.1} className="mt-10 overflow-x-auto pb-1">
          <div className="flex min-w-max flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`rounded-full px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                  active === t.id
                    ? 'bg-orange-500 text-white shadow-soft'
                    : 'bg-white text-ink-soft hover:bg-orange-100 hover:text-orange-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 min-h-[420px] rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {active === 'deals' && (
                <div>
                  <p className="text-sm text-ink-soft">
                    Once approved, a registered deal is protected for 60–90 days — Digitalsofts cannot bypass
                    the partner and sell direct without paying the agreed commission.
                  </p>
                  <div className="relative mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 lg:block" />
                    {dealRegistrationSteps.map((s) => (
                      <div key={s.step} className="relative">
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-black text-orange-600 shadow-soft ring-4 ring-orange-50">
                          {s.step}
                        </div>
                        <h3 className="mt-4 font-bold text-ink">{s.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active === 'portal' && (
                <div className="grid gap-10 lg:grid-cols-5 lg:items-start">
                  <div className="lg:col-span-3">
                    <div className="overflow-hidden rounded-2xl border border-line bg-cream shadow-card">
                      <div className="flex items-center gap-2 border-b border-line bg-white px-5 py-3.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-200" />
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-100" />
                        <span className="ml-3 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                          <LayoutDashboard className="h-3.5 w-3.5" /> Digitalsofts Partner Portal
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                        {portalStats.map((s) => (
                          <div key={s.label} className="rounded-xl border border-line bg-white p-3.5">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">{s.label}</p>
                            <p className="mt-1 text-lg font-black text-orange-600">{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-line px-5 py-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
                          <span>Current tier: <span className="text-orange-600">GOLD</span></span>
                          <span>Next: PLATINUM</span>
                        </div>
                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-orange-100">
                          <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
                        </div>
                        <p className="mt-1.5 text-[11px] text-ink-soft">PKR 15,500 remaining to next tier</p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-bold text-ink">Everything in one place</h3>
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      {portalModules.map((m, i) => {
                        const Icon = moduleIcons[i % moduleIcons.length]
                        return (
                          <div key={m} className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2.5 text-xs font-semibold text-ink-soft">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-orange-500" /> {m}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {active === 'academy' && (
                <div className="grid gap-10 lg:grid-cols-5">
                  <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
                    {certifications.map((c, i) => {
                      const Icon = certIcons[i]
                      return (
                        <div key={c.name} className="h-full rounded-2xl border border-line bg-cream p-5">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                            <Icon className="h-5 w-5" />
                          </span>
                          <h3 className="mt-4 font-bold text-ink">{c.name}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.detail}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="lg:col-span-2">
                    <div className="h-full rounded-2xl border border-line bg-ink p-6">
                      <h3 className="font-bold text-white">Academy tracks</h3>
                      <ul className="mt-4 space-y-3">
                        {academyTracks.map((t) => (
                          <li key={t} className="flex items-start gap-2.5 text-sm text-orange-100">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" /> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {active === 'incentives' && (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="h-full rounded-2xl border border-line bg-cream p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Gift className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-bold text-ink">Quarterly bonuses</h3>
                    <div className="mt-4 space-y-2">
                      {incentiveBonuses.map((b) => (
                        <div key={b.target} className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 text-sm">
                          <span className="text-ink-soft">{b.target} generated</span>
                          <span className="font-bold text-orange-600">{b.bonus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-full rounded-2xl border border-line bg-cream p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Megaphone className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-bold text-ink">Marketing Development Fund</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      Gold+ partners earn 2–5% of annual sales as MDF for approved exhibitions, ads, webinars and events.
                    </p>
                    <div className="mt-4 rounded-xl bg-white p-4">
                      <p className="text-xs font-medium text-ink-soft">Example: Gold partner, PKR 5M/yr</p>
                      <p className="mt-1 text-2xl font-black text-orange-600">PKR 150,000</p>
                      <p className="text-xs text-ink-soft">at 3% MDF — proof of execution required</p>
                    </div>
                  </div>
                  <div className="h-full rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-500 to-orange-600 p-6 text-white shadow-lg">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                      <Award className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-bold">Recognition that compounds</h3>
                    <p className="mt-2 text-sm leading-relaxed text-orange-50">
                      Top performers each quarter get priority lead routing, a public shout-out in the partner
                      newsletter, and first access to new territories and vertical exclusivity.
                    </p>
                  </div>
                </div>
              )}

              {active === 'kit' && (
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
                      <Zap className="h-3.5 w-3.5" /> Start in 48 hours
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                      Every approved partner gets everything required to say <em>"I am now a Digitalsofts partner"</em> and
                      start immediately — no waiting, no guessing.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cream p-6">
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {businessInBox.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {active === 'recruitment' && (
                <div>
                  <p className="text-sm text-ink-soft">
                    Targeted recruitment beats a generic "become our reseller" button — these are the profiles that convert fastest.
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {personas.map((p) => (
                      <div key={p.name} className="h-full rounded-2xl border border-line bg-cream p-5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                          <Users2 className="h-4 w-4" />
                        </span>
                        <h3 className="mt-3.5 font-bold text-ink">{p.name}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active === 'guardrails' && (
                <div className="grid gap-10 lg:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2.5 text-orange-600">
                      <ShieldOff className="h-5 w-5" />
                      <h3 className="font-bold text-ink">What we deliberately avoid</h3>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {guardrails.map((g) => (
                        <li key={g} className="flex items-start gap-2.5 rounded-xl bg-cream px-4 py-3 text-sm text-ink-soft">
                          <span className="mt-0.5 text-orange-500">✕</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 text-orange-600">
                      <TrendingUp className="h-5 w-5" />
                      <h3 className="font-bold text-ink">Rollout roadmap</h3>
                    </div>
                    <div className="mt-5 space-y-3">
                      {roadmap.map((r) => (
                        <div key={r.phase} className="rounded-xl border border-line bg-cream p-4">
                          <p className="text-sm font-bold text-orange-600">{r.phase}</p>
                          <p className="mt-1 text-sm text-ink-soft">{r.partners}</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{r.target}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {kpis.map((k) => (
                        <div key={k.group} className="rounded-xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">{k.group}</p>
                          <ul className="mt-2 space-y-1">
                            {k.metrics.map((m) => (
                              <li key={m} className="text-xs leading-relaxed text-ink-soft">{m}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
