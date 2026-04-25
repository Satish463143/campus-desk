import { useGetSectionDailySummaryQuery } from '../../../store/api/attendanceApi'
import { Edit2, Trash2 } from 'lucide-react'
import { attendanceStatus } from '@/src/config/constant'

interface SectionDailySummaryTableProps {
  sectionId: string | null
  date: string
  onEdit: (recordId: string) => void
  onDelete: (recordId: string) => void
}

export function SectionDailySummaryTable({ sectionId, date, onEdit, onDelete }: SectionDailySummaryTableProps) {
  const { data, isLoading, isError } = useGetSectionDailySummaryQuery(
    { sectionId: sectionId as string, date },
    { skip: !sectionId }
  )

  if (!sectionId) return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center p-12 text-gray-500">
      Please select an Academic Year, Class, and Section to view attendance.
    </div>
  )

  if (isLoading) return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-800 rounded mb-4 animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )

  if (isError) return (
    <div className="erp-card bg-red-50 text-red-600 border border-red-200 p-6">
      Failed to load section daily summary.
    </div>
  )

  const records = data?.result || []

  if (records.length === 0) return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-12 text-gray-500">
      <p className="mb-2">No students found in this section.</p>
    </div>
  )

  // Find all distinct periods for the table header
  const allPeriodsMap = new Map<string, any>()
  records.forEach((student: any) => {
    student.periodStatuses?.forEach((ps: any) => {
      allPeriodsMap.set(ps.period.id, ps.period)
    })
  })
  const allPeriods = Array.from(allPeriodsMap.values()).sort((a, b) => a.periodNumber - b.periodNumber)

  return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Student Name</th>
              <th className="px-4 py-3 font-semibold">Overall</th>
              {allPeriods.map((p) => (
                <th key={p.id} className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                  {p.name} (P{p.periodNumber})
                </th>
              ))}
              {allPeriods.length > 0 && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {records.map((row: any) => (
              <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {row.student.user.profileImage ? (
                      <img src={row.student.user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {row.student.user.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">{row.student.user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={row.dailyStatus.toUpperCase()} />
                </td>
                {allPeriods.map((p) => {
                  const pStatus = row.periodStatuses?.find((ps: any) => ps.period.id === p.id)
                  return (
                    <td key={p.id} className="px-4 py-3 text-center whitespace-nowrap">
                      {pStatus ? (
                        <div className="inline-flex flex-col items-center gap-1 cursor-pointer" title={pStatus.remark} onClick={() => onEdit(pStatus.id)}>
                           <StatusBadge status={pStatus.status} small />
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                  )
                })}
                {allPeriods.length > 0 && (
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* If there are records, we allow editing the first one from the row button or they can click the chips */}
                      {row.periodStatuses?.length > 0 && (
                        <>
                          <button
                            onClick={() => onEdit(row.periodStatuses[0].id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Edit first record"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(row.periodStatuses[0].id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Delete first record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  let color = 'bg-gray-100 text-gray-600'
  if (status === attendanceStatus.PRESENT) color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (status === attendanceStatus.ABSENT) color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (status === attendanceStatus.LATE) color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (status === attendanceStatus.LEAVE) color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full ${color} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {status}
    </span>
  )
}
