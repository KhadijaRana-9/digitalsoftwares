import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...args) {
  return twMerge(clsx(...args))
}

// The platform displays every financial figure in PKR — this is the single
// place that fact lives. Product catalog data is sourced in USD (the real
// digitalsofts.com listings), so amounts tagged as USD get converted here
// rather than just relabeled; nothing else in the app should format money
// on its own or a USD figure could end up on screen unconverted.
export const USD_TO_PKR_RATE = 278 // approx market rate, PKR per 1 USD — update centrally here if it drifts

export function formatCurrency(amount, sourceCurrency = 'PKR') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  let n = Number(amount)
  if (sourceCurrency === 'USD') n *= USD_TO_PKR_RATE
  return `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

export function formatCompact(amount) {
  if (amount === null || amount === undefined) return '—'
  const n = Number(amount)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

// Same PKR conversion as formatCurrency, but compact — for catalog cards and
// other tight spaces where a precise 7-figure PKR number would dominate the
// layout. Use formatCurrency wherever the exact figure actually matters
// (product detail, invoices, commission ledgers).
export function formatCurrencyCompact(amount, sourceCurrency = 'PKR') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  let n = Number(amount)
  if (sourceCurrency === 'USD') n *= USD_TO_PKR_RATE
  return `PKR ${formatCompact(n)}`
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function timeAgo(value) {
  if (!value) return '—'
  const d = new Date(value)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function titleCase(value = '') {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateReferralCode(seed = '') {
  const base = seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'DS'
  const num = Math.floor(10000 + Math.random() * 89999)
  return `DS-${base}${num}`
}

export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
