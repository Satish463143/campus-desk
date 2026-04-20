'use client'
import React, { useState } from 'react'
import { Settings, Save, AlertCircle, Check } from 'lucide-react'
import { useGetFeeSettingQuery, useUpsertFeeSettingMutation } from '@/src/store/api/feeApi'

interface SettingProps { schoolId: string }

export default function Setting({ schoolId }: SettingProps) {
  const { data, isLoading } = useGetFeeSettingQuery(undefined)
  
  const [upsert, { isLoading: saving }] = useUpsertFeeSettingMutation()

  const existing = data?.result
  const [graceDays, setGraceDays] = useState<number>(existing?.graceDays ?? 7)
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(existing?.reminderEnabled ?? true)
  const [showOverdueFeeTab, setShowOverdueFeeTab] = useState<boolean>(existing?.showOverdueFeeTab ?? true)
  const [defaultDueDays, setDefaultDueDays] = useState<number>(existing?.defaultDueDays ?? 30)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Sync when data loads
  React.useEffect(() => {
    if (existing) {
      setGraceDays(existing.graceDays ?? 7)
      setReminderEnabled(existing.reminderEnabled ?? true)
      setShowOverdueFeeTab(existing.showOverdueFeeTab ?? true)
      setDefaultDueDays(existing.defaultDueDays ?? 30)
    }
  }, [existing])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    try {
      await upsert({ graceDays, reminderEnabled, showOverdueFeeTab, defaultDueDays }).unwrap()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to save settings')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
  }

  return (
    <div className="p-5 max-w-xl">
      <div className="erp-card flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
          <Settings size={18} className="text-[var(--primary)]" />
          <h2 className="font-bold text-[var(--foreground)] text-base">Fee Settings</h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Grace Days */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">Grace Period (days)</label>
            <p className="text-xs text-[var(--foreground-muted)] mb-2">Number of days after due date before a fee is marked overdue.</p>
            <input
              type="number" min="0" max="90" required
              className="erp-input w-36"
              value={graceDays}
              onChange={e => setGraceDays(Number(e.target.value))}
            />
          </div>

          {/* Default Due Days */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">Default Due Days</label>
            <p className="text-xs text-[var(--foreground-muted)] mb-2">Default number of days after fee assignment when payment is due.</p>
            <input
              type="number" min="1" max="365" required
              className="erp-input w-36"
              value={defaultDueDays}
              onChange={e => setDefaultDueDays(Number(e.target.value))}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <div className="font-semibold text-sm text-[var(--foreground)]">Enable Fee Reminders</div>
                <div className="text-xs text-[var(--foreground-muted)]">Send automatic reminders to students/parents before due dates.</div>
              </div>
              <button
                type="button"
                onClick={() => setReminderEnabled(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${reminderEnabled ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${reminderEnabled ? 'translate-x-4' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <div className="font-semibold text-sm text-[var(--foreground)]">Show Overdue Tab</div>
                <div className="text-xs text-[var(--foreground-muted)]">Display overdue fee records separately in the fee management view.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowOverdueFeeTab(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${showOverdueFeeTab ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${showOverdueFeeTab ? 'translate-x-4' : ''}`} />
              </button>
            </label>
          </div>

          {error && <div className="flex items-center gap-2 text-[var(--danger)] text-sm"><AlertCircle size={14}/>{error}</div>}
          {success && <div className="flex items-center gap-2 text-[var(--success)] text-sm"><Check size={14}/>Settings saved successfully!</div>}

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 w-fit">
            <Save size={15} />{saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
