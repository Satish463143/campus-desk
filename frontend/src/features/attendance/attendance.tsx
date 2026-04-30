'use client'

import React, { useState } from 'react'
import { useAttendanceFilters } from './hooks/useAttendanceFilters'
import { AttendanceHeader } from './components/AttendanceHeader'
import { AttendanceSummaryCards } from './components/AttendanceSummaryCards'
import { SectionDailySummaryTable } from './components/SectionDailySummaryTable'
import { PeriodAttendanceMarker } from './components/PeriodAttendanceMarker'
import { TeacherAttendancePanel } from './components/TeacherAttendancePanel'
import { AttendanceEditModal } from './components/AttendanceEditModal'
import { AttendanceDeleteDialog } from './components/AttendanceDeleteDialog'
import { AttendanceResult } from './components/AttendanceResult'

export default function AttendancePage({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const {
    filters,
    setDate,
    setActiveTab,
    setAcademicYearId,
    setClassId,
    setSectionId,
  } = useAttendanceFilters()

  const [editRecordId, setEditRecordId] = useState<string | null>(null)
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null)

  return (
    <div className="p-6  mx-auto">
      <AttendanceHeader
        filters={filters}
        setDate={setDate}
        setActiveTab={setActiveTab}
        setAcademicYearId={setAcademicYearId}
        setClassId={setClassId}
        setSectionId={setSectionId}
      />

      {filters.activeTab === 'student' && (
        <>
          <AttendanceSummaryCards sectionId={filters.sectionId} date={filters.date} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily Attendance Grid</h2>
              <SectionDailySummaryTable
                sectionId={filters.sectionId}
                date={filters.date}
                onEdit={(id) => setEditRecordId(id)}
                onDelete={(id) => setDeleteRecordId(id)}
              />
            </div>
            <div className="xl:col-span-1">
              <PeriodAttendanceMarker filters={filters} />
            </div>
          </div>
        </>
      )}

      {filters.activeTab === 'teacher' && (
        <TeacherAttendancePanel filters={filters} />
      )}

      {filters.activeTab === 'reports' && (
        <AttendanceResult filters={filters} />
      )}

      {/* Modals */}
      {editRecordId && (
        <AttendanceEditModal
          recordId={editRecordId}
          onClose={() => setEditRecordId(null)}
        />
      )}

      {deleteRecordId && (
        <AttendanceDeleteDialog
          recordId={deleteRecordId}
          onClose={() => setDeleteRecordId(null)}
        />
      )}
    </div>
  )
}
