'use client'
import React, { useState } from 'react'
import {
  GraduationCap, Users, UserCheck, UserX, ArrowRightLeft,
  Globe, Plus, Upload } from 'lucide-react'
import { useListStudentsQuery } from '@/src/store/api/studentApi'
import { useListClassesQuery } from '@/src/store/api/classApi'
import StudentForm from './StudentForm'
import StudentsTab from './tabs/Students'
import OnlineAdmission from './tabs/OnlineAdmission'
import MigratedStudents from './tabs/MigratedStudents'
import InactiveStudents from './tabs/InactiveStudents'

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, accent }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; accent: string;
}) {
  return (
    <div className={`erp-card flex items-center gap-3 border-l-4 ${accent}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
        <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ── Tab config ────────────────────────────────────────────────────────────
type TabId = 'students' | 'online' | 'migrated' | 'inactive'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'students',  label: 'All Students',     icon: Users },
  { id: 'online',   label: 'Online Admissions', icon: Globe },
  { id: 'migrated', label: 'Migrated',          icon: ArrowRightLeft },
  { id: 'inactive', label: 'Inactive',          icon: UserX },
]

// ── Class breakdown strip ─────────────────────────────────────────────────
const CLASS_COLORS = [
  'bg-violet-50 border-violet-200 text-violet-700',
  'bg-sky-50 border-sky-200 text-sky-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-rose-50 border-rose-200 text-rose-700',
  'bg-indigo-50 border-indigo-200 text-indigo-700',
]

// ── Main ──────────────────────────────────────────────────────────────────
export default function Student({ canEdit = true }: { canEdit?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>('students')
  const [showForm, setShowForm] = useState(false)

  // Load stats
  const { data: allData }      = useListStudentsQuery({ limit: 1 })
  const { data: activeData }   = useListStudentsQuery({ academicStatus: 'active',      limit: 1 })
  const { data: inactiveData } = useListStudentsQuery({ academicStatus: 'inactive',    limit: 1 })
  const { data: migrData }     = useListStudentsQuery({ academicStatus: 'transferred', limit: 1 })
  const { data: classData }    = useListClassesQuery({ limit: 200 })

  const total    = allData?.meta?.total      ?? 0
  const active   = activeData?.meta?.total   ?? 0
  const inactive = inactiveData?.meta?.total ?? 0
  const migrated = migrData?.meta?.total     ?? 0

  const classes = (classData?.result ?? [])
    .sort((a: any, b: any) => a.numericLevel - b.numericLevel)
    .slice(0, 6)

  return (
    <div className="p-5 flex flex-col gap-6 max-w-7xl">

      {/* Admission form modal */}
      {showForm && <StudentForm onClose={() => setShowForm(false)} />}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Student Management</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Manage student records and admissions</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-2 text-sm">
              <Upload size={14} /> Bulk Import
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={15} /> New Admission
            </button>
          </div>
        )}
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Students"  value={total}    icon={Users}          color="bg-violet-100 text-violet-700"  accent="border-l-violet-500" />
        <StatCard label="Active"          value={active}   icon={UserCheck}      color="bg-emerald-100 text-emerald-700" accent="border-l-emerald-500" />
        <StatCard label="Inactive"        value={inactive} icon={UserX}          color="bg-red-100 text-red-700"         accent="border-l-red-500" />
        <StatCard label="Transferred"     value={migrated} icon={ArrowRightLeft}  color="bg-amber-100 text-amber-700"     accent="border-l-amber-500" />
      </div>

      {/* ── Class Breakdown ───────────────────────────────────────────────── */}
      {classes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {classes.map((c: any, i: number) => (
            <div
              key={c.id}
              className={`rounded-xl border px-4 py-3 flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow ${CLASS_COLORS[i % CLASS_COLORS.length]}`}
            >
              <div className="text-xs font-semibold opacity-70">{c.name}</div>
              <div className="text-xl font-bold">—</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs + Content ────────────────────────────────────────────────── */}
      <div className="erp-card flex flex-col gap-4">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] -mx-[var(--card-padding)] px-[var(--card-padding)] pb-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex flex-col gap-4 pt-1">
          {activeTab === 'students'  && <StudentsTab canEdit={canEdit} />}
          {activeTab === 'online'    && <OnlineAdmission />}
          {activeTab === 'migrated'  && <MigratedStudents />}
          {activeTab === 'inactive'  && <InactiveStudents />}
        </div>
      </div>
    </div>
  )
}