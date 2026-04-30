'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Swal from 'sweetalert2'
import {
  useMarkTeacherAttendanceMutation,
  useGetTeacherAttendanceQuery,
} from '../../../store/api/attendanceApi'
import { attendanceStatus } from '@/src/config/constant'
import { AttendanceStatus } from '../types/attendance.types'
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react'

const schema = yup.object().shape({
  status: yup
    .mixed<AttendanceStatus>()
    .oneOf([attendanceStatus.PRESENT, attendanceStatus.ABSENT, attendanceStatus.LATE, attendanceStatus.LEAVE])
    .required('Status is required'),
  remark: yup.string().nullable(),
  checkInTime: yup.string().nullable(),
  checkOutTime: yup.string().nullable(),
})

interface TeacherSelfAttendancePanelProps {
  date: string
  teacherProfileId: string | null
  teacherName?: string
}

export function TeacherSelfAttendancePanel({
  date,
  teacherProfileId,
  teacherName,
}: TeacherSelfAttendancePanelProps) {
  const [page, setPage] = useState(1)

  const [markAttendance, { isLoading: isSubmitting }] = useMarkTeacherAttendanceMutation()

  const { data: historyData, isFetching: isLoadingHistory } = useGetTeacherAttendanceQuery(
    { teacherId: teacherProfileId, page, limit: 15 },
    { skip: !teacherProfileId }
  )
  const records: any[] = historyData?.result || []
  const meta = historyData?.meta

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      status: attendanceStatus.PRESENT as AttendanceStatus,
      remark: '',
      checkInTime: '',
      checkOutTime: '',
    },
  })

  const selectedStatus = watch('status')

  const onSubmit = async (data: any) => {
    if (!teacherProfileId) {
      Swal.fire('Error', 'Teacher profile not found.', 'error')
      return
    }

    try {
      await markAttendance({
        teacherId: teacherProfileId,
        date,
        status: data.status,
        remark: data.remark || null,
        checkInTime: data.checkInTime
          ? new Date(`${date}T${data.checkInTime}`).toISOString()
          : null,
        checkOutTime: data.checkOutTime
          ? new Date(`${date}T${data.checkOutTime}`).toISOString()
          : null,
      }).unwrap()

      Swal.fire({
        icon: 'success',
        title: 'Attendance Saved',
        text: `Your attendance for ${date} has been recorded.`,
        timer: 1800,
        showConfirmButton: false,
      })
      reset()
    } catch (err: any) {
      Swal.fire('Error', err?.data?.message || 'Failed to save attendance', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Mark Self Attendance Card */}
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
            Mark My Attendance
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {teacherName && <span className="font-medium text-gray-700 dark:text-gray-300">{teacherName} · </span>}
            <span>{date}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5">
          {/* Status selector — visual cards */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: attendanceStatus.PRESENT, label: 'Present', icon: CheckCircle, color: 'green' },
                { value: attendanceStatus.ABSENT,  label: 'Absent',  icon: XCircle,      color: 'red'   },
                { value: attendanceStatus.LATE,    label: 'Late',    icon: Clock,         color: 'yellow'},
                { value: attendanceStatus.LEAVE,   label: 'Leave',   icon: AlertTriangle, color: 'blue'  },
              ].map(({ value, label, icon: Icon, color }) => {
                const isActive = selectedStatus === value
                const colorMap: Record<string, string> = {
                  green:  isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-300',
                  red:    isActive ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-2 ring-red-200 dark:ring-red-800'             : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300',
                  yellow: isActive ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-yellow-300',
                  blue:   isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'         : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300',
                }
                return (
                  <label
                    key={value}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-gray-900 ${colorMap[color]}`}
                  >
                    <input type="radio" value={value} {...register('status')} className="sr-only" />
                    <Icon size={22} />
                    <span className="text-sm font-semibold">{label}</span>
                  </label>
                )
              })}
            </div>
            {errors.status && (
              <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Time fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check-In Time
              </label>
              <input type="time" {...register('checkInTime')} className="erp-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check-Out Time
              </label>
              <input type="time" {...register('checkOutTime')} className="erp-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center gap-1"><FileText size={13} /> Remark</span>
              </label>
              <input
                type="text"
                placeholder="Optional note..."
                {...register('remark')}
                className="erp-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save My Attendance'}
            </button>
          </div>
        </form>
      </div>

      {/* Attendance History */}
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">My Attendance History</h3>
          {meta && (
            <span className="text-xs text-gray-400">{meta.total} total records</span>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No attendance records found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Check-In</th>
                    <th className="px-4 py-3 font-semibold">Check-Out</th>
                    <th className="px-4 py-3 font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {records.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <SelfStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {row.checkInTime
                          ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {row.checkOutTime
                          ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.total > meta.limit && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Page {meta.currentPage} of {Math.ceil(meta.total / meta.limit)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(meta.total / meta.limit)}
                    className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SelfStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    [attendanceStatus.PRESENT]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    [attendanceStatus.ABSENT]:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    [attendanceStatus.LATE]:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    [attendanceStatus.LEAVE]:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
