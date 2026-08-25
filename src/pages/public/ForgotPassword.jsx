import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2 } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Button, Input, FormField } from '../../components/ui/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { isValidEmail } from '../../lib/utils.js'

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    await sendPasswordReset(email)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link to set a new password.">
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm text-ink-soft">
            If an account exists for <strong className="text-ink">{email}</strong>, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" required error={error}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </FormField>
          <Button type="submit" loading={loading} className="w-full" icon={Mail}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link to="/login" className="font-semibold text-orange-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
