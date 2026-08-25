import { useState } from 'react'
import { Plus, LifeBuoy, Send } from 'lucide-react'
import {
  PageHeader, Button, Input, Select, Textarea, FormField, Modal, Drawer,
  Badge, SkeletonRows, EmptyState, ErrorState,
} from '../../components/ui/index.js'
import { useSupaQuery, useSupaMutation } from '../../hooks/useSupaQuery.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { timeAgo } from '../../lib/utils.js'
import { TICKET_PRIORITIES } from '../../lib/constants.js'

const CATEGORIES = ['general', 'billing', 'technical', 'product']
const emptyForm = { subject: '', category: 'general', priority: 'normal', message: '' }

export default function CustomerSupport() {
  const { user, customerRecord } = useAuth()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')

  const ticketsQ = useSupaQuery(
    ['customer_tickets', customerRecord?.id],
    (sb) => sb.from('support_tickets').select('*').eq('customer_id', customerRecord.id).order('updated_at', { ascending: false }),
    { enabled: Boolean(customerRecord?.id) }
  )
  const messagesQ = useSupaQuery(
    ['customer_ticket_messages', selected?.id],
    (sb) => sb.from('support_messages').select('*').eq('ticket_id', selected.id).order('created_at'),
    { enabled: Boolean(selected?.id) }
  )

  const createMutation = useSupaMutation(
    async (sb, payload) => {
      const { data: ticket, error } = await sb.from('support_tickets').insert({ subject: payload.subject, category: payload.category, priority: payload.priority, customer_id: customerRecord.id }).select().single()
      if (error) return { data: null, error }
      const { error: msgError } = await sb.from('support_messages').insert({ ticket_id: ticket.id, sender_id: user.id, sender_role: 'customer', message: payload.message })
      return { data: ticket, error: msgError }
    },
    {
      invalidate: [['customer_tickets', customerRecord?.id]],
      onSuccess: () => { toast.success('Ticket created.'); setModalOpen(false); setForm(emptyForm) },
      onError: (e) => toast.error(e.message),
    }
  )

  const replyMutation = useSupaMutation(
    (sb, text) => sb.from('support_messages').insert({ ticket_id: selected.id, sender_id: user.id, sender_role: 'customer', message: text }).select().single(),
    { invalidate: [['customer_ticket_messages', selected?.id]], onSuccess: () => setReply(''), onError: (e) => toast.error(e.message) }
  )

  if (!customerRecord) {
    return (
      <div>
        <PageHeader title="Support" subtitle="Open a ticket and our team will respond here." />
        <EmptyState icon={LifeBuoy} title="No linked customer account yet" description="Contact your Digitalsofts partner to link your login before opening tickets." />
      </div>
    )
  }

  const tickets = ticketsQ.data ?? []

  return (
    <div>
      <PageHeader title="Support" subtitle="Open a ticket and our team will respond here." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>New Ticket</Button>} />

      {ticketsQ.isLoading && <SkeletonRows rows={4} />}
      {ticketsQ.isError && <ErrorState onRetry={ticketsQ.refetch} />}
      {ticketsQ.isSuccess && tickets.length === 0 && (
        <EmptyState icon={LifeBuoy} title="No support tickets" action={<Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>New Ticket</Button>} />
      )}

      {ticketsQ.isSuccess && tickets.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((t) => (
                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer transition-colors hover:bg-orange-50/40">
                  <td className="px-5 py-3.5 font-medium text-ink">{t.subject}</td>
                  <td className="px-5 py-3.5 capitalize text-ink-soft">{t.category}</td>
                  <td className="px-5 py-3.5"><Badge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-ink-soft">{timeAgo(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New support ticket" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <FormField label="Subject" required>
            <Input required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Message" required>
            <Textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create ticket</Button>
          </div>
        </form>
      </Modal>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.subject} subtitle={selected ? `${selected.category} · ${selected.priority}` : ''}>
        {selected && (
          <div className="flex h-[calc(100vh-140px)] flex-col">
            <div className="mb-3"><Badge status={selected.status} /></div>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {(messagesQ.data ?? []).map((m) => (
                <div key={m.id} className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.sender_role === 'customer' ? 'bg-orange-500 text-white' : 'bg-cream text-ink'}`}>
                    <p>{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.sender_role === 'customer' ? 'text-orange-100' : 'text-ink-soft'}`}>{timeAgo(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) replyMutation.mutate(reply.trim()) }} className="mt-3 flex gap-2 border-t border-line pt-3">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" />
              <Button type="submit" icon={Send} loading={replyMutation.isPending}>Send</Button>
            </form>
          </div>
        )}
      </Drawer>
    </div>
  )
}
