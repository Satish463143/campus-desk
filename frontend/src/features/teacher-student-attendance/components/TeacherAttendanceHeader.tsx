'use client'

import React, { useEffect, useMemo } from 'react'
import { TeacherAttendanceFilterState, TeacherAttendanceTab, TimetableSlot } from '../types/attendance.types'
import { useListAcademicYearsQuery } from '../../../store/api/academicYearApi'
import { useGetTeacherTimetableQuery } from '../../../store/api/timetableApi'
import { BookOpen, User } from 'lucide-react'
import { dayOfWeek } from '@/src/config/constant'

interface TeacherAttendanceHeaderProps {
  filters: TeacherAttendanceFilterState
  setDate: (date: string) => void
  setActiveTab: (tab: TeacherAttendanceTab) => void
  setAcademicYearId: (id: string | null) => void
  setClassId: (id: string | null) => void
  setSectionId: (id: string | null) => void
  setPeriodId: (id: string | null) => void
  teacherId: string | null
}

const DAY_MAP: Record<number, string> = {
  0: dayOfWeek.SUNDAY,
  1: dayOfWeek.MONDAY,
  2: dayOfWeek.TUESDAY,
  3: dayOfWeek.WEDNESDAY,
  4: dayOfWeek.THURSDAY,
  5: dayOfWeek.FRIDAY,
  6: dayOfWeek.SATURDAY,
}

function getDayOfWeek(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return DAY_MAP[d.getUTCDay()]
}

export function TeacherAttendanceHeader({
  filters,
  setDate,
  setActiveTab,
  setAcademicYearId,
  setClassId,
  setSectionId,
  setPeriodId,
  teacherId,
}: TeacherAttendanceHeaderProps) {
  const { data: academicYearsData } = useListAcademicYearsQuery({})
  const academicYears = academicYearsData?.result || academicYearsData?.data || []

  // Auto-select active academic year
  useEffect(() => {
    if (academicYears.length > 0 && !filters.academicYearId) {
      const active = academicYears.find((y: any) => y.isActive) || academicYears[0]
      if (active) setAcademicYearId(active.id)
    }
  }, [academicYears, filters.academicYearId, setAcademicYearId])

  // Fetch teacher's full timetable (all days)
  const { data: timetableData, error: timetableError, isLoading, isFetching: ttLoading } = useGetTeacherTimetableQuery(
    { teacherId: teacherId as string, academicYearId: filters.academicYearId as string },
    { skip: !teacherId || !filters.academicYearId }
  )
  console.log('timetableData', timetableData)



  const allSlots: TimetableSlot[] = Array.isArray(timetableData)
    ? timetableData
    : (timetableData?.result || timetableData?.data || [])

  // Filter slots for selected date's day of week
  const selectedDay = getDayOfWeek(filters.date)
  const todaySlots = useMemo(
    () => allSlots.filter((s) => s.dayOfWeek === selectedDay),
    [allSlots, selectedDay]
  )

  // Derive unique classes from today's slots
  const availableClasses = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    todaySlots.forEach((s) => {
      if (s.class && !map.has(s.class.id)) map.set(s.class.id, s.class)
    })
    return Array.from(map.values())
  }, [todaySlots])

  // Derive unique sections for selected class
  const availableSections = useMemo(() => {
    if (!filters.classId) return []
    const map = new Map<string, { id: string; name: string }>()
    todaySlots
      .filter((s) => s.class?.id === filters.classId)
      .forEach((s) => {
        if (s.section && !map.has(s.section.id)) map.set(s.section.id, s.section)
      })
    return Array.from(map.values())
  }, [todaySlots, filters.classId])

  // Derive unique periods for selected class+section
  const availablePeriods = useMemo(() => {
    if (!filters.classId || !filters.sectionId) return []
    const map = new Map<string, any>()
    todaySlots
      .filter((s) => s.class?.id === filters.classId && s.section?.id === filters.sectionId)
      .forEach((s) => {
        if (s.period && !map.has(s.period.id)) map.set(s.period.id, s.period)
      })
    return Array.from(map.values()).sort((a, b) => a.periodNumber - b.periodNumber)
  }, [todaySlots, filters.classId, filters.sectionId])

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassId(e.target.value || null)
  }

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSectionId(e.target.value || null)
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodId(e.target.value || null)
  }

  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mark and view attendance for your assigned classes.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${filters.activeTab === 'student'
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <BookOpen size={15} />
            Student Attendance
          </button>
          <button
            onClick={() => setActiveTab('self')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${filters.activeTab === 'self'
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <User size={15} />
            My Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="erp-card bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        {filters.activeTab === 'student' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setDate(e.target.value)}
                className="erp-input w-full"
              />
            </div>

            {/* Academic Year (read-only auto) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
              <div className="erp-input w-full bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed text-sm">
                {academicYears.find((y: any) => y.id === filters.academicYearId)?.name || 'Loading...'}
              </div>
            </div>

            {/* Class — only assigned classes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
              {ttLoading ? (
                <div className="erp-input w-full bg-gray-50 animate-pulse text-gray-400 text-sm">Loading...</div>
              ) : availableClasses.length === 0 ? (
                <div className="erp-input w-full bg-gray-50 dark:bg-gray-800 text-gray-400 text-sm">
                  No classes on {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
                </div>
              ) : (
                <select value={filters.classId || ''} onChange={handleClassChange} className="erp-input w-full">
                  <option value="">Select Class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Section — only assigned sections for selected class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
              <select
                value={filters.sectionId || ''}
                onChange={handleSectionChange}
                className="erp-input w-full"
                disabled={!filters.classId || availableSections.length === 0}
              >
                <option value="">Select Section</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>

            {/* Period — only assigned periods for selected class+section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
              <select
                value={filters.periodId || ''}
                onChange={handlePeriodChange}
                className="erp-input w-full"
                disabled={!filters.sectionId || availablePeriods.length === 0}
              >
                <option value="">All Periods</option>
                {availablePeriods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (P{p.periodNumber})</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Self-attendance tab: just date */
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setDate(e.target.value)}
                className="erp-input"
              />
            </div>
            <div className="mt-5 text-sm text-gray-500 dark:text-gray-400">
              Marking attendance for: <span className="font-semibold text-gray-700 dark:text-gray-200">{filters.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Today's Schedule Info Banner — only for student tab */}
      {filters.activeTab === 'student' && todaySlots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {todaySlots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => {
                setClassId(slot.class.id)
                setSectionId(slot.section.id)
                setPeriodId(slot.period.id)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all ${filters.sectionId === slot.section.id && filters.periodId === slot.period.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600'
                }`}
              title={`${slot.subject?.name} — ${slot.class.name} ${slot.section.name}`}
            >
              <span className="font-bold">{slot.period.name}</span>
              <span className="opacity-70">·</span>
              <span>{slot.class.name}-{slot.section.name}</span>
              <span className="opacity-70">·</span>
              <span className="truncate max-w-[100px]">{slot.subject?.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
