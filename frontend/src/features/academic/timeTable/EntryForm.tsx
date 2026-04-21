'use client'
import React, { useState } from 'react'
import { CalendarDays, AlertCircle, X } from 'lucide-react'
import TeacherSelect from '@/src/components/TeacherSelect'
import { DAYS, DAY_SHORT } from './timetableUtils'

interface EntryFormProps {
  initial?: any
  preDay?: string
  prePeriod?: string
  preClassId?: string
  preSectionId?: string
  classes: any[]
  allSections: any[]
  subjects: any[]
  periods: any[]
  isLoading: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export default function EntryForm({
  initial, preDay, prePeriod, preClassId, preSectionId,
  classes, allSections, subjects, periods, isLoading, onClose, onSave,
}: EntryFormProps) {
  const isEditMode = !!initial

  const [classId,    setClassId]    = useState(initial?.classId    ?? preClassId   ?? '')
  const [sectionId,  setSectionId]  = useState(initial?.sectionId  ?? preSectionId ?? '')
  const [periodId,   setPeriodId]   = useState(initial?.periodId   ?? prePeriod    ?? '')
  const [subjectId,  setSubjectId]  = useState(initial?.subjectId  ?? '')
  const [teacherId,  setTeacherId]  = useState(initial?.teacherId  ?? '')
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber ?? '')
  const [classModeVal, setClassModeVal] = useState(initial?.classMode ?? 'offline')
  const [error, setError] = useState('')

  const [selectedDays, setSelectedDays] = useState<string[]>(
    initial?.dayOfWeek ? [initial.dayOfWeek] : preDay ? [preDay] : ['monday']
  )

  const toggleDay = (day: string) => {
    if (isEditMode) return
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.length > 1 ? prev.filter(d => d !== day) : prev
        : [...prev, day]
    )
  }

  const filteredSections = allSections.filter(
    s => !classId || (s.class?.id ?? s.classId) === classId
  )

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!classId || !sectionId || !periodId || !subjectId || !teacherId || !classModeVal) {
      setError('All required fields must be filled.'); return
    }
    if (selectedDays.length === 0) { setError('Select at least one day.'); return }
    try {
      await onSave({
        classId, sectionId, periodId, subjectId, teacherId,
        classMode: classModeVal,
        roomNumber: roomNumber || undefined,
        selectedDays,
      })
    } catch (err: any) { setError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <CalendarDays size={18} className="text-[var(--primary)]" />
            {isEditMode ? 'Edit Timetable Entry' : 'New Timetable Entry'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handle} className="flex flex-col gap-4">
          {/* Class + Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Class *</label>
              <select className="erp-input" value={classId}
                onChange={e => { setClassId(e.target.value); setSectionId('') }}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Section *</label>
              <select className="erp-input" value={sectionId} onChange={e => setSectionId(e.target.value)}>
                <option value="">Select section…</option>
                {filteredSections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Days selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
              {isEditMode ? 'Day *' : 'Days * (select one or more)'}
            </label>
            {isEditMode ? (
              <select className="erp-input" value={selectedDays[0]}
                onChange={e => setSelectedDays([e.target.value])}>
                {DAYS.map(d => <option key={d} value={d}>{DAY_SHORT[d]}</option>)}
              </select>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(d => {
                  const active = selectedDays.includes(d)
                  return (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-transparent text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--primary)]'
                      }`}>
                      {DAY_SHORT[d]}
                    </button>
                  )
                })}
              </div>
            )}
            {!isEditMode && selectedDays.length > 1 && (
              <p className="text-xs text-[var(--primary)] mt-1.5">
                ✓ Will create {selectedDays.length} entries — one per selected day
              </p>
            )}
          </div>

          {/* Period + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Period *</label>
              <select className="erp-input" value={periodId} onChange={e => setPeriodId(e.target.value)}>
                <option value="">Select period…</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.startTime?.slice(0, 5)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Subject *</label>
              <select className="erp-input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Teacher *</label>
            <TeacherSelect value={teacherId} onChange={setTeacherId} placeholder="Search & select teacher…" isClearable={false} />
          </div>

          {/* Class mode + Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Class Mode *</label>
              <select className="erp-input" value={classModeVal} onChange={e => setClassModeVal(e.target.value)}>
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Room Number</label>
              <input className="erp-input" placeholder="e.g. Room 101"
                value={roomNumber} onChange={e => setRoomNumber(e.target.value)} maxLength={50} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--danger)] bg-[var(--danger-bg)] p-2.5 rounded-lg">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving…' : isEditMode ? 'Update Entry' : selectedDays.length > 1 ? `Create ${selectedDays.length} Entries` : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
