import { useState, useCallback } from 'react'
import { TeacherAttendanceFilterState, TeacherAttendanceTab } from '../types/attendance.types'

export function useTeacherAttendanceFilters() {
  const [filters, setFilters] = useState<TeacherAttendanceFilterState>({
    activeTab: 'student',
    date: new Date().toISOString().split('T')[0],
    academicYearId: null,
    classId: null,
    sectionId: null,
    periodId: null,
  })

  const setFilter = useCallback(<K extends keyof TeacherAttendanceFilterState>(
    key: K,
    value: TeacherAttendanceFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setDate = useCallback((date: string) => setFilter('date', date), [setFilter])
  const setActiveTab = useCallback((tab: TeacherAttendanceTab) => setFilter('activeTab', tab), [setFilter])
  const setAcademicYearId = useCallback((id: string | null) => setFilter('academicYearId', id), [setFilter])
  const setClassId = useCallback((id: string | null) => {
    setFilters((prev) => ({ ...prev, classId: id, sectionId: null, periodId: null }))
  }, [])
  const setSectionId = useCallback((id: string | null) => {
    setFilters((prev) => ({ ...prev, sectionId: id, periodId: null }))
  }, [])
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
