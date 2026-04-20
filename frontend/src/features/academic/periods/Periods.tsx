'use client'
import React, { useState } from 'react'
import { Clock, Plus, Pencil, Trash2, AlertCircle, X, Coffee, CheckCircle2, XCircle } from 'lucide-react'
import { useGetPeriodsQuery, useCreatePeriodMutation, useUpdatePeriodMutation, useDeletePeriodMutation } from '@/src/store/api/periodApi'
import { useListAcademicYearsQuery } from '@/src/store/api/academicYearApi'

function safeArray(data: any): any[] {
  const r = data?.result; return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

function calcEndTime(start: string, mins: number): string {
  if (!start || !mins) return '—'
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ── Period Form ────────────────────────────────────
function PeriodForm({ initial, years, onClose, onSave, isLoading }: {
  initial?: any; years: any[]; onClose: () => void; onSave: (b: any) => Promise<void>; isLoading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [periodNumber, setPeriodNumber] = useState(initial?.periodNumber?.toString() ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime?.slice(0, 5) ?? '')
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes?.toString() ?? '')
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? years.find(y => y.isActive)?.id ?? years[0]?.id ?? '')
  const [isBreak, setIsBreak] = useState(initial?.isBreak ?? false)
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!name.trim() || !periodNumber || !startTime || !durationMinutes || !academicYearId)
      { setError('All required fields must be filled.'); return }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) { setError('Start time must be in HH:MM format.'); return }
    const dur = Number(durationMinutes)
    if (isNaN(dur) || dur < 5 || dur > 300) { setError('Duration must be between 5 and 300 minutes.'); return }
    try { await onSave({ name: name.trim(), periodNumber: Number(periodNumber), startTime, durationMinutes: dur, academicYearId, isBreak, isActive }) }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <Clock size={18} className="text-[var(--primary)]" />
            {initial ? 'Edit Period' : 'New Period'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-[var(--foreground-muted)]" /></button>
        </div>
        <form onSubmit={handle} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Academic Year *</label>
            <select className="erp-input" value={academicYearId} onChange={e => setAcademicYearId(e.target.value)}>
              <option value="">Select year…</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Name *</label>
              <input className="erp-input" placeholder="Period 1" value={name} onChange={e => setName(e.target.value)} maxLength={50} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Period # *</label>
              <input type="number" min={1} className="erp-input" placeholder="1" value={periodNumber} onChange={e => setPeriodNumber(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Start Time * (HH:MM)</label>
              <input type="time" className="erp-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Duration (minutes) *</label>
              <input type="number" min={5} max={300} className="erp-input" placeholder="45" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} />
            </div>
          </div>
          {startTime && durationMinutes && (
            <div className="text-xs text-[var(--foreground-muted)] bg-[var(--surface-raised)] rounded px-3 py-1.5">
              ⏱ {startTime} → {calcEndTime(startTime, Number(durationMinutes))} ({durationMinutes} min)
            </div>
          )}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input type="checkbox" checked={isBreak} onChange={e => setIsBreak(e.target.checked)} className="w-4 h-4 accent-[var(--warning)]" />
              Break Period
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-[var(--success)]" />
              Active
            </label>
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

// ── Period Timeline Card ───────────────────────────
function PeriodCard({ period, onEdit, onDelete }: { period: any; onEdit: () => void; onDelete: () => void }) {
  const endTime = calcEndTime(period.startTime?.slice(0, 5), period.durationMinutes)
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all
      ${period.isBreak ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' :
        period.isActive ? 'bg-[var(--card-bg)] border-[var(--card-border)]' :
        'bg-[var(--surface-raised)] border-[var(--border)] opacity-60'}`}>

      {/* Period number badge */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
        ${period.isBreak ? 'bg-amber-500 text-white' :
          period.isActive ? 'bg-[var(--primary)] text-white' : 'bg-[var(--border)] text-[var(--foreground-muted)]'}`}>
        {period.isBreak ? <Coffee size={16} /> : period.periodNumber}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--foreground)]">{period.name}</span>
          {period.isBreak && <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Break</span>}
          {!period.isActive && <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-raised)] text-[var(--foreground-muted)]">Inactive</span>}
        </div>
        <div className="text-sm text-[var(--foreground-muted)] mt-0.5">
          {period.startTime?.slice(0, 5) ?? '—'} → {endTime} · {period.durationMinutes} min
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"><Pencil size={14} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────
export default function Periods() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [yearFilter, setYearFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: yearsData } = useListAcademicYearsQuery({ limit: 50 })
  const { data, isLoading } = useGetPeriodsQuery({ academicYearId: yearFilter || undefined, limit: 100 })
  const [create, { isLoading: creating }] = useCreatePeriodMutation()
  const [update, { isLoading: updating }] = useUpdatePeriodMutation()
  const [deletePeriod] = useDeletePeriodMutation()

  const years = safeArray(yearsData)
  const periods = safeArray(data)
  const sorted = [...periods].sort((a, b) => a.periodNumber - b.periodNumber)

  const totalTeachingTime = periods.filter(p => !p.isBreak && p.isActive).reduce((s, p) => s + (p.durationMinutes ?? 0), 0)
  const breakTime = periods.filter(p => p.isBreak && p.isActive).reduce((s, p) => s + (p.durationMinutes ?? 0), 0)

  return (
    <div className="p-5 flex flex-col gap-6">
      {modal && (
        <PeriodForm
          initial={modal === 'edit' ? editing : undefined}
          years={years}
          onClose={() => { setModal(null); setEditing(null) }}
          onSave={modal === 'edit'
            ? async (body) => { await update({ id: editing.id, body }).unwrap(); setModal(null); setEditing(null) }
            : async (body) => { await create(body).unwrap(); setModal(null) }
          }
          isLoading={modal === 'edit' ? updating : creating}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] p-6 max-w-sm mx-4 flex flex-col gap-4">
            <h3 className="font-bold text-[var(--foreground)]">Delete Period?</h3>
            <p className="text-sm text-[var(--foreground-muted)]">This will remove the period from all timetable entries.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={async () => { await deletePeriod(confirmDelete).unwrap(); setConfirmDelete(null) }} className="flex-1 py-2 px-4 rounded-[var(--radius-md)] bg-[var(--danger)] text-white font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Periods</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Configure daily time slots for your schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="erp-input w-auto" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>)}
          </select>
          <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2"><Plus size={16} />New Period</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Periods', value: periods.length, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Teaching Periods', value: periods.filter(p => !p.isBreak && p.isActive).length, color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'Break Periods', value: periods.filter(p => p.isBreak).length, color: 'var(--warning)', bg: 'var(--warning-bg)' },
          { label: 'Teaching Hours', value: `${Math.floor(totalTeachingTime / 60)}h ${totalTeachingTime % 60}m`, color: 'var(--info)', bg: 'var(--info-bg)' },
        ].map(s => (
          <div key={s.label} className="erp-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>
              <Clock size={16} />
            </div>
            <div>
              <div className="font-bold text-[var(--foreground)]">{s.value}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-[var(--foreground-muted)]">
          <Clock size={40} opacity={0.3} />
          <p className="text-sm">No periods configured. Create your school's daily schedule.</p>
          <button onClick={() => setModal('create')} className="btn-primary text-sm">Create Period</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(p => (
            <PeriodCard key={p.id} period={p}
              onEdit={() => { setEditing(p); setModal('edit') }}
              onDelete={() => setConfirmDelete(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
