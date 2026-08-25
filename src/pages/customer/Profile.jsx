import { useState } from 'react'
import { Save, KeyRound } from 'lucide-react'
import { PageHeader, Card, CardHeader, Input, FormField, Button } from '../../components/ui/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useSupaMutation } from '../../hooks/useSupaQuery.js'

export default function CustomerProfile() {
  const { user, profile, customerRecord, refreshProfile, updatePassword } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' })

  const profileMutation = useSupaMutation(
    (sb, payload) => sb.from('profiles').update(payload).eq('id', user.id).select().single(),
    { onSuccess: () => { toast.success('Profile updated.'); refreshProfile() }, onError: (e) => toast.error(e.message) }
  )

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.password.length < 8) return toast.error('Password must be at least 8 characters.')
    if (passwordForm.password !== passwordForm.confirm) return toast.error('Passwords do not match.')
    const { error } = await updatePassword(passwordForm.password)
    if (error) return toast.error(error.message)
    toast.success('Password updated.')
    setPasswordForm({ password: '', confirm: '' })
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(form) }} className="space-y-4 p-5">
            <FormField label="Full name">
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </FormField>
            <FormField label="Email"><Input value={profile?.email ?? ''} disabled /></FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </FormField>
            <Button type="submit" icon={Save} loading={profileMutation.isPending}>Save account</Button>
          </form>
        </Card>

        {customerRecord && (
          <Card>
            <CardHeader title="Company" />
            <div className="grid grid-cols-2 gap-3 p-5 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Company</p>
                <p className="mt-0.5 text-ink">{customerRecord.company_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Industry</p>
                <p className="mt-0.5 text-ink">{customerRecord.industry || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Country</p>
                <p className="mt-0.5 text-ink">{customerRecord.country || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Status</p>
                <p className="mt-0.5 capitalize text-ink">{customerRecord.account_status}</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Password" />
          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-5">
            <FormField label="New password">
              <Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </FormField>
            <FormField label="Confirm password">
              <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
            </FormField>
            <Button type="submit" variant="outline" icon={KeyRound}>Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
