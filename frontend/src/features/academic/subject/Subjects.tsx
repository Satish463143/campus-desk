'use client'
import React, { useState } from 'react'
import {
  BookMarked, Plus, Pencil, X, AlertCircle, Trash2, Link2, Unlink,
  Users, ChevronRight,
  DatabaseBackupIcon
} from 'lucide-react'
import {
  useListSubjectsQuery, useCreateSubjectMutation, useUpdateSubjectMutation,
  useGetSubjectsByClassQuery, useAssignSubjectToClassMutation,
  useRemoveSubjectFromClassMutation, useGetTeachersBySectionSubjectsQuery,
  useAssignTeacherToSectionMutation, useRemoveTeacherFromSectionMutation,
} from '@/src/store/api/subjectApi'
import { useListClassesQuery } from '@/src/store/api/classApi'
import { useListSectionsQuery } from '@/src/store/api/sectionApi'
import TeacherSelect from '@/src/components/TeacherSelect'

// ── Safe array extractor — handles {result:[]}, {data:[]}, raw array ──────────
function safeArray(data: any): any[] {
  if (!data) return []
  const r = data.result ?? data.data ?? data
  return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

// ── Subject Form ───────────────────────────────────
function SubjectForm({ initial, onClose, onSave, isLoading }: {
  initial?: any; onClose: () => void; onSave: (b: any) => Promise<void>; isLoading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!name.trim()) { setError('Subject name is required.'); return }
    try { await onSave({ name: name.trim(), code: code.trim() || undefined }) }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <BookMarked size={18} className="text-[var(--primary)]" />
            {initial ? 'Edit Subject' : 'New Subject'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-[var(--foreground-muted)]" /></button>
        </div>
        <form onSubmit={handle} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Subject Name *</label>
            <input className="erp-input" placeholder="e.g. Mathematics" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Code <span className="font-normal text-[var(--foreground-muted)]">(optional)</span></label>
            <input className="erp-input" placeholder="e.g. MTH101" value={code} onChange={e => setCode(e.target.value)} maxLength={20} />
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

// ── Class-Subject Assignment Panel ─────────────────
function ClassAssignPanel({ classes, subjects }: { classes: any[]; subjects: any[] }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '')
  const [assigning, setAssigning] = useState(false)
  const [subjectToAssign, setSubjectToAssign] = useState('')
  const [error, setError] = useState('')

  const { data: classSubjectsData } = useGetSubjectsByClassQuery(selectedClassId, { skip: !selectedClassId })
  const [assignSubject] = useAssignSubjectToClassMutation()
  const [removeSubject] = useRemoveSubjectFromClassMutation()

  const assigned = safeArray(classSubjectsData)
  const assignedIds = new Set(assigned.map((s: any) => s.subject?.id ?? s.id))
  const unassigned = subjects.filter(s => !assignedIds.has(s.id))

  const handleAssign = async () => {
    if (!subjectToAssign) return; setError('')
    try { await assignSubject({ classId: selectedClassId, subjectId: subjectToAssign }).unwrap(); setSubjectToAssign(''); setAssigning(false) }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to assign.') }
  }
  const handleRemove = async (subjectId: string) => {
    try { await removeSubject({ classId: selectedClassId, subjectId }).unwrap() }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to remove.') }
  }

  return (
    <div className="erp-card flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2"><Link2 size={15} className="text-[var(--primary)]" />Class-Subject Assignments</h3>
        <select className="erp-input w-auto text-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Assigned subjects */}
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        {assigned.length === 0 && <span className="text-sm text-[var(--foreground-muted)] italic">No subjects assigned to this class.</span>}
        {assigned.map((a: any) => {
          const subj = a.subject ?? a
          return (
            <span key={subj.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-sm font-medium border border-[var(--primary)] border-opacity-20">
              {subj.name}
              {subj.code && <span className="text-xs opacity-60">({subj.code})</span>}
              <button onClick={() => handleRemove(subj.id)} className="ml-1 hover:text-[var(--danger)] transition-colors"><Unlink size={12} /></button>
            </span>
          )
        })}
      </div>

      {/* Assign new */}
      {assigning ? (
        <div className="flex gap-2 items-center">
          <select className="erp-input flex-1 text-sm" value={subjectToAssign} onChange={e => setSubjectToAssign(e.target.value)}>
            <option value="">Select subject to assign…</option>
            {unassigned.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
          </select>
          <button onClick={handleAssign} className="btn-primary text-sm py-1.5 px-3">Assign</button>
          <button onClick={() => setAssigning(false)} className="btn-ghost text-sm py-1.5 px-3">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAssigning(true)} className="btn-ghost text-sm flex items-center gap-1.5 self-start">
          <Plus size={14} />Assign Subject to Class
        </button>
      )}
      {error && <div className="text-xs text-[var(--danger)]">{error}</div>}
    </div>
  )
}

// ── Section Teacher Assignment Panel ───────────────
function SectionTeacherPanel({ sections, subjects }: { sections: any[]; subjects: any[] }) {
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? '')
  const [assigning, setAssigning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [error, setError] = useState('')

  const { data } = useGetTeachersBySectionSubjectsQuery(selectedSectionId, { skip: !selectedSectionId })
  const [assignTeacher] = useAssignTeacherToSectionMutation()
  const [removeTeacher] = useRemoveTeacherFromSectionMutation()

  const assignments = safeArray(data)

  const handleAssign = async () => {
    if (!subjectId || !teacherId) { setError('Both subject and teacher are required.'); return }
    setError('')
    try { await assignTeacher({ sectionId: selectedSectionId, body: { subjectId, teacherId } }).unwrap(); setAssigning(false); setSubjectId(''); setTeacherId('') }
    catch (err: any) { setError(err?.data?.message ?? 'Failed to assign.') }
  }
  const handleRemove = async (sId: string) => {
    try { await removeTeacher({ sectionId: selectedSectionId, body: { subjectId: sId } }).unwrap() }
    catch (err: any) { setError(err?.data?.message ?? 'Failed.') }
  }

  return (
    <div className="erp-card flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2"><Users size={15} className="text-[var(--secondary)]" />Section Subject-Teacher</h3>
        <select className="erp-input w-auto text-sm" value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)}>
          {sections.map(s => <option key={s.id} value={s.id}>{s.class?.name} - Sec {s.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {assignments.length === 0 && <div className="text-sm text-[var(--foreground-muted)] italic py-2">No assignments yet.</div>}
        {assignments.map((a: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-2.5 gap-3">
            <div>
              <div className="font-semibold text-sm text-[var(--foreground)]">{a.subject?.name ?? '—'}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{a.teacher?.user?.name ?? 'No teacher'}</div>
            </div>
            <button onClick={() => handleRemove(a.subject?.id)} className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-colors"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {assigning ? (
        <div className="flex flex-col gap-2">
          <select className="erp-input text-sm" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">Select subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Teacher</label>
            <TeacherSelect
              value={teacherId}
              onChange={setTeacherId}
              placeholder="Search & select teacher…"
            />
          </div>
          {error && <div className="text-xs text-[var(--danger)]">{error}</div>}
          <div className="flex gap-2">
            <button onClick={handleAssign} className="btn-primary flex-1 text-sm">Assign</button>
            <button onClick={() => setAssigning(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAssigning(true)} className="btn-ghost text-sm flex items-center gap-1.5 self-start">
          <Plus size={14} />Assign Teacher to Section-Subject
        </button>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────
export default function Subjects() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useListSubjectsQuery({ limit: 200 })
  const { data: classData } = useListClassesQuery({ limit: 200 })
  const { data: sectionData } = useListSectionsQuery({ limit: 200 })
  const [create, { isLoading: creating }] = useCreateSubjectMutation()
  const [update, { isLoading: updating }] = useUpdateSubjectMutation()

  const subjects = safeArray(data)
  const classes = safeArray(classData)
  const sections = safeArray(sectionData)

  const filtered = search ? subjects.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase())) : subjects

  return (
    <div className="p-5 flex flex-col gap-6">
      {modal && (
        <SubjectForm
          initial={modal === 'edit' ? editing : undefined}
          onClose={() => { setModal(null); setEditing(null) }}
          onSave={modal === 'edit'
            ? async (body) => { await update({ id: editing.id, body }).unwrap(); setModal(null); setEditing(null) }
            : async (body) => { await create(body).unwrap(); setModal(null) }
          }
          isLoading={modal === 'edit' ? updating : creating}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Subjects</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Manage subjects and their class/section-teacher assignments</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2"><Plus size={16} />New Subject</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject List */}
        <div className="erp-card flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <BookMarked size={15} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">All Subjects</h3>
            <span className="ml-auto text-xs text-[var(--foreground-muted)]">{subjects.length} total</span>
          </div>
          <input className="erp-input text-sm" placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)} />
          {isLoading ? <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
          : filtered.length === 0 ? <div className="text-sm text-[var(--foreground-muted)] text-center py-6">No subjects found.</div>
          : (
            <div className="flex flex-col divide-y divide-[var(--border)] overflow-y-auto max-h-96">
              {filtered.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 gap-2">
                  <div>
                    <div className="font-semibold text-sm text-[var(--foreground)]">{s.name}</div>
                    {s.code && <div className="text-xs font-mono text-[var(--foreground-muted)]">{s.code}</div>}
                  </div>
                  <button onClick={() => { setEditing(s); setModal('edit') }} className="p-1.5 rounded hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                    <Pencil size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignment panels */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {classes.length > 0 && <ClassAssignPanel classes={classes} subjects={subjects} />}
          {sections.length > 0 && <SectionTeacherPanel sections={sections} subjects={subjects} />}
        </div>
      </div>
    </div>
  )
}
