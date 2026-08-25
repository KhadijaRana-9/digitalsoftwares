import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...args) {
  return twMerge(clsx(...args))
}

export function formatCurrency(amount, currency = 'PKR') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  const n = Number(amount)
  return `${currency} ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

export function formatCompact(amount) {
  if (amount === null || amount === undefined) return '—'
  const n = Number(amount)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
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
