import { useState } from 'react'
import { LifeBuoy, Send } from 'lucide-react'
import { PageHeader, Tabs, Select, Input, Badge, Drawer, Button, SkeletonRows, EmptyState, ErrorState } from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { timeAgo, titleCase } from '../../lib/utils.js'
import { TICKET_STATUSES } from '../../lib/constants.js'

export default function AdminSupport() {
  const { user } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')

  const ticketsQ = useSupaQuery(['admin_tickets'], (sb) =>
    sb.from('support_tickets').select('*, partner:profiles(full_name, email), customer:customers(company_name, contact_email)').order('updated_at', { ascending: false })
  )
  const messagesQ = useSupaQuery(
    ['admin_ticket_messages', selected?.id],
    (sb) => sb.from('support_messages').select('*').eq('ticket_id', selected.id).order('created_at'),
    { enabled: Boolean(selected?.id) }
  )

  const statusMutation = useSupaMutation(
    (sb, { id, newStatus }) => sb.from('support_tickets').update({ status: newStatus }).eq('id', id).select().single(),
    { invalidate: [['admin_tickets']], onSuccess: (d) => { toast.success('Status updated.'); setSelected(d) }, onError: (e) => toast.error(e.message) }
  )

  const replyMutation = useSupaMutation(
    (sb, text) => sb.from('support_messages').insert({ ticket_id: selected.id, sender_id: user.id, sender_role: 'admin', message: text }).select().single(),
    { invalidate: [['admin_ticket_messages', selected?.id]], onSuccess: () => setReply(''), onError: (e) => toast.error(e.message) }
  )

  const tickets = ticketsQ.data ?? []
  const filtered = status === 'all' ? tickets : tickets.filter((t) => t.status === status)
  const tabs = [{ value: 'all', label: 'All', count: tickets.length }, ...TICKET_STATUSES.map((s) => ({ value: s, label: titleCase(s), count: tickets.filter((t) => t.status === s).length }))]

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle="Respond to partner and customer questions and issues." />

      <Tabs tabs={tabs} active={status} onChange={setStatus} className="mb-4" />

      {ticketsQ.isLoading && <SkeletonRows rows={5} />}
      {ticketsQ.isError && <ErrorState onRetry={ticketsQ.refetch} />}
      {ticketsQ.isSuccess && filtered.length === 0 && <EmptyState icon={LifeBuoy} title="No tickets here" />}

      {ticketsQ.isSuccess && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">From</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer transition-colors hover:bg-orange-50/40">
                  <td className="px-5 py-3.5 font-medium text-ink">{t.subject}</td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {t.partner?.full_name ?? t.customer?.company_name}
                    {t.customer && <span className="ml-1.5 rounded-full bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">customer</span>}
                  </td>
                  <td className="px-5 py-3.5 capitalize text-ink-soft">{t.priority}</td>
                  <td className="px-5 py-3.5"><Badge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{timeAgo(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.subject} subtitle={selected?.partner?.full_name ?? selected?.customer?.company_name}>
        {selected && (
          <div className="flex h-[calc(100vh-140px)] flex-col">
            <div className="mb-3">
              <Select value={selected.status} onChange={(e) => statusMutation.mutate({ id: selected.id, newStatus: e.target.value })} className="w-auto">
                {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {(messagesQ.data ?? []).map((m) => (
                <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.sender_role === 'admin' ? 'bg-orange-500 text-white' : 'bg-cream text-ink'}`}>
                    <p>{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.sender_role === 'admin' ? 'text-orange-100' : 'text-ink-soft'}`}>{timeAgo(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) replyMutation.mutate(reply.trim()) }} className="mt-3 flex gap-2 border-t border-line pt-3">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" />
              <Button type="submit" icon={Send} loading={replyMutation.isPending}>Send</Button>
            </form>
          </div>
        )}
      </Drawer>
    </div>
  )
}
