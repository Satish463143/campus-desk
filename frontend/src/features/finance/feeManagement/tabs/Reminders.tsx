'use client'
import React, { useState } from 'react'
import { Bell, Plus, AlertCircle, Check, X } from 'lucide-react'
import { useGetPendingRemindersQuery, useScheduleReminderMutation, useGetStudentFeesQuery } from '@/src/store/api/feeApi'
import { useListStudentsQuery } from '@/src/store/api/studentApi'

interface RemindersProps { schoolId: string }

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [schedule, { isLoading }] = useScheduleReminderMutation()
  const { data: studentsData } = useListStudentsQuery({ limit: 100 })
  const students = studentsData?.result ?? []

  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentFeeId, setStudentFeeId] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderType, setReminderType] = useState('EMAIL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: feesData } = useGetStudentFeesQuery(
    { studentId: selectedStudent, params: { limit: 20 } },
    { skip: !selectedStudent }
  )
  const fees = feesData?.result ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await schedule({ studentFeeId, reminderDate, reminderType }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 1000)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to schedule reminder')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2"><Bell size={18} className="text-[var(--primary)]"/>Schedule Reminder</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18}/></button>
        </div>
        {success ? (
          <div className="flex items-center gap-2 text-[var(--success)] py-4 justify-center"><Check size={20}/> Reminder scheduled!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Student</label>
              <select required className="erp-input" value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setStudentFeeId('') }}>
                <option value="">Select student...</option>
                {students.map((s: any) => <option key={s.studentProfile?.id ?? s.id} value={s.studentProfile?.id ?? s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Fee Record</label>
              <select required className="erp-input" value={studentFeeId} onChange={e => setStudentFeeId(e.target.value)} disabled={!selectedStudent}>
                <option value="">Select fee...</option>
                {fees.map((f: any) => <option key={f.id} value={f.id}>{f.feeStructure?.feeCategory?.name ?? f.id} — Rs.{Number(f.amount).toLocaleString()} ({f.status})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Reminder Date</label>
              <input required type="date" className="erp-input" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Channel</label>
              <select className="erp-input" value={reminderType} onChange={e => setReminderType(e.target.value)}>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">Push Notification</option>
              </select>
            </div>
            {error && <div className="flex items-center gap-2 text-[var(--danger)] text-sm"><AlertCircle size={14}/>{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Scheduling...' : 'Schedule'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Reminders({ schoolId }: RemindersProps) {
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useGetPendingRemindersQuery(undefined)
  const raw = data?.result
  const reminders: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])

  const TYPE_COLOR: Record<string, string> = {
    EMAIL: 'badge-active',
    SMS: 'badge-pending',
    PUSH: 'bg-[var(--secondary-light)] text-[var(--secondary)]',
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--foreground-muted)]">{reminders.length} pending reminder(s)</div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Schedule Reminder
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-[var(--foreground-muted)]">
          <Bell size={32} opacity={0.4} />
          <p className="text-sm">No pending reminders.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-2 text-sm">Schedule your first reminder</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reminders.map((r: any) => (
            <div key={r.id} className="erp-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0"><Bell size={16}/></div>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--foreground)] text-sm truncate">{r.studentFee?.student?.user?.name ?? 'Student'}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">{r.reminderDate ? new Date(r.reminderDate).toLocaleDateString() : '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[r.reminderType] ?? 'badge-pending'}`}>{r.reminderType}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--warning-bg)] text-[var(--warning-dark)]">PENDING</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
