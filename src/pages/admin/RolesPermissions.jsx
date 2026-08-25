import { useMemo, useState } from 'react'
import { Plus, KeyRound } from 'lucide-react'
import { PageHeader, Button, Input, Textarea, FormField, Modal, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { cn } from '../../lib/utils.js'

const emptyForm = { name: '', description: '' }

export default function RolesPermissions() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedRoleId, setSelectedRoleId] = useState(null)

  const rolesQ = useSupaQuery(['roles_all'], (sb) => sb.from('roles').select('*').order('is_system', { ascending: false }).order('name'))
  const permissionsQ = useSupaQuery(['permissions_all'], (sb) => sb.from('permissions').select('*').order('group_name').order('label'))
  const rolePermsQ = useSupaQuery(
    ['role_permissions', selectedRoleId],
    (sb) => sb.from('role_permissions').select('permission_id').eq('role_id', selectedRoleId),
    { enabled: Boolean(selectedRoleId) }
  )

  const createRoleMutation = useSupaMutation(
    (sb, payload) => sb.from('roles').insert(payload).select().single(),
    { invalidate: [['roles_all']], onSuccess: () => { toast.success('Role created.'); setModalOpen(false); setForm(emptyForm) }, onError: (e) => toast.error(e.message) }
  )

  const toggleMutation = useSupaMutation(
    (sb, { roleId, permissionId, enabled }) =>
      enabled
        ? sb.from('role_permissions').insert({ role_id: roleId, permission_id: permissionId })
        : sb.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permissionId),
    { invalidate: [['role_permissions', selectedRoleId]], onError: (e) => toast.error(e.message) }
  )

  const roles = rolesQ.data ?? []
  const permissions = permissionsQ.data ?? []
  const grouped = useMemo(() => {
    const map = {}
    permissions.forEach((p) => {
      map[p.group_name] = map[p.group_name] || []
      map[p.group_name].push(p)
    })
    return map
  }, [permissions])
  const enabledIds = new Set((rolePermsQ.data ?? []).map((r) => r.permission_id))
  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Define what each Admin/Staff role can do — Super Admin always has full access." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add Role</Button>} />

      {rolesQ.isLoading && <SkeletonRows rows={4} />}
      {rolesQ.isError && <ErrorState onRetry={rolesQ.refetch} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => !r.is_system && setSelectedRoleId(r.id)}
              disabled={r.is_system}
              className={cn(
                'flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors',
                r.is_system ? 'cursor-not-allowed border-line bg-cream/60 opacity-60' :
                selectedRoleId === r.id ? 'border-orange-400 bg-orange-50' : 'border-line bg-white hover:border-orange-300'
              )}
            >
              <span className="text-sm font-bold text-ink">{r.name}</span>
              <span className="text-xs text-ink-soft">{r.is_system ? 'System role — always full access' : r.description}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selectedRole && (
            <EmptyState icon={KeyRound} title="Select a role" description="Choose a role on the left to manage its permissions." />
          )}
          {selectedRole && (
            <div className="space-y-4">
              {Object.entries(grouped).map(([group, perms]) => (
                <div key={group} className="rounded-2xl border border-line bg-white p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-orange-600">{group}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-cream">
                        <input
                          type="checkbox"
                          disabled={p.key === 'admins.manage'}
                          checked={enabledIds.has(p.id)}
                          onChange={(e) => toggleMutation.mutate({ roleId: selectedRoleId, permissionId: p.id, enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-line text-orange-500"
                        />
                        {p.label}
                        {p.key === 'admins.manage' && <span className="text-[10px] text-ink-soft">(Super Admin only)</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add role">
        <form onSubmit={(e) => { e.preventDefault(); createRoleMutation.mutate({ ...form, key: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') }) }} className="space-y-4">
          <FormField label="Role name" required><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createRoleMutation.isPending}>Create role</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
