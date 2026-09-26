import { useRef, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { exportService, type ImportStrategy } from '@/services/exportService'
import type { ExportPayload } from '@/types'
import { AlertTriangle } from 'lucide-react'

export function ImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [preview, setPreview] = useState<{ payload: ExportPayload; summary: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<ImportStrategy>('merge')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setPreview(null)
    const result = await exportService.previewImport(file)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPreview({ payload: result.payload, summary: result.summary })
  }

  async function handleConfirm() {
    if (!preview) return
    setBusy(true)
    try {
      await exportService.importPayload(preview.payload, strategy)
      onImported()
      handleClose()
    } catch {
      setError('Something went wrong while importing. No changes were made.')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import data">
      {!preview ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft dark:text-paper/60">
            Choose a previously exported <code>habit-tracker-export-*.json</code> file. Nothing changes until you confirm.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="w-full rounded-md border border-black/10 bg-paper-raised px-3 py-2 text-sm dark:border-white/10 dark:bg-dark-surface2"
          />
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-brick-500">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft dark:text-paper/60">{preview.summary}</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-black/10 p-3 dark:border-white/10">
              <input type="radio" checked={strategy === 'merge'} onChange={() => setStrategy('merge')} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">Merge with existing data</span>
                <span className="block text-xs text-ink-soft/70 dark:text-paper/50">
                  Adds anything new and overwrites matching items by id. Keeps everything else you already have.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-black/10 p-3 dark:border-white/10">
              <input type="radio" checked={strategy === 'replace'} onChange={() => setStrategy('replace')} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">Replace all local data</span>
                <span className="block text-xs text-ink-soft/70 dark:text-paper/50">
                  Deletes everything currently on this device first, then imports the file.
                </span>
              </span>
            </label>
          </div>
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-brick-500">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={handleConfirm}>
              {strategy === 'replace' ? 'Replace and import' : 'Merge and import'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
