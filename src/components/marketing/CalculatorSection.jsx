import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator as CalcIcon } from 'lucide-react'
import Reveal from '../Reveal.jsx'
import SectionHeader from '../SectionHeader.jsx'
import { formatCurrency } from '../../lib/utils.js'

const formatPKR = (n) => formatCurrency(Math.round(n))

export default function CalculatorSection() {
  const [retailPrice, setRetailPrice] = useState(250000)
  const [discount, setDiscount] = useState(30)
  const [customers, setCustomers] = useState(20)

  const { purchasePrice, profitPerDeal, margin, annualProfit } = useMemo(() => {
    const purchase = retailPrice * (1 - discount / 100)
    const profit = retailPrice - purchase
    return {
      purchasePrice: purchase,
      profitPerDeal: profit,
      margin: discount,
      annualProfit: profit * customers,
    }
  }, [retailPrice, discount, customers])

  return (
    <section id="calculator" className="relative overflow-hidden bg-ink py-16 sm:py-24">
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-orange-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Partner Economics"
          title="You're not selling software. You're building a business."
          subtitle="Model your own reseller economics — drag the sliders to see gross profit per deal and projected annual profit."
          light
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="grid gap-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm lg:grid-cols-5">
            {/* Controls */}
            <div className="space-y-8 p-8 lg:col-span-3 sm:p-10">
              <div className="flex items-center gap-2 text-orange-300">
                <CalcIcon className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Reseller profitability calculator
                </span>
              </div>

              <Slider
                label="Retail price (per license)"
                value={retailPrice}
                onChange={setRetailPrice}
                min={20000}
                max={1000000}
                step={5000}
                format={formatPKR}
              />
              <Slider
                label="Partner discount / margin"
                value={discount}
                onChange={setDiscount}
                min={10}
                max={45}
                step={1}
                format={(v) => `${v}%`}
              />
              <Slider
                label="Customers closed per year"
                value={customers}
                onChange={setCustomers}
                min={1}
                max={150}
                step={1}
                format={(v) => `${v}`}
              />
            </div>

            {/* Results */}
            <div className="flex flex-col justify-center gap-5 border-t border-white/10 bg-white/[0.03] p-8 lg:col-span-2 lg:border-l lg:border-t-0 sm:p-10">
              <ResultRow label="Your purchase price" value={formatPKR(purchasePrice)} />
              <ResultRow label="Customer selling price" value={formatPKR(retailPrice)} />
              <ResultRow label="Gross profit per deal" value={formatPKR(profitPerDeal)} accent />
              <ResultRow label="Gross margin" value={`${margin}%`} />

              <div className="mt-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-100">
                  Projected annual profit
                </p>
                <motion.p
                  key={Math.round(annualProfit)}
                  initial={{ opacity: 0.4, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-3xl font-black text-white sm:text-4xl"
                >
                  {formatPKR(annualProfit)}
                </motion.p>
                <p className="mt-1 text-xs text-orange-100">at {customers} customers / year</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Slider({ label, value, onChange, min, max, step, format }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-orange-100">{label}</label>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-orange-500"
        style={{
          background: `linear-gradient(to right, var(--color-orange-500) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
    </div>
  )
}

function ResultRow({ label, value, accent = false }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <span className="text-sm text-orange-100/80">{label}</span>
      <span className={`text-base font-bold ${accent ? 'text-orange-300' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}
