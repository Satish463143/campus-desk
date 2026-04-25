import React, { useState, useMemo } from 'react'
import Select from 'react-select'
import { useGetSectionDailySummaryQuery, useGetStudentDailySummaryQuery } from '../../../store/api/attendanceApi'
import { AttendanceFilterState } from '../types/attendance.types'
import { attendanceStatus } from '@/src/config/constant'

interface StudentDailySummaryPanelProps {
  filters: AttendanceFilterState
}

export function StudentDailySummaryPanel({ filters }: StudentDailySummaryPanelProps) {
  const { sectionId, date } = filters
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // We use the section daily summary just to get the list of students in the selected section
  const { data: sectionData, isFetching: isFetchingStudents } = useGetSectionDailySummaryQuery(
    { sectionId: sectionId as string, date },
    { skip: !sectionId }
  )

  const studentOptions = useMemo(() => {
    if (!sectionData?.result) return []
    return sectionData.result.map((row: any) => ({
      value: row.studentId,
      label: row.student.user.name,
    }))
  }, [sectionData])

  const { data: studentHistoryData, isFetching: isFetchingHistory } = useGetStudentDailySummaryQuery(
    { 
      studentId: selectedStudentId as string, 
      from: fromDate || undefined, 
      to: toDate || undefined 
    },
    { skip: !selectedStudentId }
  )

  const historyRecords = studentHistoryData?.result || []

  if (!sectionId) {
    return null // We rely on section being selected first based on UI flow
  }

  return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Student Attendance History</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Student
          </label>
          <Select
            options={studentOptions}
            isLoading={isFetchingStudents}
            onChange={(selected: any) => setSelectedStudentId(selected?.value || null)}
            placeholder="Select a student..."
            className="react-select-container"
            classNamePrefix="react-select"
            isClearable
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="erp-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="erp-input w-full"
          />
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          Please select a student to view their history.
        </div>
      ) : isFetchingHistory ? (
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      ) : historyRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          No attendance records found for this period.
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Daily Overall</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Period Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {historyRecords.map((record: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.dailyStatus.toUpperCase()} />
                  </td>
                  <td className="px-4 py-3">
                    {record.periodStatuses?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {record.periodStatuses.map((ps: any, i: number) => (
                          <div key={i} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md text-xs border border-gray-100 dark:border-gray-700">
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {ps.period.name}
                            </span>
                            <StatusBadge status={ps.status} small />
                            {ps.remark && (
                              <span className="text-gray-400 italic ml-1">({ps.remark})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Present all periods</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  let color = 'bg-gray-100 text-gray-600'
  if (status === attendanceStatus.PRESENT) color = 'bg-green-100 text-green-700'
  if (status === attendanceStatus.ABSENT) color = 'bg-red-100 text-red-700'
  if (status === attendanceStatus.LATE) color = 'bg-yellow-100 text-yellow-700'
  if (status === attendanceStatus.LEAVE) color = 'bg-blue-100 text-blue-700'

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full ${color} ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {status}
    </span>
  )
}
