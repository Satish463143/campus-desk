'use client'
import React from 'react'
import { Pencil, Trash2, Plus, MapPin, CalendarDays, BookOpen, ChevronRight } from 'lucide-react'
import { useGetSectionTimetableQuery } from '@/src/store/api/timetableApi'
import { DAYS, DAY_SHORT, CLASS_MODE_COLORS, buildGrid, safeArray } from './timetableUtils'

interface SectionGridProps {
  academicYearId: string
  classId: string
  sectionId: string
  onClassChange: (id: string) => void
  onSectionChange: (id: string) => void
  classes: any[]
  allSections: any[]
  periods: any[]
  onAddEntry: (preDay?: string, prePeriod?: string) => void
  onEdit: (entry: any) => void
  onDelete: (id: string) => void
}

// ── Individual grid cell ──────────────────────────────────────────────────
function GridCell({ entry, onEdit, onDelete, onAdd }: {
  entry?: any; onEdit?: () => void; onDelete?: () => void; onAdd?: () => void
}) {
  if (!entry) return (
    <div
      onClick={onAdd}
      className="h-full min-h-[88px] rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
    >
      <Plus size={16} className="text-[var(--foreground-muted)]" />
    </div>
  )

  return (
    <div className="h-full min-h-[88px] rounded-lg bg-[var(--primary-light)] border border-[var(--primary)] border-opacity-30 p-2 flex flex-col gap-1 relative group">
      <div className="font-semibold text-xs text-[var(--primary)] truncate pr-10">{entry.subject?.name ?? '—'}</div>
      <div className="text-xs text-[var(--foreground-muted)] truncate">{entry.teacher?.user?.name ?? '—'}</div>
      {entry.roomNumber && (
        <div className="flex items-center gap-0.5 text-xs text-[var(--foreground-muted)] truncate">
          <MapPin size={9} />{entry.roomNumber}
        </div>
      )}
      <span className={`w-fit text-xs px-1.5 py-0.5 rounded-full font-semibold mt-auto ${CLASS_MODE_COLORS[entry.classMode] ?? ''}`}>
        {entry.classMode}
      </span>

      {/* Edit/Delete on hover */}
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
        <button onClick={onEdit}
          className="p-1 rounded bg-[var(--card-bg)] shadow text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors">
          <Pencil size={10} />
        </button>
        <button onClick={onDelete}
          className="p-1 rounded bg-[var(--card-bg)] shadow text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-colors">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}

export default function SectionGrid({
  academicYearId, classId, sectionId,
  onClassChange, onSectionChange,
  classes, allSections, periods,
  onAddEntry, onEdit, onDelete,
}: SectionGridProps) {

  const filteredSections = allSections.filter(
    s => !classId || (s.class?.id ?? s.classId) === classId
  )

  const selectedClass   = classes.find(c => c.id === classId)
  const selectedSection = allSections.find(s => s.id === sectionId)

  const { data: ttData, isLoading, isFetching } = useGetSectionTimetableQuery(
    { sectionId, academicYearId },
    { skip: !sectionId || !academicYearId }
  )
  const entries = safeArray(ttData)
  const grid    = buildGrid(entries)

  // Stats
  const subjects   = new Set(entries.map(e => e.subjectId)).size
  const totalSlots = entries.length
  const online  = entries.filter(e => e.classMode?.toLowerCase() === 'online').length
  const offline = entries.filter(e => e.classMode?.toLowerCase() === 'offline').length

  return (
    <div className="flex flex-col gap-4">
      {/* Context bar: class + section selectors */}
      <div className="erp-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-muted)]">
            <BookOpen size={15} className="text-[var(--primary)]" />
            Select Class & Section
          </div>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <select
              className="erp-input w-auto flex-1 min-w-[160px]"
              value={classId}
              onChange={e => { onClassChange(e.target.value); onSectionChange('') }}
            >
              <option value="">— Choose Class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <ChevronRight size={16} className="text-[var(--foreground-muted)]" />

            <select
              className="erp-input w-auto flex-1 min-w-[160px]"
              value={sectionId}
              onChange={e => onSectionChange(e.target.value)}
              disabled={!classId}
            >
              <option value="">— Choose Section —</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>

          {/* Breadcrumb badge */}
          {selectedClass && (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                {selectedClass.name}
              </span>
              {selectedSection && (
                <>
                  <ChevronRight size={13} className="text-[var(--foreground-muted)]" />
                  <span className="px-2.5 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold border border-[var(--primary)] border-opacity-30">
                    Section {selectedSection.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* No selection state */}
      {!sectionId ? (
        <div className="erp-card flex flex-col items-center py-20 gap-4 text-[var(--foreground-muted)]">
          <div className="w-16 h-16 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
            <CalendarDays size={28} className="text-[var(--primary)]" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--foreground)]">Select a Class & Section</p>
            <p className="text-sm mt-1">Choose a class and section above to view its weekly timetable</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Slots', value: totalSlots },
              { label: 'Subjects', value: subjects },
              { label: 'Offline', value: offline },
              { label: 'Online', value: online },
            ].map(({ label, value }) => (
              <div key={label} className="erp-card py-3">
                <div className="text-xl font-bold text-[var(--foreground)]">{value}</div>
                <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Weekly Grid */}
          {isLoading || isFetching ? (
            <div className="erp-card flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          ) : periods.length === 0 ? (
            <div className="erp-card flex flex-col items-center py-14 gap-3 text-[var(--foreground-muted)]">
              <CalendarDays size={36} opacity={0.35} />
              <p className="text-sm">No periods configured. Add periods first to build the timetable.</p>
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
                        return (
                          <td key={day} className="p-1.5 align-top">
                            <div className="group">
                              <GridCell
                                entry={entry}
                                onAdd={() => onAddEntry(day, period.id)}
                                onEdit={() => onEdit(entry)}
                                onDelete={() => onDelete(entry?.id)}
                              />
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-4 px-3 py-2.5 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--foreground-muted)]">Legend:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">offline</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">online</span>
                <span className="text-xs text-[var(--foreground-muted)] ml-auto">Hover a cell to edit or delete</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
