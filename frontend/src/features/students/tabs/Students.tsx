'use client'
import React, { useState } from 'react'
import {
  Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  UserX, Filter, X,
} from 'lucide-react'
import { useListStudentsQuery, useDeleteStudentProfileMutation } from '@/src/store/api/studentApi'
import { useListClassesQuery } from '@/src/store/api/classApi'
import Swal from 'sweetalert2'
import StudentProfile from '../StudentProfile'
import { safeStudents, initials, avatarColor, STATUS_STYLE, STATUS_DOT, fmtDate } from '../studentUtils'

interface Props { canEdit?: boolean }

export default function StudentsTab({ canEdit }: Props) {
  const [page, setPage]          = useState(1)
  const [search, setSearch]      = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewId, setViewId]      = useState<string | null>(null)

  const { data, isLoading, isFetching } = useListStudentsQuery({
    page, limit: 15,
    search: search || undefined,
    class: classFilter || undefined,
    academicStatus: statusFilter || undefined,
  })
  const { data: classData } = useListClassesQuery({ limit: 200 })
  const [deleteStudent, { isLoading: deleting }] = useDeleteStudentProfileMutation()

  const students = safeStudents(data)
  const total    = data?.meta?.total ?? 0
  const pages    = Math.ceil(total / 15)
  const classes  = [...(classData?.data ?? classData?.result ?? [])].sort((a: any, b: any) => a.numericLevel - b.numericLevel)

  const hasFilters = !!search || !!classFilter || !!statusFilter
  const clearFilters = () => { setSearch(''); setClassFilter(''); setStatusFilter(''); setPage(1) }

  const swalTheme = { background: 'var(--card-bg)', color: 'var(--foreground)' }

  const handleDelete = async (s: any) => {
    const result = await Swal.fire({
      ...swalTheme,
      title: 'Delete student?',
      html: `<span style="color:var(--foreground-muted);font-size:14px;">This will permanently remove <strong>${s.name}</strong>'s record.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    try {
      await deleteStudent(s.studentProfile?.id ?? s.id).unwrap()
      Swal.fire({ ...swalTheme, toast: true, position: 'top-end', icon: 'success', title: 'Student deleted', showConfirmButton: false, timer: 1800 })
    } catch (err: any) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Failed', text: err?.data?.message })
    }
  }

  return (
    <>
      {/* Profile modal */}
      {viewId && <StudentProfile studentId={viewId} canEdit={canEdit} onClose={() => setViewId(null)} />}

      {/* Filter bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-[400px]">
          <input
            className="erp-input pl-9 text-sm"
            placeholder="Search by name, email, admission no…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select className="erp-input w-auto text-sm" value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1) }}>
          <option value="">All Classes</option>
          {classes.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select className="erp-input w-auto text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['active', 'inactive', 'graduated', 'dropped', 'transferred'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            <X size={11} /> Clear
          </button>
        )}

        <span className="text-xs text-[var(--foreground-muted)] ml-auto">
          {total} student{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 text-[var(--foreground-muted)]">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center">
            <UserX size={28} opacity={0.4} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--foreground)]">{hasFilters ? 'No students match your filters' : 'No students yet'}</p>
            <p className="text-sm mt-0.5">{hasFilters ? 'Try adjusting the filters.' : 'Start by admitting a new student.'}</p>
          </div>
          {hasFilters && <button onClick={clearFilters} className="btn-ghost text-sm">Clear filters</button>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="text-left text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2.5 pr-4">Student</th>
                <th className="pb-2.5 pr-4">Class</th>
                <th className="pb-2.5 pr-4">Admission No.</th>
                <th className="pb-2.5 pr-4">Contact</th>
                <th className="pb-2.5 pr-4">Status</th>
                <th className="pb-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {students.map((s: any) => {
                const status = s.studentProfile?.academicStatus ?? s.academicStatus ?? 'active'
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-[var(--surface-raised)] transition-colors cursor-pointer ${isFetching ? 'opacity-60' : ''}`}
                    onClick={() => setViewId(s.studentProfile?.id ?? s.id)}
                  >
                    {/* Student */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        {s.profileImage ? (
                          <img src={s.profileImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(s.name)}`}>
                            {initials(s.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--foreground)] truncate">{s.name}</div>
                          <div className="text-xs text-[var(--foreground-muted)] truncate">{s.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3 pr-4">
                      <div className="font-medium text-[var(--foreground)]">{s.studentProfile?.class ?? s.class ?? '—'}</div>
                      {(s.studentProfile?.section ?? s.section) && (
                        <div className="text-xs text-[var(--foreground-muted)]">Sec {s.studentProfile?.section ?? s.section}</div>
                      )}
                    </td>

                    {/* Admission No */}
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--foreground-muted)]">
                      {s.studentProfile?.admissionNumber ?? '—'}
                    </td>

                    {/* Contact */}
                    <td className="py-3 pr-4 text-xs text-[var(--foreground-muted)]">
                      {s.phone ?? '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status] ?? ''}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-400'}`} />
                        {status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewId(s.studentProfile?.id ?? s.id)}
                          className="p-1.5 rounded-lg bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors"
                          title="View profile"
                        >
                          <Eye size={13} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setViewId(s.studentProfile?.id ?? s.id)}
                              className="p-1.5 rounded-lg bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              disabled={deleting}
                              className="p-1.5 rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] hover:bg-[var(--danger)] hover:text-white transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--foreground-muted)]">Page {page} of {pages} · {total} students</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const p = Math.max(1, page - 2) + i
              if (p > pages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-[var(--primary)] text-white' : 'border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}>
                  {p}
                </button>
              )
            })}
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
