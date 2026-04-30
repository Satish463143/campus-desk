'use client'

import React, { useMemo } from 'react'
import { useAppSelector } from '../../store/hooks'
import { useListTeachersQuery } from '../../store/api/teacherApi'
import { useTeacherAttendanceFilters } from './hooks/useTeacherAttendanceFilters'
import { TeacherAttendanceHeader } from './components/TeacherAttendanceHeader'
import { TeacherSummaryCards } from './components/TeacherSummaryCards'
import { TeacherSectionSummaryTable } from './components/TeacherSectionSummaryTable'
import { TeacherPeriodMarker } from './components/TeacherPeriodMarker'
import { TeacherSelfAttendancePanel } from './components/TeacherSelfAttendancePanel'
import { AlertCircle, Loader2 } from 'lucide-react'

interface TeacherAttendanceProps {
  schoolId?: string;
  onClose?: () => void;
}

export default function TeacherAttendancePage({ schoolId, onClose }: TeacherAttendanceProps) {
  const {
    filters,
    setDate,
    setActiveTab,
    setAcademicYearId,
    setClassId,
    setSectionId,
    setPeriodId,
  } = useTeacherAttendanceFilters()

  // Get logged-in user from Redux store
  const loggedInUser = useAppSelector((state: any) => state.user.loggedInUser)
  const loggedInUserId = loggedInUser?.id || loggedInUser?._id

  console.log('loggedInUser', loggedInUser)

  // Resolve the teacher's profile ID by matching user ID against the teacher list
  const { data: teachersData, isFetching: isLoadingTeachers } = useListTeachersQuery(
    { limit: 500 },
    { skip: !loggedInUserId }
  )

  const teachers: any[] = useMemo(() => {
    if (!teachersData) return []
    const r = teachersData.result ?? teachersData.data ?? teachersData
    return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
  }, [teachersData])

  const teacherProfile = useMemo(() => {
    if (!loggedInUserId || teachers.length === 0) return null
    return (
      teachers.find(
        (t: any) =>
          t.user?.id === loggedInUserId ||
          t.user?._id === loggedInUserId ||
          t.userId === loggedInUserId
      ) || null
    )
  }, [teachers, loggedInUserId])

  const teacherId: string | null = teacherProfile?.id || loggedInUserId || null
  const teacherName: string = teacherProfile?.user?.name || loggedInUser?.name || 'Teacher'

  // Loading state — wait for teacher profile resolution
  if (isLoadingTeachers) {
    return (
      <div className="p-6  mx-auto flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // If teacher profile not found (e.g. not a teacher role)
  if (!teacherId) {
    return (
      <div className="p-6 mx-auto">
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="w-full">
            <p className="font-semibold">Teacher profile not found</p>
            <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-500">
              Your account does not have an associated teacher profile, or the user data is still loading.
            </p>
            <pre className="mt-4 p-2 bg-white dark:bg-black rounded border border-amber-200 overflow-auto text-xs w-full">
              {JSON.stringify({
                loggedInUser_Is_Null: !loggedInUser,
                loggedInUserId: loggedInUserId,
                teachers_Array_Length: teachers.length,
                teacherId_Evaluated_To: teacherId
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 mx-auto">
      {/* Header with timetable-derived filters */}
      <TeacherAttendanceHeader
        filters={filters}
        setDate={setDate}
        setActiveTab={setActiveTab}
        setAcademicYearId={setAcademicYearId}
        setClassId={setClassId}
        setSectionId={setSectionId}
        setPeriodId={setPeriodId}
        teacherId={teacherId}
      />

      {/* ── STUDENT ATTENDANCE TAB ───────────────────────────────────────── */}
      {filters.activeTab === 'student' && (
        <>
          {/* Summary stat cards */}
          <TeacherSummaryCards sectionId={filters.sectionId} date={filters.date} />

          {/* Two-column layout: Daily Grid + Period Marker */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Daily Attendance Summary Table — col-span 3 */}
            <div className="xl:col-span-3">
              <TeacherSectionSummaryTable
                sectionId={filters.sectionId}
                date={filters.date}
              />
            </div>

            {/* Period Attendance Marker — col-span 2 */}
            <div className="xl:col-span-2">
              <TeacherPeriodMarker
                filters={filters}
                teacherProfileId={teacherId}
              />
            </div>
          </div>
        </>
      )}

      {/* ── SELF ATTENDANCE TAB ─────────────────────────────────────────── */}
      {filters.activeTab === 'self' && (
        <TeacherSelfAttendancePanel
          date={filters.date}
          teacherProfileId={teacherId}
          teacherName={teacherName}
        />
      )}
    </div>
  )
}
