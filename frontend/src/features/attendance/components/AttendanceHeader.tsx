import React, { useEffect } from 'react'
import { AttendanceFilterState, AttendanceTab } from '../types/attendance.types'
import { useListAcademicYearsQuery } from '../../../store/api/academicYearApi'
import { useListClassesQuery } from '../../../store/api/classApi'
import { useListSectionsQuery } from '../../../store/api/sectionApi'

interface AttendanceHeaderProps {
  filters: AttendanceFilterState
  setDate: (date: string) => void
  setActiveTab: (tab: AttendanceTab) => void
  setAcademicYearId: (id: string | null) => void
  setClassId: (id: string | null) => void
  setSectionId: (id: string | null) => void
}

export function AttendanceHeader({
  filters,
  setDate,
  setActiveTab,
  setAcademicYearId,
  setClassId,
  setSectionId,
}: AttendanceHeaderProps) {
  // Fetch lists
  const { data: academicYearsData } = useListAcademicYearsQuery({})
  console.log("academicYearsData", academicYearsData);
  const { data: classesData, isFetching: isLoadingClasses } = useListClassesQuery(
    { academicYearId: filters.academicYearId || undefined },
    { skip: !filters.academicYearId }
  )
  console.log("classesData", classesData);
  const { data: sectionsData, isFetching: isLoadingSections } = useListSectionsQuery(
    { classId: filters.classId || undefined, academicYearId: filters.academicYearId || undefined },
    { skip: !filters.classId }
  )
  console.log("sectionsData", sectionsData);

  const academicYears = academicYearsData?.data || []
  const classes = classesData?.data || []
  const sections = sectionsData?.data || []

  // Auto-select active academic year
  useEffect(() => {
    if (academicYears.length > 0 && !filters.academicYearId) {
      const activeYear = academicYears.find((y: any) => y.isActive) || academicYears[0]
      if (activeYear) {
        setAcademicYearId(activeYear.id)
      }
    }
  }, [academicYears, filters.academicYearId, setAcademicYearId])

  // Reset dependent fields when parent changes
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null
    setClassId(value)
    setSectionId(null) // Reset section when class changes
  }

  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage daily attendance for students and teachers.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filters.activeTab === 'student'
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Student Attendance
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filters.activeTab === 'teacher'
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Teacher Attendance
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="erp-card bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setDate(e.target.value)}
              className="erp-input w-full"
            />
          </div>

          {filters.activeTab === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year
                </label>
                <div className="erp-input w-full bg-gray-50 text-gray-500 cursor-not-allowed">
                  {academicYears.find((y: any) => y.id === filters.academicYearId)?.name || 'Loading...'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  value={filters.classId || ''}
                  onChange={handleClassChange}
                  className="erp-input w-full"
                  disabled={isLoadingClasses || !filters.academicYearId}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section
                </label>
                <select
                  value={filters.sectionId || ''}
                  onChange={(e) => setSectionId(e.target.value || null)}
                  className="erp-input w-full"
                  disabled={isLoadingSections || !filters.classId}
                >
                  <option value="">Select Section</option>
                  {sections.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
