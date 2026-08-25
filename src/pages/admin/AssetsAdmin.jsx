import { useState } from 'react'
import { Plus, FolderOpen, Trash2, Upload } from 'lucide-react'
import { PageHeader, Button, Input, Select, Textarea, FormField, Modal, ConfirmDialog, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { PARTNER_TIERS, TIER_LABELS } from '../../lib/constants.js'

const CATEGORIES = ['brochure', 'presentation', 'demo_video', 'comparison_sheet', 'pricing_sheet', 'case_study', 'proposal_template', 'email_template', 'social_post', 'landing_page']
const emptyForm = { title: '', description: '', category: 'brochure', file: null, tierRestriction: [] }

export default function AssetsAdmin() {
  const toast = useToast()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const assetsQ = useSupaQuery(['admin_assets'], (sb) => sb.from('assets').select('*').order('created_at', { ascending: false }))

  const deleteMutation = useSupaMutation(
    (sb, id) => sb.from('assets').delete().eq('id', id),
    { invalidate: [['admin_assets']], onSuccess: () => { toast.success('Asset removed.'); setDeleting(null) }, onError: (e) => toast.error(e.message) }
  )

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.file) return toast.error('Choose a file to upload.')
    setUploading(true)
    const path = `${Date.now()}-${form.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { error: uploadError } = await supabase.storage.from('assets').upload(path, form.file)
    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message || 'Upload failed.')
      return
    }
    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
    const { error: insertError } = await supabase.from('assets').insert({
      title: form.title,
      description: form.description,
      category: form.category,
      file_url: urlData.publicUrl,
      file_type: form.file.type,
      tier_restriction: form.tierRestriction.length ? form.tierRestriction : null,
      uploaded_by: user.id,
    })
    setUploading(false)
    if (insertError) {
      toast.error(insertError.message)
      return
    }
    toast.success('Asset uploaded.')
    setModalOpen(false)
    setForm(emptyForm)
    assetsQ.refetch()
  }

  const assets = assetsQ.data ?? []

  return (
    <div>
      <PageHeader title="Sales & Marketing Assets" subtitle="Brochures, decks, case studies and templates for the partner library." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Upload Asset</Button>} />

      {assetsQ.isLoading && <SkeletonRows rows={4} />}
      {assetsQ.isError && <ErrorState onRetry={assetsQ.refetch} />}
      {assetsQ.isSuccess && assets.length === 0 && <EmptyState icon={FolderOpen} title="No assets yet" action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Upload Asset</Button>} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <div key={a.id} className="flex flex-col rounded-2xl border border-line bg-white p-5">
            <span className="w-fit rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-orange-700">{a.category.replace('_', ' ')}</span>
            <h3 className="mt-3 font-bold text-ink">{a.title}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-soft">{a.description}</p>
            {a.tier_restriction?.length > 0 && (
              <p className="mt-2 text-[11px] text-ink-soft">Restricted to: {a.tier_restriction.map((t) => TIER_LABELS[t] ?? t).join(', ')}</p>
            )}
            <div className="mt-4 flex items-center justify-between">
              <a href={a.file_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-orange-600 hover:underline">View file</a>
              <button onClick={() => setDeleting(a)} className="text-ink-soft hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload asset" size="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <FormField label="Title" required><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Category">
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </Select>
          </FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <FormField label="File" required hint="PDF, image, video or any file partners should access">
            <input
              type="file"
              required
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
            />
          </FormField>
          <FormField label="Restrict to tiers" hint="Leave all unchecked to make it visible to every tier">
            <div className="flex flex-wrap gap-2">
              {PARTNER_TIERS.map((t) => (
                <label key={t} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft">
                  <input
                    type="checkbox"
                    checked={form.tierRestriction.includes(t)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tierRestriction: e.target.checked ? [...f.tierRestriction, t] : f.tierRestriction.filter((x) => x !== t),
                      }))
                    }
                  />
                  {TIER_LABELS[t]}
                </label>
              ))}
            </div>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" icon={Upload} loading={uploading}>Upload</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        title="Remove asset"
        description={`Remove "${deleting?.title}" from the partner library? Partners will no longer see it.`}
        confirmLabel="Remove"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
