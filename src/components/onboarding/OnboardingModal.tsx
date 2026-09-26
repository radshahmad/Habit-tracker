import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { habitService } from '@/services/habitService'
import { updateSettings } from '@/hooks/useSettings'
import { todayKey } from '@/utils/dates'

const SAMPLE_HABITS = [
  { name: 'Drink Water', icon: '💧', color: '#4F6D8C', categoryId: 'cat-health', trackingType: 'quantity' as const, target: 8, unit: 'glasses' },
  { name: 'Read', icon: '📖', color: '#6B5B95', categoryId: 'cat-personal', trackingType: 'quantity' as const, target: 20, unit: 'pages' },
  { name: 'Exercise', icon: '🏋️', color: '#B8792E', categoryId: 'cat-fitness', trackingType: 'duration' as const, target: 30, unit: 'minutes' },
  { name: 'Study', icon: '📚', color: '#2F6F62', categoryId: 'cat-study', trackingType: 'duration' as const, target: 120, unit: 'minutes' },
]

export function OnboardingModal({ open, onDone }: { open: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false)

  async function finish() {
    await updateSettings({ onboardingComplete: true })
    onDone()
  }

  async function addSamples() {
    setBusy(true)
    try {
      for (const s of SAMPLE_HABITS) {
        await habitService.create({
          name: s.name,
          description: 'Sample habit — feel free to edit or delete this.',
          icon: s.icon,
          color: s.color,
          categoryId: s.categoryId,
          trackingType: s.trackingType,
          target: s.target,
          unit: s.unit,
          startDate: todayKey(),
        })
      }
      await finish()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={finish} title="Welcome">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-growth-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-soft dark:text-paper/60">
            No account, no sign-in — everything you track stays only on this device.
          </p>
        </div>
        <p className="text-sm text-ink-soft dark:text-paper/60">
          Want a few sample habits to explore the app with? They're clearly labeled and easy to remove from Habits later.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={finish} disabled={busy}>
            Start blank
          </Button>
          <Button variant="primary" onClick={addSamples} disabled={busy}>
            Add sample habits
          </Button>
        </div>
      </div>
    </Modal>
  )
}
