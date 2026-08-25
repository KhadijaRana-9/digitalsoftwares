import { useState } from 'react'
import { Save, KeyRound } from 'lucide-react'
import { PageHeader, Card, CardHeader, Input, FormField, Button, Badge } from '../../components/ui/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useSupaMutation } from '../../hooks/useSupaQuery.js'
import { formatCurrency } from '../../lib/utils.js'

export default function Profile() {
  const { user, profile, partnerProfile, refreshProfile, updatePassword } = useAuth()
  const toast = useToast()

  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  const [partnerForm, setPartnerForm] = useState({
    company: partnerProfile?.company ?? '', country: partnerProfile?.country ?? '',
    city: partnerProfile?.city ?? '', industry: partnerProfile?.industry ?? '',
    website: partnerProfile?.website ?? '', territory: partnerProfile?.territory ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' })

  const profileMutation = useSupaMutation(
    (sb, payload) => sb.from('profiles').update(payload).eq('id', user.id).select().single(),
    { onSuccess: () => { toast.success('Profile updated.'); refreshProfile() }, onError: (e) => toast.error(e.message) }
  )

  const partnerMutation = useSupaMutation(
    (sb, payload) => sb.from('partner_profiles').update(payload).eq('id', user.id).select().single(),
    { onSuccess: () => { toast.success('Business details updated.'); refreshProfile() }, onError: (e) => toast.error(e.message) }
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
      <PageHeader title="Profile" subtitle="Manage your account and business details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profileForm) }} className="space-y-4 p-5">
            <FormField label="Full name">
              <Input value={profileForm.full_name} onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))} />
            </FormField>
            <FormField label="Email">
              <Input value={profile?.email ?? ''} disabled />
            </FormField>
            <FormField label="Phone">
              <Input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
            </FormField>
            <Button type="submit" icon={Save} loading={profileMutation.isPending}>Save account</Button>
          </form>
        </Card>

        {partnerProfile && (
          <Card>
            <CardHeader
              title="Business details"
              action={<Badge status={partnerProfile.status} tone={partnerProfile.status === 'active' ? 'green' : 'red'} />}
            />
            <form onSubmit={(e) => { e.preventDefault(); partnerMutation.mutate(partnerForm) }} className="space-y-4 p-5">
              <FormField label="Company"><Input value={partnerForm.company} onChange={(e) => setPartnerForm((f) => ({ ...f, company: e.target.value }))} /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Country"><Input value={partnerForm.country} onChange={(e) => setPartnerForm((f) => ({ ...f, country: e.target.value }))} /></FormField>
                <FormField label="City"><Input value={partnerForm.city} onChange={(e) => setPartnerForm((f) => ({ ...f, city: e.target.value }))} /></FormField>
              </div>
              <FormField label="Industry"><Input value={partnerForm.industry} onChange={(e) => setPartnerForm((f) => ({ ...f, industry: e.target.value }))} /></FormField>
              <FormField label="Website"><Input value={partnerForm.website} onChange={(e) => setPartnerForm((f) => ({ ...f, website: e.target.value }))} /></FormField>
              <FormField label="Territory"><Input value={partnerForm.territory} onChange={(e) => setPartnerForm((f) => ({ ...f, territory: e.target.value }))} /></FormField>
              <Button type="submit" icon={Save} loading={partnerMutation.isPending}>Save business details</Button>
            </form>
          </Card>
        )}

        {partnerProfile?.tier && (
          <Card>
            <CardHeader title="Tier & commission" />
            <div className="grid grid-cols-2 gap-3 p-5 text-sm">
              <TierStat label="Current tier" value={partnerProfile.tier.name} />
              <TierStat label="Referral code" value={partnerProfile.referral_code} />
              <TierStat label="Commission range" value={`${partnerProfile.tier.min_commission}–${partnerProfile.tier.max_commission}%`} />
              <TierStat label="Discount authority" value={`${partnerProfile.discount_authority_override ?? partnerProfile.tier.discount_authority}%`} />
              <TierStat label="Annual sales YTD" value={formatCurrency(partnerProfile.annual_sales_ytd)} />
              <TierStat label="Annual target" value={formatCurrency(partnerProfile.tier.annual_sales_target)} />
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

function TierStat({ label, value }) {
  return (
    <div className="rounded-xl bg-cream p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 font-bold text-ink">{value}</p>
    </div>
  )
}
