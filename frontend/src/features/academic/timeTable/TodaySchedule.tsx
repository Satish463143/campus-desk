'use client'
import React, { useState, useMemo } from 'react'
import { Sun, Clock, MapPin } from 'lucide-react'
import { useGetDayScheduleQuery } from '@/src/store/api/timetableApi'
import { useListSectionsQuery } from '@/src/store/api/sectionApi'
import { getTodayDow, getTodayLabel, isCurrentPeriod, CLASS_MODE_COLORS, safeArray } from './timetableUtils'

interface TodayScheduleProps {
  academicYearId: string
  classes: any[]
}

export default function TodaySchedule({ academicYearId, classes }: TodayScheduleProps) {
  const todayDow = getTodayDow()
  const todayLabel = getTodayLabel()

  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')

  const { data: ttData, isLoading } = useGetDayScheduleQuery(
    { dayOfWeek: todayDow, academicYearId },
    { skip: !academicYearId }
  )

  const { data: sectionData } = useListSectionsQuery(
    { limit: 200, classId: classFilter || undefined },
    { skip: false }
  )
  const sections = safeArray(sectionData)

  const allEntries = safeArray(ttData)

  // Client-side filter by class/section
  const entries = useMemo(() => {
    return allEntries
      .filter(e => !classFilter  || e.classId   === classFilter)
      .filter(e => !sectionFilter || e.sectionId === sectionFilter)
      .sort((a, b) => {
        const aTime = a.period?.startTime ?? ''
        const bTime = b.period?.startTime ?? ''
        return aTime.localeCompare(bTime)
      })
  }, [allEntries, classFilter, sectionFilter])

  const total   = entries.length
  const online  = entries.filter(e => e.classMode?.toLowerCase() === 'online').length
  const offline = entries.filter(e => e.classMode?.toLowerCase() === 'offline').length

  return (
    <div className="flex flex-col gap-4">
      {/* Header: date + filters */}
      <div className="erp-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-amber-400" />
            <div>
              <div className="font-bold text-[var(--foreground)] text-sm">{todayLabel}</div>
              <div className="text-xs text-[var(--foreground-muted)]">Today's schedule</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 flex-wrap ml-auto">
            <select
              className="erp-input w-auto text-sm"
              value={classFilter}
              onChange={e => { setClassFilter(e.target.value); setSectionFilter('') }}
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="erp-input w-auto text-sm"
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              disabled={!classFilter}
            >
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Periods', value: total },
          { label: 'Offline', value: offline },
          { label: 'Online', value: online },
        ].map(({ label, value }) => (
          <div key={label} className="erp-card py-3">
            <div className="text-xl font-bold text-[var(--foreground)]">{value}</div>
            <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Schedule list */}
      {isLoading ? (
        <div className="erp-card flex justify-center py-14">
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="erp-card flex flex-col items-center py-16 gap-3 text-[var(--foreground-muted)]">
          <Sun size={36} opacity={0.3} />
          <p className="text-sm">No classes scheduled for today{classFilter ? ' with the selected filter' : ''}.</p>
        </div>
      ) : (
        <div className="erp-card divide-y divide-[var(--border)]">
          {entries.map((entry, i) => {
            const start  = entry.period?.startTime ?? ''
            const end    = entry.period?.endTime   ?? ''
            const active = isCurrentPeriod(start, end)

            return (
              <div
                key={entry.id ?? i}
                className={`flex items-center gap-4 py-3.5 px-1 transition-colors rounded-lg ${
                  active ? 'bg-[var(--primary-light)]' : ''
                }`}
              >
                {/* Current indicator */}
                <div className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: active ? 'var(--primary)' : 'transparent' }} />

                {/* Time */}
                <div className="w-24 shrink-0">
                  <div className="flex items-center gap-1 text-xs font-semibold text-[var(--foreground)]">
                    <Clock size={11} className={active ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'} />
                    {start.slice(0, 5)}
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{end.slice(0, 5)}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">{entry.period?.durationMinutes}m</div>
                </div>

                {/* Subject + teacher */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[var(--foreground)] truncate">
                    {entry.subject?.name ?? '—'}
                    {entry.subject?.code && (
                      <span className="ml-1.5 text-xs font-mono text-[var(--foreground-muted)]">
                        ({entry.subject.code})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {entry.teacher?.user?.name ?? 'Unassigned'}
                  </div>
                </div>

                {/* Class + Section */}
                <div className="shrink-0 text-right">
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    {entry.class?.name ?? '—'}
                  </div>
                  {entry.section?.name && (
                    <div className="text-xs text-[var(--foreground-muted)]">Section {entry.section.name}</div>
                  )}
                </div>

                {/* Room */}
                {entry.roomNumber && (
                  <div className="shrink-0 flex items-center gap-0.5 text-xs text-[var(--foreground-muted)]">
                    <MapPin size={11} />{entry.roomNumber}
                  </div>
                )}

                {/* Mode badge */}
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${CLASS_MODE_COLORS[entry.classMode] ?? ''}`}>
                  {entry.classMode}
                </span>

                {/* LIVE badge */}
                {active && (
                  <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold animate-pulse">
                    ● LIVE
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
