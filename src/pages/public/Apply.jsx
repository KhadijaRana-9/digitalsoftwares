import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, MailCheck } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Button, Input, Textarea, Select, FormField } from '../../components/ui/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { savePendingApplication } from '../../lib/pendingApplication.js'
import { isValidEmail } from '../../lib/utils.js'
import { VERTICALS, TIER_LABELS, PARTNER_TIERS } from '../../lib/constants.js'

const EXPERIENCE_OPTIONS = ['New to Digitalsofts', '1–2 years selling similar products', '3–5 years', '5+ years']
const CUSTOMER_BASE_OPTIONS = ['0–10 businesses', '10–50 businesses', '50–200 businesses', '200+ businesses']

export default function Apply() {
  const { signUp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { data: tiers } = useQuery({
    queryKey: ['partner_tiers_public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_tiers').select('*').order('sort_order')
      if (error) throw error
      return data
    },
    retry: false,
  })

  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    phone: '', company: '', country: '', city: '', industry: '',
    partnerType: 'reseller', website: '', experience: EXPERIENCE_OPTIONS[0],
    customerBase: CUSTOMER_BASE_OPTIONS[0], territory: '', notes: '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address'
    if (form.password.length < 8) e.password = 'At least 8 characters'
    if (!form.phone.trim()) e.phone = 'Required'
    if (!form.company.trim()) e.company = 'Required'
    if (!form.country.trim()) e.country = 'Required'
    if (!form.industry.trim()) e.industry = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)

    const { data, error } = await signUp({ email: form.email, password: form.password, fullName: form.fullName })
    if (error) {
      setLoading(false)
      toast.error(error.message || 'Could not create your account.')
      return
    }

    const applicationPayload = {
      full_name: form.fullName,
      email: form.email,
      phone: form.phone,
      company: form.company,
      country: form.country,
      city: form.city,
      industry: form.industry,
      partner_type: form.partnerType,
      website: form.website || null,
      experience: form.experience,
      customer_base: form.customerBase,
      preferred_products: [],
      territory: form.territory || null,
    }

    if (data.session && data.user) {
      const { error: appError } = await supabase
        .from('partner_applications')
        .insert({ ...applicationPayload, user_id: data.user.id })
      setLoading(false)
      if (appError) {
        toast.error(appError.message || 'Account created, but the application could not be saved. Please contact support.')
        return
      }
      setStep('submitted')
    } else {
      savePendingApplication(applicationPayload)
      setLoading(false)
      setStep('confirmEmail')
    }
  }

  if (step === 'confirmEmail') {
    return (
      <AuthShell title="Confirm your email" width="max-w-lg">
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm text-ink-soft">
            We've sent a confirmation link to <strong className="text-ink">{form.email}</strong>. Once confirmed and
            you sign in, your partner application will be submitted automatically.
          </p>
          <Link to="/login" className="mt-6">
            <Button icon={ArrowUpRight}>Go to sign in</Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (step === 'submitted') {
    return (
      <AuthShell title="Application received" width="max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center py-4 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm text-ink-soft">
            Thanks, {form.fullName.split(' ')[0]}. Your application for{' '}
            <strong className="text-ink">{TIER_LABELS[form.partnerType]}</strong> is under review — usually within 48
            hours. You can track its status from your dashboard right away.
          </p>
          <Button className="mt-6" icon={ArrowUpRight} onClick={() => navigate('/partner/pending')}>
            Go to my dashboard
          </Button>
        </motion.div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Apply to the Partner Network" subtitle="Create your account and tell us about your business — most applications are reviewed within 48 hours." width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-600">Account</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required error={errors.fullName}>
              <Input value={form.fullName} onChange={set('fullName')} placeholder="Ayesha Khan" />
            </FormField>
            <FormField label="Work email" required error={errors.email}>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
            </FormField>
            <FormField label="Password" required error={errors.password} hint="At least 8 characters">
              <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </FormField>
            <FormField label="Phone" required error={errors.phone}>
              <Input value={form.phone} onChange={set('phone')} placeholder="+92 3XX XXXXXXX" />
            </FormField>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-600">Business</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Company / brand" required error={errors.company}>
              <Input value={form.company} onChange={set('company')} placeholder="Optional if you're independent" />
            </FormField>
            <FormField label="Website" hint="Optional">
              <Input value={form.website} onChange={set('website')} placeholder="https://" />
            </FormField>
            <FormField label="Country" required error={errors.country}>
              <Input value={form.country} onChange={set('country')} placeholder="Pakistan" />
            </FormField>
            <FormField label="City">
              <Input value={form.city} onChange={set('city')} placeholder="Lahore" />
            </FormField>
            <FormField label="Industry / vertical" required error={errors.industry}>
              <Select value={form.industry} onChange={set('industry')}>
                <option value="">Select a vertical</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                <option value="Other">Other / multiple</option>
              </Select>
            </FormField>
            <FormField label="Preferred territory" hint="City, country, or region">
              <Input value={form.territory} onChange={set('territory')} placeholder="e.g. UAE, or Lahore" />
            </FormField>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-600">Partner profile</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Interested tier" required>
              <Select value={form.partnerType} onChange={set('partnerType')}>
                {(tiers ?? PARTNER_TIERS.map((key) => ({ key, name: TIER_LABELS[key] }))).map((t) => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Relevant experience">
              <Select value={form.experience} onChange={set('experience')}>
                {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
            <FormField label="Existing customer base" className="sm:col-span-2">
              <Select value={form.customerBase} onChange={set('customerBase')}>
                {CUSTOMER_BASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Anything else we should know?" hint="Optional">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Tell us about your business, target customers, or goals" />
            </FormField>
          </div>
        </fieldset>

        <Button type="submit" loading={loading} className="w-full" icon={ArrowUpRight}>
          Submit application
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already a partner?{' '}
        <Link to="/login" className="font-semibold text-orange-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
