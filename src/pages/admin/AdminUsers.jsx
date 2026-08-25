import { useState } from 'react'
import { UserPlus, Search, ShieldOff, Info } from 'lucide-react'
import { PageHeader, Button, Input, Select, FormField, Modal, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { supabase } from '../../lib/supabase.js'

export default function AdminUsers() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [looking, setLooking] = useState(false)

  const usersQ = useSupaQuery(['admin_users'], (sb) =>
    sb.from('profiles').select('*, admin_role:roles(*)').in('role', ['admin', 'super_admin']).order('created_at', { ascending: false })
  )
  const rolesQ = useSupaQuery(['assignable_roles'], (sb) => sb.from('roles').select('*').eq('is_system', false).order('name'))

  const promoteMutation = useSupaMutation(
    (sb, { id, admin_role_id }) => sb.from('profiles').update({ role: 'admin', admin_role_id }).eq('id', id).select().single(),
    {
      invalidate: [['admin_users']],
      onSuccess: () => { toast.success('User promoted to admin.'); setModalOpen(false); setEmail(''); setLookupResult(null) },
      onError: (e) => toast.error(e.message),
    }
  )

  const revokeMutation = useSupaMutation(
    (sb, id) => sb.from('profiles').update({ role: 'partner', admin_role_id: null }).eq('id', id).select().single(),
    { invalidate: [['admin_users']], onSuccess: () => toast.success('Admin access revoked.'), onError: (e) => toast.error(e.message) }
  )

  const roleMutation = useSupaMutation(
    (sb, { id, admin_role_id }) => sb.from('profiles').update({ admin_role_id }).eq('id', id).select().single(),
    { invalidate: [['admin_users']], onSuccess: () => toast.success('Role updated.'), onError: (e) => toast.error(e.message) }
  )

  const lookupUser = async () => {
    if (!email.trim()) return
    setLooking(true)
    const { data, error } = await supabase.from('profiles').select('*').ilike('email', email.trim()).maybeSingle()
    setLooking(false)
    if (error || !data) {
      setLookupResult(null)
      toast.error('No registered user found with that email. They must sign up first.')
      return
    }
    if (data.role !== 'partner') {
      toast.error('This user is already staff.')
      setLookupResult(null)
      return
    }
    setLookupResult(data)
  }

  const users = usersQ.data ?? []

  return (
    <div>
      <PageHeader title="Admin Users" subtitle="Staff with access to this console — Super Admin only." action={<Button icon={UserPlus} onClick={() => setModalOpen(true)}>Promote User</Button>} />

      <div className="mb-4 flex items-start gap-2 rounded-xl bg-orange-50 px-4 py-3 text-xs text-orange-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        New accounts must sign up first (e.g. via Apply or a direct signup), then be promoted here — creating an auth
        account directly requires server-side credentials this panel intentionally doesn't hold.
      </div>

      {usersQ.isLoading && <SkeletonRows rows={4} />}
      {usersQ.isError && <ErrorState onRetry={usersQ.refetch} />}
      {usersQ.isSuccess && users.length === 0 && <EmptyState icon={UserPlus} title="No staff accounts yet" />}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{u.full_name}</p>
                  <p className="text-xs text-ink-soft">{u.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  {u.role === 'super_admin' ? (
                    <Badge tone="orange">Super Admin</Badge>
                  ) : (
                    <Select
                      value={u.admin_role_id ?? ''}
                      onChange={(e) => roleMutation.mutate({ id: u.id, admin_role_id: e.target.value || null })}
                      className="w-auto"
                    >
                      <option value="">No role assigned</option>
                      {(rolesQ.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {u.role !== 'super_admin' && (
                    <Button size="sm" variant="ghost" icon={ShieldOff} loading={revokeMutation.isPending} onClick={() => revokeMutation.mutate(u.id)}>
                      Revoke access
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setLookupResult(null) }} title="Promote a user to admin">
        <div className="space-y-4">
          <FormField label="User's email">
            <div className="flex gap-2">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@digitalsofts.com" />
              <Button type="button" variant="outline" icon={Search} loading={looking} onClick={lookupUser}>Find</Button>
            </div>
          </FormField>

          {lookupResult && (
            <div className="rounded-xl border border-line bg-cream p-4">
              <p className="text-sm font-semibold text-ink">{lookupResult.full_name}</p>
              <p className="text-xs text-ink-soft">{lookupResult.email}</p>
              <div className="mt-3">
                <FormField label="Assign role">
                  <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                    <option value="">Select a role</option>
                    {(rolesQ.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </FormField>
              </div>
              <Button
                className="mt-3 w-full"
                disabled={!roleId}
                loading={promoteMutation.isPending}
                onClick={() => promoteMutation.mutate({ id: lookupResult.id, admin_role_id: roleId })}
              >
                Promote to Admin
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
