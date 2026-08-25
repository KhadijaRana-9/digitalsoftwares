import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import { Textarea, FormField } from './Field.jsx'

// For destructive/high-impact actions. Pass `requireReason` for anything
// financial or compliance-related — the confirm button stays disabled until
// a reason is typed, and the reason flows through to the mutation and (for
// tables with a matching column) into the automatic audit log.
export default function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', variant = 'danger', requireReason = false, loading = false,
}) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined)
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <p className="text-sm text-ink-soft">{description}</p>
      </div>

      {requireReason && (
        <div className="mt-4">
          <FormField label="Reason" required hint="Recorded in the audit log">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Explain why…" />
          </FormField>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button
          variant={variant}
          loading={loading}
          disabled={requireReason && !reason.trim()}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
