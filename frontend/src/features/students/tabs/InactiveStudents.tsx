'use client'
import React, { useState } from 'react'
import { UserX, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useListStudentsQuery } from '@/src/store/api/studentApi'
import StudentProfile from '../StudentProfile'
import { safeStudents, initials, avatarColor, fmtDate, STATUS_STYLE } from '../studentUtils'

export default function InactiveStudents() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isLoading } = useListStudentsQuery({
    page, limit: 15, academicStatus: 'inactive', search: search || undefined,
  })
  const students = safeStudents(data)
  const total = data?.meta?.total ?? 0
  const pages = Math.ceil(total / 15)

  return (
    <>
      {viewId && <StudentProfile studentId={viewId} onClose={() => setViewId(null)} />}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input className="erp-input pl-9 text-sm max-w-sm" placeholder="Search inactive students…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-[var(--border)] animate-pulse" />)}</div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-[var(--foreground-muted)]">
          <UserX size={36} opacity={0.3} />
          <p className="text-sm">No inactive students found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '600px' }}>
            <thead>
              <tr className="text-left text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2.5 pr-4">Student</th>
                <th className="pb-2.5 pr-4">Class</th>
                <th className="pb-2.5 pr-4">Inactive Since</th>
                <th className="pb-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(s.name)}`}>{initials(s.name)}</div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{s.name}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[var(--foreground-muted)]">{s.studentProfile?.class ?? '—'}</td>
                  <td className="py-3 pr-4 text-xs text-[var(--foreground-muted)]">{fmtDate(s.studentProfile?.studentInfo?.inactiveDate)}</td>
                  <td className="py-3">
                    <button onClick={() => setViewId(s.studentProfile?.id ?? s.id)} className="p-1.5 rounded-lg bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors"><Eye size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded border border-[var(--border)] disabled:opacity-40"><ChevronLeft size={13} /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded border border-[var(--border)] disabled:opacity-40"><ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </>
  )
}
