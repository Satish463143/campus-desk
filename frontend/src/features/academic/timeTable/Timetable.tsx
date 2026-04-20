'use client'
import React, { useState } from 'react'
import {
  CalendarDays, Plus, Pencil, Trash2, AlertCircle, X, Monitor, MapPin, Upload
} from 'lucide-react'
import {
  useGetTimetablesQuery, useCreateTimetableMutation, useUpdateTimetableMutation,
  useDeleteTimetableMutation, useBulkCreateTimetableMutation, useGetSectionTimetableQuery,
  useGetTeacherTimetableQuery, useGetDayScheduleQuery,
} from '@/src/store/api/timetableApi'
import { useListClassesQuery } from '@/src/store/api/classApi'
import { useListSectionsQuery } from '@/src/store/api/sectionApi'
import { useListSubjectsQuery } from '@/src/store/api/subjectApi'
import { useGetPeriodsQuery } from '@/src/store/api/periodApi'
import { useListAcademicYearsQuery } from '@/src/store/api/academicYearApi'

function safeArray(data: any): any[] {
  const r = data?.result; return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const
const CLASS_MODE_COLORS: Record<string, string> = {
  ONLINE: 'bg-blue-100 text-blue-700',
  OFFLINE: 'bg-green-100 text-green-700',
  HYBRID: 'bg-purple-100 text-purple-700',
}

// ── Timetable Entry Form ───────────────────────────
function EntryForm({ initial, classes, sections, subjects, periods, onClose, onSave, isLoading }: {
  initial?: any; classes: any[]; sections: any[]; subjects: any[]; periods: any[]
  onClose: () => void; onSave: (b: any) => Promise<void>; isLoading: boolean
}) {
  const [classId, setClassId] = useState(initial?.classId ?? '')
  const [sectionId, setSectionId] = useState(initial?.sectionId ?? '')
  const [periodId, setPeriodId] = useState(initial?.periodId ?? '')
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? '')
  const [teacherId, setTeacherId] = useState(initial?.teacherId ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? 'MONDAY')
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber ?? '')
  const [classMode, setClassMode] = useState(initial?.classMode ?? 'OFFLINE')
  const [error, setError] = useState('')

  const filteredSections = sections.filter(s => !classId || s.classId === classId)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!classId || !sectionId || !periodId || !subjectId || !teacherId || !dayOfWeek || !classMode)
      { setError('All required fields must be filled.'); return }
    try { await onSave({ classId, sectionId, periodId, subjectId, teacherId, dayOfWeek, classMode, roomNumber: roomNumber || undefined }) }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <CalendarDays size={18} className="text-[var(--primary)]" />
            {initial ? 'Edit Timetable Entry' : 'New Timetable Entry'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-[var(--foreground-muted)]" /></button>
        </div>
        <form onSubmit={handle} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Class *</label>
              <select className="erp-input" value={classId} onChange={e => { setClassId(e.target.value); setSectionId('') }}>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Day *</label>
              <select className="erp-input" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Period *</label>
              <select className="erp-input" value={periodId} onChange={e => setPeriodId(e.target.value)}>
                <option value="">Select period…</option>
                {periods.filter(p => !p.isBreak && p.isActive).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.startTime?.slice(0, 5)})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Subject *</label>
            <select className="erp-input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Teacher ID *</label>
            <input className="erp-input" placeholder="Teacher Profile UUID" value={teacherId} onChange={e => setTeacherId(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Class Mode *</label>
              <select className="erp-input" value={classMode} onChange={e => setClassMode(e.target.value)}>
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Room Number</label>
              <input className="erp-input" placeholder="e.g. Room 101" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} maxLength={50} />
            </div>
          </div>
          {error && <div className="flex items-center gap-1.5 text-sm text-[var(--danger)]"><AlertCircle size={13} />{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Saving…' : initial ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Weekly Grid Cell ───────────────────────────────
function GridCell({ entry, onEdit, onDelete }: { entry?: any; onEdit?: () => void; onDelete?: () => void }) {
  if (!entry) return (
    <div className="h-full min-h-[80px] rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <Plus size={16} className="text-[var(--foreground-muted)]" />
    </div>
  )
  return (
    <div className="h-full min-h-[80px] rounded-lg bg-[var(--primary-light)] border border-[var(--primary)] border-opacity-20 p-2 flex flex-col gap-1 group relative">
      <div className="font-semibold text-xs text-[var(--primary)] truncate">{entry.subject?.name ?? '—'}</div>
      <div className="text-xs text-[var(--foreground-muted)] truncate">{entry.teacher?.user?.name ?? '—'}</div>
      {entry.roomNumber && <div className="flex items-center gap-0.5 text-xs text-[var(--foreground-muted)] truncate"><MapPin size={9} />{entry.roomNumber}</div>}
      <span className={`w-fit text-xs px-1 py-0.5 rounded font-semibold mt-auto ${CLASS_MODE_COLORS[entry.classMode] ?? ''}`}>{entry.classMode}</span>
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
        <button onClick={onEdit} className="p-0.5 rounded bg-white shadow text-[var(--foreground-muted)] hover:text-[var(--primary)]"><Pencil size={10} /></button>
        <button onClick={onDelete} className="p-0.5 rounded bg-white shadow text-[var(--foreground-muted)] hover:text-[var(--danger)]"><Trash2 size={10} /></button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────
export default function Timetable() {
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; preDay?: string; prePeriod?: string; entry?: any } | null>(null)
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: classData } = useListClassesQuery({ limit: 200 })
  const { data: sectionData } = useListSectionsQuery({ limit: 200, classId: classFilter || undefined })
  const { data: subjectData } = useListSubjectsQuery({ limit: 200 })
  const { data: periodData } = useGetPeriodsQuery({ limit: 100 })
  const { data } = useGetTimetablesQuery({ classId: classFilter || undefined, sectionId: sectionFilter || undefined, limit: 500 })
  const [create, { isLoading: creating }] = useCreateTimetableMutation()
  const [update, { isLoading: updating }] = useUpdateTimetableMutation()
  const [deleteTT] = useDeleteTimetableMutation()

  const classes = safeArray(classData)
  const sections = safeArray(sectionData)
  const subjects = safeArray(subjectData)
  const periods = safeArray(periodData).filter(p => !p.isBreak && p.isActive).sort((a, b) => a.periodNumber - b.periodNumber)
  const entries = safeArray(data)

  // Build grid: { [dayOfWeek]: { [periodId]: entry } }
  const grid: Record<string, Record<string, any>> = {}
  for (const e of entries) {
    if (!grid[e.dayOfWeek]) grid[e.dayOfWeek] = {}
    grid[e.dayOfWeek][e.periodId] = e
  }

  return (
    <div className="p-5 flex flex-col gap-6">
      {modal && (
        <EntryForm
          initial={modal.entry}
          classes={classes}
          sections={sections}
          subjects={subjects}
          periods={periods}
          onClose={() => setModal(null)}
          onSave={modal.type === 'edit'
            ? async (body) => { await update({ id: modal.entry.id, body }).unwrap(); setModal(null) }
            : async (body) => { await create(body).unwrap(); setModal(null) }
          }
          isLoading={modal.type === 'edit' ? updating : creating}
        />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] p-6 max-w-sm mx-4 flex flex-col gap-4">
            <h3 className="font-bold text-[var(--foreground)]">Delete Timetable Entry?</h3>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={async () => { await deleteTT(confirmDelete).unwrap(); setConfirmDelete(null) }} className="flex-1 py-2 px-4 rounded-[var(--radius-md)] bg-[var(--danger)] text-white font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Timetable</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Weekly class schedule management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="erp-input w-auto" value={classFilter} onChange={e => { setClassFilter(e.target.value); setSectionFilter('') }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="erp-input w-auto" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.id}>Sec {s.name}</option>)}
          </select>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Add Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="erp-card"><div className="text-xl font-bold text-[var(--foreground)]">{entries.length}</div><div className="text-xs text-[var(--foreground-muted)]">Total Slots</div></div>
        <div className="erp-card"><div className="text-xl font-bold text-[var(--foreground)]">{entries.filter(e => e.classMode === 'OFFLINE').length}</div><div className="text-xs text-[var(--foreground-muted)]">Offline</div></div>
        <div className="erp-card"><div className="text-xl font-bold text-[var(--foreground)]">{entries.filter(e => e.classMode === 'ONLINE').length}</div><div className="text-xs text-[var(--foreground-muted)]">Online</div></div>
        <div className="erp-card"><div className="text-xl font-bold text-[var(--foreground)]">{new Set(entries.map(e => e.subjectId)).size}</div><div className="text-xs text-[var(--foreground-muted)]">Subjects</div></div>
      </div>

      {/* Weekly Grid */}
      {periods.length === 0 ? (
        <div className="erp-card flex flex-col items-center py-16 gap-3 text-[var(--foreground-muted)]">
          <CalendarDays size={40} opacity={0.3} />
          <p className="text-sm">No periods configured. Add periods first to build the timetable.</p>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)] w-28">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="p-3 text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period.id} className="border-b border-[var(--border)] group">
                  <td className="p-3 align-top">
                    <div className="font-semibold text-xs text-[var(--foreground)]">{period.name}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{period.startTime?.slice(0, 5)}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{period.durationMinutes}m</div>
                  </td>
                  {DAYS.map(day => {
                    const entry = grid[day]?.[period.id]
                    return (
                      <td key={day} className="p-1.5 align-top">
                        <div className="group cursor-pointer" onClick={() => {
                          if (entry) return
                          setModal({ type: 'create', preDay: day, prePeriod: period.id })
                        }}>
                          <GridCell
                            entry={entry}
                            onEdit={() => setModal({ type: 'edit', entry })}
                            onDelete={() => setConfirmDelete(entry?.id)}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="flex items-center gap-3 px-3 py-2 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--foreground-muted)]">Mode:</span>
            {Object.entries(CLASS_MODE_COLORS).map(([m, cls]) => (
              <span key={m} className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
