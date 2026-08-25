import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Button, Input, FormField } from '../../components/ui/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    setLoading(false)
    if (updateError) {
      toast.error(updateError.message || 'Could not reset password — the link may have expired.')
      return
    }
    toast.success('Password updated. You can now sign in.')
    navigate('/login', { replace: true })
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="New password" required error={error}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </FormField>
        <FormField label="Confirm password" required>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </FormField>
        <Button type="submit" loading={loading} className="w-full" icon={KeyRound}>
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}
