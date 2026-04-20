'use client'
import React, { useState } from 'react'
import { BookOpen, Plus, Pencil, ChevronDown, ChevronRight, AlertCircle, X, Users } from 'lucide-react'
import { useListClassesQuery, useCreateClassMutation, useUpdateClassMutation } from '@/src/store/api/classApi'
import { useListAcademicYearsQuery } from '@/src/store/api/academicYearApi'
import { useListSectionsQuery } from '@/src/store/api/sectionApi'

// ── Helpers ────────────────────────────────────────
function safeArray(data: any): any[] {
  const r = data?.result; return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

// ── Class Form Modal ───────────────────────────────
function ClassForm({ initial, years, onClose, onSave, isLoading }: {
  initial?: any; years: any[]; onClose: () => void; onSave: (b: any) => Promise<void>; isLoading: boolean
}) {
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? years[0]?.id ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [numericLevel, setNumericLevel] = useState(initial?.numericLevel?.toString() ?? '')
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!academicYearId || !name.trim() || !numericLevel) { setError('All fields are required.'); return }
    if (isNaN(Number(numericLevel)) || Number(numericLevel) < 1) { setError('Level must be a positive number.'); return }
    try { await onSave({ academicYearId, name: name.trim(), numericLevel: Number(numericLevel) }) }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--primary)]" />
            {initial ? 'Edit Class' : 'New Class'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-[var(--foreground-muted)]" /></button>
        </div>
        <form onSubmit={handle} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Academic Year *</label>
            <select className="erp-input" value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} disabled={!!initial}>
              <option value="">Select academic year…</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Class Name *</label>
              <input className="erp-input" placeholder="e.g. Class 10" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Level *</label>
              <input type="number" min={1} className="erp-input" placeholder="e.g. 10" value={numericLevel} onChange={e => setNumericLevel(e.target.value)} />
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

// ── Class Row with inline sections ─────────────────
function ClassRow({ cls, onEdit, sections }: { cls: any; onEdit: (c: any) => void; sections: any[] }) {
  const [expanded, setExpanded] = useState(false)
  const mySections = sections.filter(s => s.classId === cls.id)

  return (
    <>
      <tr className="hover:bg-[var(--surface-raised)] transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown size={14} className="text-[var(--primary)]" /> : <ChevronRight size={14} className="text-[var(--foreground-muted)]" />}
            <div>
              <div className="font-semibold text-[var(--foreground)]">{cls.name}</div>
              <div className="text-xs text-[var(--foreground-muted)]">Level {cls.numericLevel}</div>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-[var(--foreground-muted)]">{cls.academicYear?.name ?? '—'}</td>
        <td className="py-3 px-4">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--info-bg)] text-[var(--info-text)]">
            {mySections.length} section{mySections.length !== 1 ? 's' : ''}
          </span>
        </td>
        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(cls)} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            <Pencil size={14} />
          </button>
        </td>
      </tr>
      {expanded && mySections.length > 0 && (
        <tr>
          <td colSpan={4} className="px-4 pb-3 pt-0">
            <div className="ml-6 flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
              {mySections.map(s => (
                <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-sm">
                  <Users size={12} className="text-[var(--primary)]" />
                  <span className="font-medium text-[var(--foreground)]">Section {s.name}</span>
                  {s.capacity && <span className="text-xs text-[var(--foreground-muted)]">· {s.capacity} students</span>}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
      {expanded && mySections.length === 0 && (
        <tr>
          <td colSpan={4} className="px-4 pb-3 pt-0">
            <div className="ml-6 pt-2 border-t border-[var(--border)] text-xs text-[var(--foreground-muted)] italic">No sections yet.</div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main ───────────────────────────────────────────
export default function Classes() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [yearFilter, setYearFilter] = useState('')

  const { data: yearsData } = useListAcademicYearsQuery({ limit: 50 })
  const { data: classData, isLoading } = useListClassesQuery({ limit: 200, academicYearId: yearFilter || undefined })
  const { data: sectionData } = useListSectionsQuery({ limit: 500 })
  const [create, { isLoading: creating }] = useCreateClassMutation()
  const [update, { isLoading: updating }] = useUpdateClassMutation()

  const years = safeArray(yearsData)
  const classes = safeArray(classData)
  const sections = safeArray(sectionData)
  const activeYear = years.find(y => y.isActive)

  return (
    <div className="p-5 flex flex-col gap-6">
      {modal && (
        <ClassForm
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Classes</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
            {activeYear ? `Active year: ${activeYear.name}` : 'Manage school classes across academic years'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="erp-input w-auto" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>)}
          </select>
          <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Class
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="erp-card"><div className="text-2xl font-bold text-[var(--foreground)]">{classes.length}</div><div className="text-xs text-[var(--foreground-muted)]">Classes</div></div>
        <div className="erp-card"><div className="text-2xl font-bold text-[var(--foreground)]">{sections.length}</div><div className="text-xs text-[var(--foreground-muted)]">Sections</div></div>
        <div className="erp-card"><div className="text-2xl font-bold text-[var(--foreground)]">{years.length}</div><div className="text-xs text-[var(--foreground-muted)]">Academic Years</div></div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-[var(--foreground-muted)]">
          <BookOpen size={40} opacity={0.3} />
          <p className="text-sm">No classes found. Create your first class.</p>
          <button onClick={() => setModal('create')} className="btn-primary text-sm">Create Class</button>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2 px-4">Class</th>
                <th className="pb-2 px-4">Academic Year</th>
                <th className="pb-2 px-4">Sections</th>
                <th className="pb-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[...classes].sort((a, b) => a.numericLevel - b.numericLevel).map(cls => (
                <ClassRow key={cls.id} cls={cls} onEdit={c => { setEditing(c); setModal('edit') }} sections={sections} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
