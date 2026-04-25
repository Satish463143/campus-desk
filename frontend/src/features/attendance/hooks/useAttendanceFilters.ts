import { useState, useCallback, useMemo } from 'react'
import { AttendanceFilterState, AttendanceTab } from '../types/attendance.types'

export function useAttendanceFilters() {
  const [filters, setFilters] = useState<AttendanceFilterState>({
    activeTab: 'student',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    academicYearId: null,
    classId: null,
    sectionId: null,
    periodId: null,
  })

  const setFilter = useCallback(<K extends keyof AttendanceFilterState>(key: K, value: AttendanceFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setDate = useCallback((date: string) => setFilter('date', date), [setFilter])
  const setActiveTab = useCallback((tab: AttendanceTab) => setFilter('activeTab', tab), [setFilter])
  const setAcademicYearId = useCallback((id: string | null) => setFilter('academicYearId', id), [setFilter])
  const setClassId = useCallback((id: string | null) => setFilter('classId', id), [setFilter])
  const setSectionId = useCallback((id: string | null) => setFilter('sectionId', id), [setFilter])
  const setPeriodId = useCallback((id: string | null) => setFilter('periodId', id), [setFilter])

  return {
    filters,
    setDate,
    setActiveTab,
    setAcademicYearId,
    setClassId,
    setSectionId,
    setPeriodId,
  }
}
