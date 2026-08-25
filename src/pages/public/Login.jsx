import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Button, Input, FormField } from '../../components/ui/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { isValidEmail } from '../../lib/utils.js'
import { roleHomePath } from '../../lib/roleHome.js'

export default function Login() {
  const { signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { data, error } = await signIn(form)
    if (error) {
      setLoading(false)
      toast.error(error.message || 'Unable to sign in.')
      return
    }
    // AuthContext's own profile fetch is async and hasn't necessarily
    // resolved yet in this tick — look the role up directly so the redirect
    // target is correct on the very first render instead of flashing /login.
    const { data: profileRow } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    setLoading(false)
    toast.success('Welcome back!')
    navigate(location.state?.from || roleHomePath(profileRow?.role), { replace: true })
  }

  return (
    <AuthShell title="Sign in to Digitalsofts" subtitle="One account for partners, customers and the Digitalsofts team.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" required error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </FormField>
        <FormField label="Password" required error={errors.password}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </FormField>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-semibold text-orange-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" icon={ArrowUpRight}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Not a partner yet?{' '}
        <Link to="/apply" className="font-semibold text-orange-600 hover:underline">
          Apply to join
        </Link>
      </p>
    </AuthShell>
  )
}
