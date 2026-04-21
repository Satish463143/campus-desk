'use client'
import React, { useState, useEffect } from 'react'
import { CalendarDays, Users, Sun, Plus, ChevronRight } from 'lucide-react'
import { useListAcademicYearsQuery } from '@/src/store/api/academicYearApi'
import { useListClassesQuery } from '@/src/store/api/classApi'
import { useListSectionsQuery } from '@/src/store/api/sectionApi'
import { useListSubjectsQuery } from '@/src/store/api/subjectApi'
import { useGetPeriodsQuery } from '@/src/store/api/periodApi'
import {
  useBulkCreateTimetableMutation,
  useUpdateTimetableMutation,
  useDeleteTimetableMutation,
} from '@/src/store/api/timetableApi'
import Swal from 'sweetalert2'
import EntryForm     from './EntryForm'
import SectionGrid   from './SectionGrid'
import TeacherSchedule from './TeacherSchedule'
import TodaySchedule from './TodaySchedule'
import { safeArray } from './timetableUtils'

type Tab = 'section' | 'teacher' | 'today'

type ModalState = {
  type: 'create' | 'edit'
  entry?: any
  preDay?: string
  prePeriod?: string
} | null

const TABS: { id: Tab; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'section',  label: 'Section Schedule', icon: CalendarDays, hint: 'Weekly timetable by class & section' },
  { id: 'teacher',  label: 'Teacher Schedule', icon: Users,        hint: "A teacher's full weekly schedule" },
  { id: 'today',    label: "Today's Schedule", icon: Sun,          hint: 'All classes running today' },
]

export default function Timetable() {
  const [activeTab,   setActiveTab]   = useState<Tab>('section')
  const [yearFilter,  setYearFilter]  = useState('')
  const [classId,     setClassId]     = useState('')
  const [sectionId,   setSectionId]   = useState('')
  const [modal,       setModal]       = useState<ModalState>(null)

  // ── Shared data ──────────────────────────────────────────────────────────
  const { data: yearsData   } = useListAcademicYearsQuery({ limit: 50 })
  const { data: classData   } = useListClassesQuery({ limit: 200 })
  const { data: subjectData } = useListSubjectsQuery({ limit: 200 })

  // All sections — needed by EntryForm (has its own class selector inside)
  const { data: allSectionData } = useListSectionsQuery({ limit: 200 })

  const years      = safeArray(yearsData)
  const classes    = [...safeArray(classData)].sort((a, b) => a.numericLevel - b.numericLevel)
  const subjects   = safeArray(subjectData)
  const allSections = safeArray(allSectionData)

  // Auto-select the active academic year
  useEffect(() => {
    if (!yearFilter && years.length > 0) {
      const active = years.find((y: any) => y.isActive) ?? years[0]
      if (active) setYearFilter(active.id)
    }
  }, [years.length])

  const { data: periodData } = useGetPeriodsQuery(
    { academicYearId: yearFilter, limit: 100 },
    { skip: !yearFilter }
  )
  const periods = [...safeArray(periodData)]
    .filter(p => !p.isBreak && p.isActive)
    .sort((a, b) => a.periodNumber - b.periodNumber)

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateTimetableMutation()
  const [update,     { isLoading: updating }]     = useUpdateTimetableMutation()
  const [deleteTT]                                = useDeleteTimetableMutation()

  const swalTheme = {
    background: 'var(--card-bg)',
    color: 'var(--foreground)',
  }

  const handleSave = async (formData: any) => {
    if (modal?.type === 'edit') {
      const { selectedDays: _sd, ...body } = formData
      await update({ id: modal.entry.id, body: { ...body, dayOfWeek: _sd?.[0] } }).unwrap()
      Swal.fire({
        ...swalTheme, toast: true, position: 'top-end', icon: 'success',
        title: 'Entry updated!', showConfirmButton: false, timer: 2000,
      })
    } else {
      const { selectedDays, ...rest } = formData
      const entries = selectedDays.map((dayOfWeek: string) => ({ ...rest, dayOfWeek }))
      await bulkCreate({ entries, academicYearId: yearFilter }).unwrap()
      Swal.fire({
        ...swalTheme, toast: true, position: 'top-end', icon: 'success',
        title: `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} created!`,
        showConfirmButton: false, timer: 2000,
      })
    }
    setModal(null)
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      ...swalTheme,
      title: 'Delete this entry?',
      text: 'This timetable slot will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    try {
      await deleteTT(id).unwrap()
      Swal.fire({
        ...swalTheme, toast: true, position: 'top-end', icon: 'success',
        title: 'Entry deleted', showConfirmButton: false, timer: 1500,
      })
    } catch (err: any) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Delete failed', text: err?.data?.message })
    }
  }

  const selectedYear    = years.find((y: any) => y.id === yearFilter)
  const selectedSection = allSections.find(s => s.id === sectionId)

  return (
    <div className="p-5 flex flex-col gap-6">

      {/* Entry Form Modal */}
      {modal && (
        <EntryForm
          initial={modal.entry}
          preDay={modal.preDay}
          prePeriod={modal.prePeriod}
          preClassId={classId}
          preSectionId={sectionId}
          classes={classes}
          allSections={allSections}
          subjects={subjects}
          periods={periods}
          isLoading={modal.type === 'edit' ? updating : bulkCreating}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <CalendarDays className="text-[var(--primary)]" size={22} />
            Timetable
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Smart schedule management</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Academic year selector */}
          <select
            className="erp-input w-auto text-sm"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            {years.map((y: any) => (
              <option key={y.id} value={y.id}>
                {y.name}{y.isActive ? ' (Active)' : ''}
              </option>
            ))}
          </select>

          {/* Add Entry — only meaningful in Section tab when a section is selected */}
          {activeTab === 'section' && (
            <button
              onClick={() => setModal({ type: 'create' })}
              disabled={!sectionId}
              title={!sectionId ? 'Select a class & section first' : 'Add new timetable entry'}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] w-fit">
        {TABS.map(({ id, label, icon: Icon, hint }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={hint}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Context breadcrumb (section tab) ──────────────────────────────── */}
      {activeTab === 'section' && sectionId && selectedSection && (
        <div className="flex items-center gap-2 text-sm animate-fade-in">
          <span className="text-[var(--foreground-muted)]">Viewing timetable for</span>
          <span className="px-2.5 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
            {classes.find(c => c.id === classId)?.name ?? 'Class'}
          </span>
          <ChevronRight size={13} className="text-[var(--foreground-muted)]" />
          <span className="px-2.5 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold border border-[var(--primary)] border-opacity-40">
            Section {selectedSection.name}
          </span>
          {selectedYear && (
            <>
              <span className="text-[var(--foreground-muted)] mx-1">·</span>
              <span className="text-xs text-[var(--foreground-muted)]">{selectedYear.name}</span>
            </>
          )}
        </div>
      )}

      {/* ── No year configured ────────────────────────────────────────────── */}
      {!yearFilter ? (
        <div className="erp-card flex flex-col items-center py-20 gap-4 text-[var(--foreground-muted)]">
          <CalendarDays size={40} opacity={0.3} />
          <p className="text-sm font-medium">No academic year available.</p>
          <p className="text-xs">Configure an academic year first to manage timetables.</p>
        </div>
      ) : (

        /* ── Tab Content ────────────────────────────────────────────────── */
        <>
          {activeTab === 'section' && (
            <SectionGrid
              academicYearId={yearFilter}
              classId={classId}
              sectionId={sectionId}
              onClassChange={id => { setClassId(id); setSectionId('') }}
              onSectionChange={setSectionId}
              classes={classes}
              allSections={allSections}
              periods={periods}
              onAddEntry={(preDay, prePeriod) => setModal({ type: 'create', preDay, prePeriod })}
              onEdit={entry => setModal({ type: 'edit', entry })}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'teacher' && (
            <TeacherSchedule
              academicYearId={yearFilter}
              periods={periods}
              onEdit={entry  => setModal({ type: 'edit', entry })}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'today' && (
            <TodaySchedule
              academicYearId={yearFilter}
              classes={classes}
            />
          )}
        </>
      )}
    </div>
  )
}
