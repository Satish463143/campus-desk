'use client'
import React, { useState, useMemo } from 'react'
import Swal from 'sweetalert2'
import {
  Users, Plus, Search, Filter, Pencil, Trash2, Eye,
  GraduationCap, Briefcase, Phone, Mail, MapPin,
  BookOpen, TrendingUp, UserCheck, UserX,
  ChevronLeft, ChevronRight, X,
  DollarSign, Calendar, Building2, RefreshCw
} from 'lucide-react'
import {
  useListTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useGetTeacherByIdQuery,
} from '@/src/store/api/teacherApi'
import { useListSubjectsQuery } from '@/src/store/api/subjectApi'
import { useListClassesQuery } from '@/src/store/api/classApi'
import TeacherForm from './teacherForm'

// ── Helpers ────────────────────────────────────────────────────────────────
function safeArray(data: any): any[] {
  if (!data) return []
  const r = data.result ?? data.data ?? data
  return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
}

function safeMeta(data: any) {
  return data?.meta ?? data?.pagination ?? null
}

function initials(name: string) {
  return name?.split(' ').slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join('') ?? '?'
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
]
function avatarColor(id: string) {
  let h = 0; for (const c of id) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ── Teacher Avatar ──────────────────────────────────────────────────────────
function TeacherAvatar({ teacher, size = 'md' }: { teacher: any; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'
  if (teacher?.profileImage) {
    return <img src={teacher.profileImage} alt={teacher?.user?.name} className={`${dim} rounded-full object-cover shrink-0 ring-2 ring-[var(--border)]`} />
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${avatarColor(teacher?.id ?? 'x')} flex items-center justify-center font-bold text-white shrink-0`}>
      {initials(teacher?.user?.name ?? '')}
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
      ${isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Teacher Detail Drawer ───────────────────────────────────────────────────
function TeacherDrawer({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: () => void }) {
  const { data, isLoading } = useGetTeacherByIdQuery(id)
  const teacher = data?.result

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--border)] flex flex-col h-full shadow-2xl overflow-y-auto">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : teacher ? (
          <>
            {/* Drawer header */}
            <div className="relative bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] p-6 pb-16">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X size={16} className="text-white" />
              </button>
              <div className="flex items-center gap-4">
                <TeacherAvatar teacher={teacher} size="lg" />
                <div>
                  <h2 className="font-bold text-lg text-white">{teacher?.user?.name}</h2>
                  <p className="text-white/80 text-sm">{teacher?.designation || teacher?.department || 'Teacher'}</p>
                  <div className="mt-1"><StatusBadge status={teacher?.user?.status} /></div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="-mt-10 mx-4 grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Experience', value: teacher?.experienceYears != null ? `${teacher.experienceYears}y` : '—', icon: TrendingUp },
                { label: 'Emp ID', value: teacher?.employeeId || '—', icon: Briefcase },
                { label: 'Salary', value: teacher?.salary ? `₹${teacher.salary.toLocaleString()}` : '—', icon: DollarSign },
              ].map(s => (
                <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-2.5 text-center shadow-sm">
                  <s.icon size={14} className="mx-auto mb-1 text-[var(--primary)]" />
                  <div className="font-bold text-sm text-[var(--foreground)]">{s.value}</div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sections */}
            <div className="px-4 flex flex-col gap-4 pb-6">
              <Section title="Contact">
                <InfoRow icon={Mail} label="Email" value={teacher?.user?.email} />
                <InfoRow icon={Phone} label="Phone" value={teacher?.user?.phone} />
              </Section>
              <Section title="Employment">
                <InfoRow icon={Building2} label="Department" value={teacher?.department} />
                <InfoRow icon={GraduationCap} label="Qualification" value={teacher?.qualification} />
                <InfoRow icon={Calendar} label="Joining" value={teacher?.joiningDate?.slice(0, 10)} />
              </Section>
              {teacher?.address && (
                <Section title="Address">
                  <InfoRow icon={MapPin} label="Location" value={[teacher.address.district, teacher.address.province].filter(Boolean).join(', ')} />
                  <InfoRow icon={MapPin} label="Full" value={teacher.address.fullAddress} />
                </Section>
              )}
              {teacher?.sectionTeachers?.length > 0 && (
                <Section title={`Assigned Classes (${teacher.sectionTeachers.length})`}>
                  {teacher.sectionTeachers.map((st: any) => (
                    <div key={st.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                      <BookOpen size={13} className="text-[var(--primary)] shrink-0" />
                      <span className="text-sm text-[var(--foreground)]">{st.subject?.name}</span>
                      <span className="ml-auto text-xs text-[var(--foreground-muted)] bg-[var(--surface-raised)] px-2 py-0.5 rounded-full">
                        {st.section?.class?.name} · Sec {st.section?.name}
                      </span>
                    </div>
                  ))}
                </Section>
              )}
            </div>

            <div className="sticky bottom-0 bg-[var(--card-bg)] border-t border-[var(--border)] p-4">
              <button onClick={onEdit} className="btn-primary w-full flex items-center justify-center gap-2">
                <Pencil size={14} /> Edit Teacher
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--foreground-muted)]">Not found</div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">{title}</h4>
      <div className="bg-[var(--surface-raised)] rounded-xl p-3 flex flex-col gap-1">{children}</div>
    </div>
  )
}
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon size={13} className="text-[var(--foreground-muted)] mt-0.5 shrink-0" />
      <span className="text-xs text-[var(--foreground-muted)] w-20 shrink-0">{label}</span>
      <span className="text-sm text-[var(--foreground)] flex-1">{value}</span>
    </div>
  )
}


// ── Main Page ───────────────────────────────────────────────────────────────
export default function Teachers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)

  const LIMIT = 10

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: teacherData, isLoading, isFetching, refetch } = useListTeachersQuery({
    page, limit: LIMIT,
    search: search || undefined,
    status: (statusFilter as any) || undefined,
  })

  const { data: subjectData } = useListSubjectsQuery({ limit: 200 })
  const { data: classData } = useListClassesQuery({ limit: 200 })

  // Fetch FULL teacher detail for edit — list response may omit qualification/salary/experienceYears
  const { data: editTeacherData, isFetching: loadingEditTeacher } = useGetTeacherByIdQuery(
    editingId ?? '',
    { skip: !editingId || formMode !== 'edit' }
  )
  const editTeacherInitial = editTeacherData?.result ?? editTeacherData?.data

  const [createTeacher, { isLoading: creating }] = useCreateTeacherMutation()
  const [updateTeacher, { isLoading: updating }] = useUpdateTeacherMutation()
  const [deleteTeacher] = useDeleteTeacherMutation()

  const teachers = safeArray(teacherData)
  const meta = safeMeta(teacherData)
  const totalPages = meta?.totalPages ?? Math.ceil((meta?.total ?? 0) / LIMIT)
  const subjects = safeArray(subjectData)
  const classes = safeArray(classData)

  // Client-side dept filter (not supported by API)
  const filtered = useMemo(() => {
    if (!deptFilter) return teachers
    return teachers.filter((t: any) =>
      t.department?.toLowerCase().includes(deptFilter.toLowerCase())
    )
  }, [teachers, deptFilter])

  // Unique departments from current page
  const departments = useMemo(() => {
    const depts = teachers.map((t: any) => t.department).filter(Boolean)
    return [...new Set(depts)] as string[]
  }, [teachers])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const active = teachers.filter((t: any) => t.user?.status === 'active').length
  const inactive = teachers.length - active

  // ── Swal theme helper (matches dark mode via CSS var) ─────────────────────
  const swalTheme = {
    background: 'var(--card-bg)',
    color: 'var(--foreground)',
    confirmButtonColor: 'var(--primary)',
    cancelButtonColor: 'transparent',
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = async (fd: FormData) => {
    try {
      await createTeacher(fd).unwrap()
      setFormMode(null)
      setPage(1)
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Teacher created successfully!',
        showConfirmButton: false, timer: 2500, timerProgressBar: true,
        ...swalTheme,
      })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to create teacher', text: err?.data?.message ?? 'Something went wrong.', ...swalTheme })
      throw err  // let form display inline error too
    }
  }

  const handleUpdate = async (fd: FormData) => {
    if (!editingId) return
    try {
      await updateTeacher({ id: editingId, formData: fd }).unwrap()
      setFormMode(null)
      setEditingId(null)
      setViewId(null)
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Teacher updated successfully!',
        showConfirmButton: false, timer: 2500, timerProgressBar: true,
        ...swalTheme,
      })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to update teacher', text: err?.data?.message ?? 'Something went wrong.', ...swalTheme })
      throw err
    }
  }

  const handleDelete = async (teacher: any) => {
    const result = await Swal.fire({
      ...swalTheme,                          // base theme first
      title: 'Delete Teacher?',
      html: `<span style="color:var(--foreground-muted);font-size:14px">This will permanently remove <strong>${teacher.user?.name}</strong> from the system. This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',         // override theme's primary → red for destructive action
      reverseButtons: true,
    })
    if (!result.isConfirmed) return
    try {
      await deleteTeacher(teacher.id).unwrap()
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: `${teacher.user?.name} deleted.`,
        showConfirmButton: false, timer: 2000, timerProgressBar: true,
        ...swalTheme,
      })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Delete failed', text: err?.data?.message ?? 'Something went wrong.', ...swalTheme })
    }
  }

  const openEdit = (teacher: any) => {
    setEditingId(teacher.id)
    setFormMode('edit')
    setViewId(null)
  }

  return (
    <div className="p-5 flex flex-col gap-6">
      {/* ── Modals ── */}
      {formMode && (
        loadingEditTeacher && formMode === 'edit'
          ? (
            // Show loading spinner while fetching full teacher detail
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          )
          : (
            <TeacherForm
              initial={formMode === 'edit' ? editTeacherInitial : undefined}
              onClose={() => { setFormMode(null); setEditingId(null) }}
              onSave={formMode === 'edit' ? handleUpdate : handleCreate}
              isLoading={formMode === 'edit' ? updating : creating}
            />
          )
      )}
      {viewId && (
        <TeacherDrawer
          id={viewId}
          onClose={() => setViewId(null)}
          onEdit={() => { const t = teachers.find((x: any) => x.id === viewId); if (t) openEdit(t) }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Users size={24} className="text-[var(--primary)]" /> Teachers
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
            Manage teacher profiles, assignments, and employment details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setFormMode('create')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Teachers', value: meta?.total ?? teachers.length, icon: Users, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Active', value: active, icon: UserCheck, color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'Inactive', value: inactive, icon: UserX, color: 'var(--danger)', bg: 'var(--danger-bg)' },
          { label: 'Subjects Covered', value: subjects.length, icon: BookOpen, color: 'var(--info)', bg: 'var(--info-bg)' },
        ].map(s => (
          <div key={s.label} className="erp-card flex items-center gap-3 group hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ background: s.bg, color: s.color }}>
              <s.icon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--foreground)]">{s.value}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="erp-card flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
          {/* Search Bar */}
          <div className="relative flex-1 w-full sm:min-w-[300px]">
            <input
              className="erp-input pl-10 w-full"
              placeholder="Search by name, email, or department…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Quick Status Filter */}
          <select
            className="erp-input w-full sm:w-auto"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            <option value="active">🟢 Active</option>
            <option value="inactive">🔴 Inactive</option>
          </select>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border-2 text-sm font-semibold transition-all w-full sm:w-auto ${
              showFilters 
                ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]' 
                : 'bg-transparent border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]'
            }`}
          >
            <Filter size={16} />
            Filters
            {deptFilter && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px]">
                1
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-[var(--border)] animate-fade-in">
            <div className="flex flex-col gap-1.5 flex-1 sm:flex-none sm:min-w-[200px]">
              <label className="text-xs text-[var(--foreground-muted)] font-bold uppercase tracking-wide">
                Department
              </label>
              <select
                className="erp-input w-full"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            {deptFilter && (
              <button
                onClick={() => setDeptFilter('')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-[var(--radius-md)] transition-all"
              >
                <X size={14} /> Clear Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="erp-card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-[var(--foreground-muted)]">
            <Users size={44} opacity={0.25} />
            <p className="font-semibold">No teachers found</p>
            <p className="text-sm">Try adjusting filters or add a new teacher</p>
            <button onClick={() => setFormMode('create')} className="btn-primary text-sm mt-1">
              <Plus size={14} className="mr-1" /> Add First Teacher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  {['Teacher', 'Contact', 'Department', 'Qualification', 'Joining', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((teacher: any) => (
                  <tr key={teacher.id}
                    className="hover:bg-[var(--surface-raised)] transition-colors group cursor-pointer"
                    onClick={() => setViewId(teacher.id)}
                  >
                    {/* Teacher */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar teacher={teacher} size="sm" />
                        <div>
                          <div className="font-semibold text-[var(--foreground)]">{teacher.user?.name}</div>
                          <div className="text-xs text-[var(--foreground-muted)]">{teacher.designation || teacher.employeeId || '—'}</div>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--foreground-muted)] flex flex-col gap-0.5">
                        <span className="flex items-center gap-1"><Mail size={11} />{teacher.user?.email}</span>
                        <span className="flex items-center gap-1"><Phone size={11} />{teacher.user?.phone}</span>
                      </div>
                    </td>
                    {/* Dept */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground)]">{teacher.department || '—'}</span>
                    </td>
                    {/* Qualification */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground)]">{teacher.qualification || '—'}</span>
                    </td>
                    {/* Joining */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--foreground-muted)]">
                      {teacher.joiningDate?.slice(0, 10) || '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={teacher.user?.status} />
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewId(teacher.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--primary-light)] text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(teacher)}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher)}
                          className="p-1.5 rounded-lg hover:bg-[var(--danger-bg)] text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--foreground-muted)]">
            Page <span className="font-semibold text-[var(--foreground)]">{page}</span> of <span className="font-semibold text-[var(--foreground)]">{totalPages}</span>
            {meta?.total && <> · <span className="font-semibold text-[var(--foreground)]">{meta.total}</span> total</>}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost p-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors
                    ${p === page ? 'bg-[var(--primary)] text-white' : 'btn-ghost'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost p-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
