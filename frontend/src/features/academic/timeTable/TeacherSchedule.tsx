'use client'
import React, { useState } from 'react'
import { Users, Pencil, Trash2, MapPin } from 'lucide-react'
import { useGetTeacherTimetableQuery } from '@/src/store/api/timetableApi'
import TeacherSelect from '@/src/components/TeacherSelect'
import { DAYS, DAY_SHORT, CLASS_MODE_COLORS, buildGrid, safeArray } from './timetableUtils'

interface TeacherScheduleProps {
  academicYearId: string
  periods: any[]
  onEdit: (entry: any) => void
  onDelete: (id: string) => void
}

export default function TeacherSchedule({ academicYearId, periods, onEdit, onDelete }: TeacherScheduleProps) {
  const [teacherId, setTeacherId] = useState('')

  const { data: ttData, isLoading, isFetching } = useGetTeacherTimetableQuery(
    { teacherId, academicYearId },
    { skip: !teacherId || !academicYearId }
  )
  const entries = safeArray(ttData)
  const grid    = buildGrid(entries)

  // Stats
  const totalPeriods = entries.length
  const activeDays   = new Set(entries.map(e => e.dayOfWeek)).size
  const subjects     = new Set(entries.map(e => e.subjectId)).size
  const sections     = new Set(entries.map(e => e.sectionId)).size

  return (
    <div className="flex flex-col gap-4">
      {/* Teacher selector */}
      <div className="erp-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-muted)]">
            <Users size={15} className="text-[var(--secondary, var(--primary))]" />
            Select Teacher
          </div>
          <div className="flex-1 min-w-[260px] max-w-sm">
            <TeacherSelect
              value={teacherId}
              onChange={setTeacherId}
              placeholder="Search & select teacher…"
            />
          </div>
          {teacherId && entries.length > 0 && (
            <span className="text-xs text-[var(--foreground-muted)]">
              {totalPeriods} period{totalPeriods !== 1 ? 's' : ''} per week
            </span>
          )}
        </div>
      </div>

      {/* No teacher selected */}
      {!teacherId ? (
        <div className="erp-card flex flex-col items-center py-20 gap-4 text-[var(--foreground-muted)]">
          <div className="w-16 h-16 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
            <Users size={28} className="text-[var(--primary)]" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--foreground)]">Select a Teacher</p>
            <p className="text-sm mt-1">Search and pick a teacher to view their weekly schedule</p>
          </div>
        </div>
      ) : isLoading || isFetching ? (
        <div className="erp-card flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Periods', value: totalPeriods },
              { label: 'Active Days', value: activeDays },
              { label: 'Subjects', value: subjects },
              { label: 'Sections', value: sections },
            ].map(({ label, value }) => (
              <div key={label} className="erp-card py-3">
                <div className="text-xl font-bold text-[var(--foreground)]">{value}</div>
                <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Weekly grid */}
          {periods.length === 0 || entries.length === 0 ? (
            <div className="erp-card flex flex-col items-center py-14 gap-3 text-[var(--foreground-muted)]">
              <Users size={36} opacity={0.3} />
              <p className="text-sm">No schedule found for this teacher in the current academic year.</p>
            </div>
          ) : (
            <div className="erp-card overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)] w-28">
                      Period
                    </th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                        {DAY_SHORT[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period.id} className="border-b border-[var(--border)] group">
                      <td className="p-3 align-top">
                        <div className="font-semibold text-xs text-[var(--foreground)]">{period.name}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">{period.startTime?.slice(0, 5)}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">{period.durationMinutes}m</div>
                      </td>
                      {DAYS.map(day => {
                        const entry = grid[day]?.[period.id]
                        if (!entry) return (
                          <td key={day} className="p-1.5 align-top">
                            <div className="h-full min-h-[88px] rounded-lg border border-dashed border-[var(--border)] opacity-30" />
                          </td>
                        )
                        return (
                          <td key={day} className="p-1.5 align-top">
                            <div className="h-full min-h-[88px] rounded-lg bg-[var(--primary-light)] border border-[var(--primary)] border-opacity-30 p-2 flex flex-col gap-1 relative group/cell">
                              {/* Subject */}
                              <div className="font-semibold text-xs text-[var(--primary)] truncate pr-10">
                                {entry.subject?.name ?? '—'}
                              </div>
                              {/* Class & Section */}
                              <div className="text-xs text-[var(--foreground-muted)]">
                                {entry.class?.name} {entry.section?.name ? `· Sec ${entry.section.name}` : ''}
                              </div>
                              {entry.roomNumber && (
                                <div className="flex items-center gap-0.5 text-xs text-[var(--foreground-muted)]">
                                  <MapPin size={9} />{entry.roomNumber}
                                </div>
                              )}
                              <span className={`w-fit text-xs px-1.5 py-0.5 rounded-full font-semibold mt-auto ${CLASS_MODE_COLORS[entry.classMode] ?? ''}`}>
                                {entry.classMode}
                              </span>

                              <div className="absolute top-1 right-1 hidden group-hover/cell:flex gap-0.5">
                                <button onClick={() => onEdit(entry)}
                                  className="p-1 rounded bg-[var(--card-bg)] shadow text-[var(--foreground-muted)] hover:text-[var(--primary)]">
                                  <Pencil size={10} />
                                </button>
                                <button onClick={() => onDelete(entry.id)}
                                  className="p-1 rounded bg-[var(--card-bg)] shadow text-[var(--foreground-muted)] hover:text-[var(--danger)]">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
