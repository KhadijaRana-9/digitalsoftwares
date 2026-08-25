import { useMemo, useState } from 'react'
import { GraduationCap, ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import { PageHeader, ProgressBar, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { cn } from '../../lib/utils.js'

export default function Academy() {
  const { user } = useAuth()
  const toast = useToast()
  const [openCourse, setOpenCourse] = useState(null)

  const coursesQ = useSupaQuery(['courses'], (sb) => sb.from('courses').select('*, lessons(*)').eq('is_active', true).order('order_index'))
  const progressQ = useSupaQuery(
    ['course_progress', user?.id],
    (sb) => sb.from('course_progress').select('*').eq('partner_id', user.id),
    { enabled: Boolean(user?.id) }
  )

  const toggleMutation = useSupaMutation(
    (sb, { lessonId, completed }) =>
      sb.from('course_progress').upsert({ partner_id: user.id, lesson_id: lessonId, completed, completed_at: completed ? new Date().toISOString() : null }, { onConflict: 'partner_id,lesson_id' }).select().single(),
    {
      invalidate: [['course_progress', user?.id], ['certifications', user?.id]],
      onError: (e) => toast.error(e.message),
    }
  )

  const progressByLesson = useMemo(() => {
    const map = {}
    ;(progressQ.data ?? []).forEach((p) => { map[p.lesson_id] = p.completed })
    return map
  }, [progressQ.data])

  const courses = (coursesQ.data ?? []).map((c) => {
    const lessons = (c.lessons ?? []).sort((a, b) => a.order_index - b.order_index)
    const done = lessons.filter((l) => progressByLesson[l.id]).length
    return { ...c, lessons, done, pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0 }
  })

  return (
    <div>
      <PageHeader title="Partner Academy" subtitle="Complete each track to unlock certifications and higher discount authority." />

      {coursesQ.isLoading && <SkeletonRows rows={5} />}
      {coursesQ.isError && <ErrorState onRetry={coursesQ.refetch} />}
      {coursesQ.isSuccess && courses.length === 0 && <EmptyState icon={GraduationCap} title="No courses published yet" />}

      <div className="space-y-3">
        {courses.map((course) => {
          const isOpen = openCourse === course.id
          return (
            <div key={course.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              <button
                onClick={() => setOpenCourse(isOpen ? null : course.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex-1">
                  <p className="font-bold text-ink">{course.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{course.description}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <ProgressBar value={course.pct} className="h-1.5 max-w-[160px]" />
                    <span className="text-xs font-semibold text-ink-soft">{course.done}/{course.lessons.length} lessons</span>
                  </div>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-orange-500 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="divide-y divide-line border-t border-line">
                  {course.lessons.map((lesson) => {
                    const done = Boolean(progressByLesson[lesson.id])
                    return (
                      <div key={lesson.id} className="flex items-start gap-3 px-5 py-3.5">
                        <button
                          onClick={() => toggleMutation.mutate({ lessonId: lesson.id, completed: !done })}
                          className="mt-0.5 shrink-0"
                          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {done ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-ink-soft/40" />}
                        </button>
                        <div>
                          <p className={cn('text-sm font-medium', done ? 'text-ink-soft line-through' : 'text-ink')}>{lesson.title}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">{lesson.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
