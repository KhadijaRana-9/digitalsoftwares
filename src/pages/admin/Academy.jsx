import { useState } from 'react'
import { Plus, GraduationCap, ChevronDown, Award } from 'lucide-react'
import { PageHeader, Tabs, Button, Input, Select, Textarea, FormField, Modal, Badge, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useToast } from '../../context/ToastContext.jsx'
import { cn } from '../../lib/utils.js'
import { CERTIFICATION_TYPES } from '../../lib/constants.js'

const courseEmptyForm = { title: '', description: '', track: 'general', certification_type: '', order_index: 0 }
const lessonEmptyForm = { title: '', content: '', video_url: '', order_index: 0 }

export default function Academy() {
  const toast = useToast()
  const [tab, setTab] = useState('courses')
  const [openCourse, setOpenCourse] = useState(null)
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [courseForm, setCourseForm] = useState(courseEmptyForm)
  const [lessonModalOpen, setLessonModalOpen] = useState(null)
  const [lessonForm, setLessonForm] = useState(lessonEmptyForm)

  const coursesQ = useSupaQuery(['admin_courses'], (sb) => sb.from('courses').select('*, lessons(*)').order('order_index'))
  const certsQ = useSupaQuery(['admin_certifications'], (sb) =>
    sb.from('certifications').select('*, partner:profiles(full_name, email)').order('created_at', { ascending: false })
  )

  const courseMutation = useSupaMutation(
    (sb, payload) => sb.from('courses').insert(payload).select().single(),
    { invalidate: [['admin_courses']], onSuccess: () => { toast.success('Course created.'); setCourseModalOpen(false); setCourseForm(courseEmptyForm) }, onError: (e) => toast.error(e.message) }
  )
  const courseToggle = useSupaMutation(
    (sb, { id, is_active }) => sb.from('courses').update({ is_active }).eq('id', id).select().single(),
    { invalidate: [['admin_courses']], onError: (e) => toast.error(e.message) }
  )
  const lessonMutation = useSupaMutation(
    (sb, payload) => sb.from('lessons').insert(payload).select().single(),
    { invalidate: [['admin_courses']], onSuccess: () => { toast.success('Lesson added.'); setLessonModalOpen(null); setLessonForm(lessonEmptyForm) }, onError: (e) => toast.error(e.message) }
  )

  const submitCourse = (e) => {
    e.preventDefault()
    courseMutation.mutate({ ...courseForm, certification_type: courseForm.certification_type || null, order_index: Number(courseForm.order_index) || 0 })
  }
  const submitLesson = (e) => {
    e.preventDefault()
    lessonMutation.mutate({ ...lessonForm, course_id: lessonModalOpen, order_index: Number(lessonForm.order_index) || 0 })
  }

  const courses = coursesQ.data ?? []
  const certifications = certsQ.data ?? []

  return (
    <div>
      <PageHeader title="Courses & Certifications" subtitle="Manage the Partner Academy and certification tracks." />

      <Tabs tabs={[{ value: 'courses', label: 'Courses' }, { value: 'certifications', label: 'Certifications' }]} active={tab} onChange={setTab} className="mb-4" />

      {tab === 'courses' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button icon={Plus} onClick={() => setCourseModalOpen(true)}>Add Course</Button>
          </div>
          {coursesQ.isLoading && <SkeletonRows rows={4} />}
          {coursesQ.isError && <ErrorState onRetry={coursesQ.refetch} />}
          {coursesQ.isSuccess && courses.length === 0 && <EmptyState icon={GraduationCap} title="No courses yet" />}

          <div className="space-y-3">
            {courses.map((c) => {
              const isOpen = openCourse === c.id
              return (
                <div key={c.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <button onClick={() => setOpenCourse(isOpen ? null : c.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <div>
                      <p className="font-bold text-ink">{c.title}</p>
                      <p className="text-xs text-ink-soft">{c.track} · {(c.lessons ?? []).length} {(c.lessons ?? []).length === 1 ? 'lesson' : 'lessons'} {c.certification_type && `· awards ${c.certification_type}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={c.is_active ? 'green' : 'gray'}>{c.is_active ? 'Published' : 'Unpublished'}</Badge>
                      <ChevronDown className={cn('h-4 w-4 text-orange-500 transition-transform', isOpen && 'rotate-180')} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-line px-5 py-4">
                      <div className="space-y-2">
                        {(c.lessons ?? []).map((l) => (
                          <div key={l.id} className="rounded-lg bg-cream px-3 py-2 text-sm text-ink">{l.title}</div>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setLessonModalOpen(c.id)}>Add lesson</Button>
                        <Button size="sm" variant="ghost" onClick={() => courseToggle.mutate({ id: c.id, is_active: !c.is_active })}>
                          {c.is_active ? 'Unpublish' : 'Publish'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'certifications' && (
        <>
          {certsQ.isLoading && <SkeletonRows rows={4} />}
          {certsQ.isError && <ErrorState onRetry={certsQ.refetch} />}
          {certsQ.isSuccess && certifications.length === 0 && <EmptyState icon={Award} title="No certifications awarded yet" description="Awarded automatically once a partner completes every lesson in a track." />}
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {certifications.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3.5 font-medium text-ink">{c.partner?.full_name}</td>
                    <td className="px-5 py-3.5 capitalize text-ink-soft">{c.type}</td>
                    <td className="px-5 py-3.5"><Badge tone={c.status === 'completed' ? 'green' : 'amber'}>{c.status.replace('_', ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={courseModalOpen} onClose={() => setCourseModalOpen(false)} title="Add course">
        <form onSubmit={submitCourse} className="space-y-4">
          <FormField label="Title" required><Input required value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Description"><Textarea value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <FormField label="Track">
            <Select value={courseForm.track} onChange={(e) => setCourseForm((f) => ({ ...f, track: e.target.value }))}>
              <option value="general">General</option>
              <option value="sales">Sales</option>
              <option value="implementation">Implementation</option>
              <option value="technical">Technical</option>
            </Select>
          </FormField>
          <FormField label="Awards certification" hint="Leave blank if this course doesn't award a certification">
            <Select value={courseForm.certification_type} onChange={(e) => setCourseForm((f) => ({ ...f, certification_type: e.target.value }))}>
              <option value="">None</option>
              {CERTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCourseModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={courseMutation.isPending}>Create course</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(lessonModalOpen)} onClose={() => setLessonModalOpen(null)} title="Add lesson">
        <form onSubmit={submitLesson} className="space-y-4">
          <FormField label="Title" required><Input required value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Content"><Textarea rows={4} value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} /></FormField>
          <FormField label="Video URL" hint="Optional"><Input value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} /></FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setLessonModalOpen(null)}>Cancel</Button>
            <Button type="submit" loading={lessonMutation.isPending}>Add lesson</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
