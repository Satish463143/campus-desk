'use client'
import React from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useListStudentsQuery } from '@/src/store/api/studentApi'
import StudentProfile from '../StudentProfile'
import { safeStudents, initials, avatarColor, fmtDate } from '../studentUtils'
import { useState } from 'react'

export default function MigratedStudents() {
  const [viewId, setViewId] = useState<string | null>(null)
  const { data, isLoading } = useListStudentsQuery({ academicStatus: 'transferred', limit: 100 })
  const students = safeStudents(data)

  return (
    <>
      {viewId && <StudentProfile studentId={viewId} onClose={() => setViewId(null)} />}
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-[var(--border)] animate-pulse" />)}</div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-[var(--foreground-muted)]">
          <ArrowRightLeft size={36} opacity={0.3} />
          <p className="text-sm">No transferred / migrated students.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '560px' }}>
            <thead>
              <tr className="text-left text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2.5 pr-4">Student</th>
                <th className="pb-2.5 pr-4">Previous Class</th>
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
                  <td className="py-3">
                    <button onClick={() => setViewId(s.studentProfile?.id ?? s.id)} className="text-xs px-2 py-1 rounded-lg bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
