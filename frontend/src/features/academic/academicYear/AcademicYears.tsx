'use client'
import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { CalendarDays, Plus, Pencil, X, AlertCircle, ChevronRight } from 'lucide-react'
import {
  useListAcademicYearsQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
} from '@/src/store/api/academicYearApi'
import { useListClassesQuery } from '@/src/store/api/classApi'

// ── Safe array extractor (handles both {result:[]} and {data:[]} shapes) ──────
function safeArray(data: any): any[] {
  if (!data) return []
  // Try common API wrapper keys in priority order
  const r = data.data ?? data.result ?? data
  return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

// ── Yup Schema ─────────────────────────────────────
const yearSchema = yup.object({
  name: yup.string().trim().min(1, 'Required').max(20, 'Max 20 chars').required('Year name is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required')
    .test('after-start', 'End date must be after start date', function (val) {
      const { startDate } = this.parent
      if (!startDate || !val) return true
      return new Date(val) > new Date(startDate)
    }),
  isActive: yup.boolean().default(false),
})
type YearFormValues = yup.InferType<typeof yearSchema>

// ── Form Modal ─────────────────────────────────────
function YearModal({ initial, onClose, onSave, isLoading }: {
  initial?: any; onClose: () => void; onSave: (body: any) => Promise<void>; isLoading: boolean
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<YearFormValues>({
    resolver: yupResolver(yearSchema),
    defaultValues: {
      name: initial?.name ?? '',
      startDate: initial?.startDate?.slice(0, 10) ?? '',
      endDate: initial?.endDate?.slice(0, 10) ?? '',
      isActive: initial?.isActive ?? false,
    },
  })
  const [serverError, setServerError] = useState('')
  const startDate = watch('startDate')

  const onSubmit = async (values: YearFormValues) => {
    setServerError('')
    try { await onSave(values) }
    catch (err: any) { setServerError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <CalendarDays size={18} className="text-[var(--primary)]" />
            {initial ? 'Edit Academic Year' : 'New Academic Year'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] transition-colors">
            <X size={18} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Year Name *</label>
            <input {...register('name')} className="erp-input" placeholder="e.g. 2024-2025" maxLength={20} />
            {errors.name && <p className="mt-1 text-xs text-[var(--danger)]">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Start Date *</label>
              <input {...register('startDate')} type="date" className="erp-input" />
              {errors.startDate && <p className="mt-1 text-xs text-[var(--danger)]">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">End Date *</label>
              <input {...register('endDate')} type="date" min={startDate} className="erp-input" />
              {errors.endDate && <p className="mt-1 text-xs text-[var(--danger)]">{errors.endDate.message}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <input {...register('isActive')} type="checkbox" className="w-4 h-4 rounded accent-[var(--primary)]" />
            <div>
              <span className="text-sm font-semibold text-[var(--foreground)]">Set as Active Year</span>
              <p className="text-xs text-[var(--foreground-muted)]">Marks this as the current running academic year</p>
            </div>
          </label>

          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm">
              <AlertCircle size={14} />{serverError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving…' : initial ? 'Update Year' : 'Create Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Year Card ──────────────────────────────────────
function YearCard({ year, onEdit, classCount }: { year: any; onEdit: (y: any) => void; classCount: number }) {
  const durationDays = year.startDate && year.endDate
    ? Math.ceil((new Date(year.endDate).getTime() - new Date(year.startDate).getTime()) / 86400000)
    : 0
  const progress = year.startDate && year.endDate ? Math.min(100, Math.max(0,
    Math.round(((Date.now() - new Date(year.startDate).getTime()) / (new Date(year.endDate).getTime() - new Date(year.startDate).getTime())) * 100)
  )) : 0

  return (
    <div className={`erp-card flex flex-col gap-4 border-l-4 transition-shadow hover:shadow-md
      ${year.isActive ? 'border-l-[var(--success)]' : 'border-l-[var(--border)]'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
            ${year.isActive ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--surface-raised)] text-[var(--foreground-muted)]'}`}>
            <CalendarDays size={20} />
          </div>
          <div>
            <div className="font-bold text-[var(--foreground)]">{year.name}</div>
            <div className="text-xs text-[var(--foreground-muted)]">{fmtDate(year.startDate)} → {fmtDate(year.endDate)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {year.isActive && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)]">Active</span>
          )}
          <button onClick={() => onEdit(year)} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar — only for active year */}
      {year.isActive && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-[var(--foreground-muted)]">
            <span>Year Progress</span><span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[var(--success)] to-emerald-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-[var(--border)] text-xs text-[var(--foreground-muted)]">
        <span className="flex items-center gap-1"><CalendarDays size={12} />{durationDays} days</span>
        <span className="flex items-center gap-1"><ChevronRight size={12} />{classCount} classes</span>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────
export default function AcademicYears() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)

  const { data, isLoading } = useListAcademicYearsQuery({ limit: 50 })
  const { data: classData } = useListClassesQuery({ limit: 200 })
  const [create, { isLoading: creating }] = useCreateAcademicYearMutation()
  const [update, { isLoading: updating }] = useUpdateAcademicYearMutation()

  const years = safeArray(data)
  const classes = safeArray(classData)

  const classCountByYear = classes.reduce((acc: Record<string, number>, c: any) => {
    acc[c.academicYearId] = (acc[c.academicYearId] ?? 0) + 1; return acc
  }, {})

  return (
    <div className="p-5 flex flex-col gap-6">
      {modal && (
        <YearModal
          initial={modal === 'edit' ? editing : undefined}
          onClose={() => { setModal(null); setEditing(null) }}
          onSave={modal === 'edit'
            ? async (body) => { await update({ id: editing.id, body }).unwrap(); setModal(null); setEditing(null) }
            : async (body) => { await create(body).unwrap(); setModal(null) }
          }
          isLoading={modal === 'edit' ? updating : creating}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Academic Years</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Manage school academic calendar periods</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <Plus size={16} />New Academic Year
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Years', value: years.length, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Active Year', value: years.find(y => y.isActive)?.name ?? 'None', color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'Total Classes', value: classes.length, color: 'var(--accent)', bg: 'var(--accent-light)' },
        ].map(s => (
          <div key={s.label} className="erp-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>
              <CalendarDays size={16} />
            </div>
            <div>
              <div className="font-bold text-[var(--foreground)]">{s.value}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Year Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : years.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-[var(--foreground-muted)]">
          <CalendarDays size={48} opacity={0.25} />
          <p className="font-semibold text-[var(--foreground)]">No academic years yet</p>
          <p className="text-sm">Create your first academic year to get started.</p>
          <button onClick={() => setModal('create')} className="btn-primary text-sm">Create Academic Year</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...years]
            .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))
            .map(year => (
              <YearCard
                key={year.id}
                year={year}
                onEdit={y => { setEditing(y); setModal('edit') }}
                classCount={classCountByYear[year.id] ?? 0}
              />
            ))
          }
        </div>
      )}
    </div>
  )
}
