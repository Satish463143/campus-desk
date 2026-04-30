'use client'

import React from 'react'
import { useGetSectionDailySummaryQuery } from '../../../store/api/attendanceApi'
import { attendanceStatus } from '@/src/config/constant'

interface TeacherSectionSummaryTableProps {
  sectionId: string | null
  date: string
}

export function TeacherSectionSummaryTable({ sectionId, date }: TeacherSectionSummaryTableProps) {
  const { data, isLoading, isError } = useGetSectionDailySummaryQuery(
    { sectionId: sectionId as string, date },
    { skip: !sectionId }
  )

  if (!sectionId) {
    return (
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center p-12 text-gray-500 text-sm rounded-xl">
        Select a class and section to view attendance.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="erp-card bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 p-6 rounded-xl text-sm">
        Failed to load attendance data.
      </div>
    )
  }

  const records: any[] = data?.result || []

  if (records.length === 0) {
    return (
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center p-12 text-gray-500 text-sm rounded-xl">
        No students found in this section.
      </div>
    )
  }

  // Derive distinct periods from the data
  const allPeriodsMap = new Map<string, any>()
  records.forEach((student: any) => {
    student.periodStatuses?.forEach((ps: any) => {
      allPeriodsMap.set(ps.period.id, ps.period)
    })
  })
  const allPeriods = Array.from(allPeriodsMap.values()).sort((a, b) => a.periodNumber - b.periodNumber)

  return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Daily Attendance Grid</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Overall</th>
              {allPeriods.map((p) => (
                <th key={p.id} className="px-3 py-3 font-semibold text-center whitespace-nowrap">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {records.map((row: any) => (
              <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {row.student?.user?.profileImage ? (
                      <img src={row.student.user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {row.student?.user?.name?.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {row.student?.user?.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={row.dailyStatus?.toUpperCase() || 'PRESENT'} />
                </td>
                {allPeriods.map((p) => {
                  const pStatus = row.periodStatuses?.find((ps: any) => ps.period.id === p.id)
                  return (
                    <td key={p.id} className="px-3 py-3 text-center whitespace-nowrap">
                      {pStatus ? (
                        <StatusBadge status={pStatus.status} small />
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  let color = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  if (status === attendanceStatus.PRESENT) color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (status === attendanceStatus.ABSENT)  color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (status === attendanceStatus.LATE)    color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (status === attendanceStatus.LEAVE)   color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full ${color} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {status}
    </span>
  )
}
