'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  BookOpen, Plus, Pencil, X, AlertCircle, Users, ChevronRight,
  ChevronDown, UserCheck, BookMarked, GraduationCap, Hash, LayoutGrid
} from 'lucide-react'
import { useListClassesQuery, useCreateClassMutation, useUpdateClassMutation } from '@/src/store/api/classApi'
import { useListSectionsQuery, useCreateSectionMutation, useUpdateSectionMutation } from '@/src/store/api/sectionApi'
import { useListAcademicYearsQuery } from '@/src/store/api/academicYearApi'
import { useGetTeachersBySectionSubjectsQuery } from '@/src/store/api/subjectApi'

// ── Safe array extractor (handles both {result:[]} and {data:[]} shapes) ──────
function safeArray(data: any): any[] {
  if (!data) return []
  const r = data.result ?? data.data ?? data
  return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

// ── Yup Schemas ────────────────────────────────────
const classSchema = yup.object({
  academicYearId: yup.string().required('Academic year is required'),
  name: yup.string().trim().min(1).max(100).required('Class name is required'),
  numericLevel: yup.number().typeError('Level must be a number').integer('Level must be an integer').min(1, 'Level must be at least 1').required('Level is required'),
})

const sectionSchema = yup.object({
  classId: yup.string().required('Class is required'),
  name: yup.string().trim().min(1).max(10).required('Section name is required'),
  capacity: yup.number().typeError('Must be a number').integer().min(1).optional().nullable(),
  classTeacherId: yup.string().optional().nullable(),
})

type ClassFormValues = yup.InferType<typeof classSchema>
type SectionFormValues = yup.InferType<typeof sectionSchema>

// ── Class Form Modal ───────────────────────────────
function ClassModal({ initial, years, onClose, onSave, isLoading }: {
  initial?: any; years: any[]; onClose: () => void; onSave: (b: any) => Promise<void>; isLoading: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ClassFormValues>({
    resolver: yupResolver(classSchema),
    defaultValues: {
      academicYearId: initial?.academicYearId ?? years.find(y => y.isActive)?.id ?? '',
      name: initial?.name ?? '',
      numericLevel: initial?.numericLevel ?? undefined,
    },
  })
  const [serverError, setServerError] = useState('')

  const onSubmit = async (values: ClassFormValues) => {
    setServerError('')
    try { await onSave(values) }
    catch (err: any) { setServerError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--primary)]" />
            {initial ? 'Edit Class' : 'Create New Class'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] transition-colors">
            <X size={18} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Academic Year *</label>
            <select {...register('academicYearId')} className="erp-input" disabled={!!initial}>
              <option value="">Select year…</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>)}
            </select>
            {errors.academicYearId && <p className="mt-1 text-xs text-[var(--danger)]">{errors.academicYearId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Class Name *</label>
              <input {...register('name')} className="erp-input" placeholder="e.g. Class 10" />
              {errors.name && <p className="mt-1 text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Level *</label>
              <input {...register('numericLevel')} type="number" min={1} className="erp-input" placeholder="10" />
              {errors.numericLevel && <p className="mt-1 text-xs text-[var(--danger)]">{errors.numericLevel.message}</p>}
            </div>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm">
              <AlertCircle size={14} />{serverError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving…' : initial ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Section Form Modal ─────────────────────────────
function SectionModal({ initial, fixedClassId, fixedClassName, classes, onClose, onSave, isLoading }: {
  initial?: any; fixedClassId?: string; fixedClassName?: string
  classes: any[]; onClose: () => void; onSave: (b: any) => Promise<void>; isLoading: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<SectionFormValues>({
    resolver: yupResolver(sectionSchema),
    defaultValues: {
      classId: initial?.classId ?? fixedClassId ?? '',
      name: initial?.name ?? '',
      capacity: initial?.capacity ?? null,
      classTeacherId: initial?.classTeacherId ?? null,
    },
  })
  const [serverError, setServerError] = useState('')

  const onSubmit = async (values: SectionFormValues) => {
    setServerError('')
    // updateSectionDTO only accepts: name, capacity, classTeacherId
    // classId is NOT allowed on update — the backend derives it from the existing record
    const body: any = { name: values.name }
    if (values.capacity != null) body.capacity = Number(values.capacity)
    if (values.classTeacherId?.trim()) body.classTeacherId = values.classTeacherId.trim()
    try { await onSave(body) }
    catch (err: any) { setServerError(err?.data?.message ?? 'Failed to save.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-4  flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <Users size={18} className="text-[var(--secondary)]" />
            {initial ? 'Edit Section' : `Add Section${fixedClassName ? ` to ${fixedClassName}` : ''}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] transition-colors">
            <X size={18} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Class selector — hidden if fixedClassId */}
          {!fixedClassId && (
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Class *</label>
              <select {...register('classId')} className="erp-input">
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.classId && <p className="mt-1 text-xs text-[var(--danger)]">{errors.classId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Section Name *</label>
              <input {...register('name')} className="erp-input" placeholder="e.g. A" maxLength={10} />
              {errors.name && <p className="mt-1 text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">Capacity</label>
              <input {...register('capacity')} type="number" min={1} className="erp-input" placeholder="40" />
              {errors.capacity && <p className="mt-1 text-xs text-[var(--danger)]">{errors.capacity.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">
              Class Teacher ID <span className="normal-case font-normal text-[var(--foreground-muted)]">(optional)</span>
            </label>
            <input {...register('classTeacherId')} className="erp-input" placeholder="Teacher Profile UUID" />
          </div>

          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm">
              <AlertCircle size={14} />{serverError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving…' : initial ? 'Update Section' : 'Add Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Section Subject-Teacher Drawer ─────────────────
function SubjectTeacherDrawer({ section, onClose }: { section: any; onClose: () => void }) {
  const { data, isLoading } = useGetTeachersBySectionSubjectsQuery(section.id)
  const assignments = safeArray(data)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-[var(--card-bg)] border-l border-[var(--card-border)] shadow-2xl w-80 flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
              <BookMarked size={15} className="text-[var(--primary)]" />
              Section {section.name}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Subject-Teacher Assignments</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-raised)]"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-[var(--foreground-muted)]">
              <BookMarked size={32} opacity={0.3} />
              <p className="text-sm text-center">No subject-teacher assignments.<br />Go to Subjects to assign.</p>
            </div>
          ) : assignments.map((a: any, i: number) => (
            <div key={i} className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <BookMarked size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-[var(--foreground)] truncate">{a.subject?.name ?? '—'}</div>
                <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-0.5">
                  <UserCheck size={10} />{a.teacher?.user?.name ?? 'Unassigned'}
                </div>
              </div>
              {a.subject?.code && <span className="font-mono text-xs bg-[var(--primary-light)] text-[var(--primary)] px-1.5 py-0.5 rounded shrink-0">{a.subject.code}</span>}
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-xs text-[var(--foreground-muted)] text-center">Manage assignments via Subjects page</p>
        </div>
      </div>
    </div>
  )
}

// ── Sections Panel (right) ─────────────────────────
function SectionsPanel({ selectedClass, allSections, onAddSection, onEditSection }: {
  selectedClass: any
  allSections: any[]
  onAddSection: () => void
  onEditSection: (s: any) => void
}) {
  const [drawerSection, setDrawerSection] = useState<any>(null)
  const sections = allSections.filter(s => (s.class?.id ?? s.classId) === selectedClass.id)

  return (
    <>
      {drawerSection && <SubjectTeacherDrawer section={drawerSection} onClose={() => setDrawerSection(null)} />}
      <div className="flex flex-col h-full">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-lg">
              {selectedClass.numericLevel}
            </div>
            <div>
              <h2 className="font-bold text-[var(--foreground)]">{selectedClass.name}</h2>
              <p className="text-xs text-[var(--foreground-muted)]">{selectedClass.academicYear?.name ?? '—'} · {sections.length} section{sections.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onAddSection} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={14} />Add Section
          </button>
        </div>

        {/* Sections grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-[var(--foreground-muted)]">
              <LayoutGrid size={40} opacity={0.3} />
              <p className="text-sm">No sections for this class yet.</p>
              <button onClick={onAddSection} className="btn-primary text-sm flex items-center gap-1.5"><Plus size={14} />Add First Section</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections.map((s: any) => (
                <div key={s.id} className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--primary)] hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--secondary)] to-[var(--primary)] text-white flex items-center justify-center font-black text-xl shadow-md">
                        {s.name}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--foreground)]">Section {s.name}</div>
                        {s.capacity && (
                          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] mt-0.5">
                            <Users size={10} />{s.capacity} capacity
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => onEditSection(s)} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                      <Pencil size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] pt-1 border-t border-[var(--border)]">
                    <UserCheck size={12} className="shrink-0" />
                    <span className="truncate">{s.classTeacher?.user?.name ?? 'No class teacher'}</span>
                  </div>

                  <button
                    onClick={() => setDrawerSection(s)}
                    className="w-full text-xs py-1.5 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookMarked size={11} />View Subject-Teachers
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main Page Component ────────────────────────────
export default function ClassesAndSections() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState('')

  // Class modal state
  const [classModal, setClassModal] = useState<'create' | 'edit' | null>(null)
  const [editingClass, setEditingClass] = useState<any>(null)

  // Section modal state
  const [sectionModal, setSectionModal] = useState<'create' | 'edit' | null>(null)
  const [editingSection, setEditingSection] = useState<any>(null)

  const { data: yearsData } = useListAcademicYearsQuery({ limit: 50 })
  const { data: classData, isLoading: classLoading } = useListClassesQuery({ limit: 200, academicYearId: yearFilter || undefined })
  const { data: sectionData } = useListSectionsQuery({ limit: 500 })

  const [createClass, { isLoading: creatingClass }] = useCreateClassMutation()
  const [updateClass, { isLoading: updatingClass }] = useUpdateClassMutation()
  const [createSection, { isLoading: creatingSection }] = useCreateSectionMutation()
  const [updateSection, { isLoading: updatingSection }] = useUpdateSectionMutation()

  const years = safeArray(yearsData)
  const classes = [...safeArray(classData)].sort((a, b) => a.numericLevel - b.numericLevel)
  const sections = safeArray(sectionData)

  const selectedClass = classes.find(c => c.id === selectedClassId) ?? classes[0] ?? null

  // Auto-select first class when list loads
  React.useEffect(() => {
    if (!selectedClassId && classes.length > 0) setSelectedClassId(classes[0].id)
  }, [classes.length])

  const sectionsForClass = (classId: string) => sections.filter(s => (s.class?.id ?? s.classId) === classId)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Modals ─────────────────────────────────── */}
      {classModal && (
        <ClassModal
          initial={classModal === 'edit' ? editingClass : undefined}
          years={years}
          onClose={() => { setClassModal(null); setEditingClass(null) }}
          onSave={classModal === 'edit'
            ? async ({ academicYearId: _ay, ...body }) => { await updateClass({ id: editingClass.id, body }).unwrap(); setClassModal(null); setEditingClass(null) }
            : async (body) => { await createClass(body).unwrap(); setClassModal(null) }
          }
          isLoading={classModal === 'edit' ? updatingClass : creatingClass}
        />
      )}
      {sectionModal && (
        <SectionModal
          initial={sectionModal === 'edit' ? editingSection : undefined}
          fixedClassId={sectionModal === 'create' ? selectedClass?.id : undefined}
          fixedClassName={sectionModal === 'create' ? selectedClass?.name : undefined}
          classes={classes}
          onClose={() => { setSectionModal(null); setEditingSection(null) }}
          onSave={sectionModal === 'edit'
            ? async (body) => { await updateSection({ id: editingSection.id, body }).unwrap(); setSectionModal(null); setEditingSection(null) }
            : async (body) => { await createSection({ ...body, classId: selectedClass?.id }).unwrap(); setSectionModal(null) }
          }
          isLoading={sectionModal === 'edit' ? updatingSection : creatingSection}
        />
      )}

      {/* ── Left: Class List ───────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--card-bg)]">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
                <GraduationCap size={18} className="text-[var(--primary)]" />Classes
              </h1>
              <p className="text-xs text-[var(--foreground-muted)]">{classes.length} classes configured</p>
            </div>
            <button
              onClick={() => setClassModal('create')}
              className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
              title="New Class"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Year filter */}
          <select className="erp-input text-xs" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="">All Academic Years</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' ✓' : ''}</option>)}
          </select>
        </div>

        {/* Class list */}
        <div className="flex-1 overflow-y-auto py-2">
          {classLoading ? (
            <div className="flex justify-center pt-8"><div className="w-6 h-6 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center py-10 px-4 gap-2 text-[var(--foreground-muted)]">
              <BookOpen size={32} opacity={0.3} />
              <p className="text-xs text-center">No classes yet. Create your first class.</p>
            </div>
          ) : (
            classes.map(cls => {
              const secCount = sectionsForClass(cls.id).length
              const isSelected = cls.id === selectedClassId
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-2 group
                    ${isSelected
                      ? 'bg-[var(--primary-light)] border-l-[var(--primary)]'
                      : 'border-l-transparent hover:bg-[var(--surface-raised)]'}`}
                >
                  {/* Level badge */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                    ${isSelected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-raised)] text-[var(--foreground-muted)] group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary)]'}`}>
                    {cls.numericLevel}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{cls.name}</div>
                    <div className="text-xs text-[var(--foreground-muted)] truncate">{secCount} section{secCount !== 1 ? 's' : ''}</div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingClass(cls); setClassModal('edit') }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)]"
                    >
                      <Pencil size={12} />
                    </button>
                    {isSelected && <ChevronRight size={14} className="text-[var(--primary)]" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer stats */}
        <div className="border-t border-[var(--border)] px-4 py-3 grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="font-bold text-[var(--foreground)]">{classes.length}</div>
            <div className="text-xs text-[var(--foreground-muted)]">Classes</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-[var(--foreground)]">{sections.length}</div>
            <div className="text-xs text-[var(--foreground-muted)]">Sections</div>
          </div>
        </div>
      </div>

      {/* ── Right: Sections Panel ──────────────────── */}
      <div className="flex-1 overflow-hidden">
        {selectedClass ? (
          <SectionsPanel
            selectedClass={selectedClass}
            allSections={sections}
            onAddSection={() => setSectionModal('create')}
            onEditSection={s => { setEditingSection(s); setSectionModal('edit') }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--foreground-muted)]">
            <GraduationCap size={56} opacity={0.2} />
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">Select a class</p>
              <p className="text-sm">Choose a class from the left panel to view and manage its sections.</p>
            </div>
            <button onClick={() => setClassModal('create')} className="btn-primary flex items-center gap-2">
              <Plus size={15} />Create First Class
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
