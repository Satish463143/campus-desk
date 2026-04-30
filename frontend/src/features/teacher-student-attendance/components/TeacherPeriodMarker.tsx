'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Swal from 'sweetalert2'
import {
  useMarkPeriodAttendanceMutation,
  useGetSectionDailySummaryQuery,
} from '../../../store/api/attendanceApi'
import { useGetTeacherTimetableQuery } from '../../../store/api/timetableApi'
import { TeacherAttendanceFilterState, AttendanceStatus } from '../types/attendance.types'
import { attendanceStatus, dayOfWeek } from '@/src/config/constant'
import { CheckCircle, XCircle, Clock, AlertCircle, MapPin } from 'lucide-react'

const schema = yup.object().shape({
  periodId: yup.string().required('Period is required'),
  attendance: yup
    .array()
    .of(
      yup.object().shape({
        studentId: yup.string().required(),
        status: yup
          .mixed<Exclude<AttendanceStatus, 'PRESENT'>>()
          .oneOf([attendanceStatus.ABSENT, attendanceStatus.LATE, attendanceStatus.LEAVE])
          .required(),
        remark: yup.string().nullable(),
      })
    )
    .required(),
})

interface TeacherPeriodMarkerProps {
  filters: TeacherAttendanceFilterState
  teacherProfileId: string | null
}

const DAY_MAP: Record<number, string> = {
  0: dayOfWeek.SUNDAY, 1: dayOfWeek.MONDAY, 2: dayOfWeek.TUESDAY, 3: dayOfWeek.WEDNESDAY,
  4: dayOfWeek.THURSDAY, 5: dayOfWeek.FRIDAY, 6: dayOfWeek.SATURDAY,
}

export function TeacherPeriodMarker({ filters, teacherProfileId }: TeacherPeriodMarkerProps) {
  const { academicYearId, classId, sectionId, periodId, date } = filters

  const [geo, setGeo] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [geoError, setGeoError] = useState(false)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeoError(true),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [])

  const [markAttendance, { isLoading: isSubmitting }] = useMarkPeriodAttendanceMutation()

  // Fetch teacher's timetable to get available periods for this day
  const selectedDay = DAY_MAP[new Date(date + 'T00:00:00Z').getUTCDay()]
  const { data: timetableData } = useGetTeacherTimetableQuery(
    { teacherId: teacherProfileId as string, academicYearId: academicYearId as string },
    { skip: !teacherProfileId || !academicYearId }
  )
  const allSlots: any[] = timetableData?.result || timetableData?.data || []
  const todaySlots = allSlots.filter(
    (s) => s.dayOfWeek === selectedDay &&
           s.class?.id === classId &&
           s.section?.id === sectionId
  )
  const availablePeriods = todaySlots
    .map((s) => s.period)
    .filter(Boolean)
    .sort((a: any, b: any) => a.periodNumber - b.periodNumber)

  // Fetch students for the selected section
  const { data: studentsData, isFetching: isLoadingStudents } = useGetSectionDailySummaryQuery(
    { sectionId: sectionId as string, date },
    { skip: !sectionId }
  )
  const students: any[] = studentsData?.result || []

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { periodId: periodId || '', attendance: [] },
  })

  // Sync periodId filter → form field
  useEffect(() => {
    setValue('periodId', periodId || '')
  }, [periodId, setValue])

  const { fields, append, remove } = useFieldArray({ control, name: 'attendance' })
  const attendanceWatch = watch('attendance')

  const getStudentStatus = (studentId: string) =>
    attendanceWatch.find((a) => a.studentId === studentId)?.status

  const toggleStatus = (studentId: string, status: Exclude<AttendanceStatus, typeof attendanceStatus.PRESENT>) => {
    const idx = attendanceWatch.findIndex((a) => a.studentId === studentId)
    if (idx >= 0) {
      if (attendanceWatch[idx].status === status) {
        remove(idx) // toggle off → PRESENT
      } else {
        const arr = [...attendanceWatch]
        arr[idx] = { ...arr[idx], status }
        setValue('attendance', arr)
      }
    } else {
      append({ studentId, status, remark: '' })
    }
  }

  const setPresent = (studentId: string) => {
    const idx = attendanceWatch.findIndex((a) => a.studentId === studentId)
    if (idx >= 0) remove(idx)
  }

  const handleRemarkChange = (studentId: string, remark: string) => {
    const idx = attendanceWatch.findIndex((a) => a.studentId === studentId)
    if (idx >= 0) {
      const arr = [...attendanceWatch]
      arr[idx] = { ...arr[idx], remark }
      setValue('attendance', arr)
    }
  }

  const markAll = (status: typeof attendanceStatus.PRESENT | Exclude<AttendanceStatus, typeof attendanceStatus.PRESENT>) => {
    if (status === attendanceStatus.PRESENT) {
      setValue('attendance', [])
    } else {
      const newArr = students.map((s: any) => ({
        studentId: s.studentId,
        status: status as Exclude<AttendanceStatus, typeof attendanceStatus.PRESENT>,
        remark: '',
      }))
      setValue('attendance', newArr)
    }
  }

  const onSubmit = async (data: any) => {
    if (!sectionId || !classId || !academicYearId || !teacherProfileId) {
      Swal.fire('Missing Info', 'Please select a class and section first.', 'warning')
      return
    }

    try {
      await markAttendance({
        sectionId,
        classId,
        academicYearId,
        date,
        periodId: data.periodId,
        teacherId: teacherProfileId,
        teacherLatitude: geo.lat,
        teacherLongitude: geo.lng,
        attendance: data.attendance,
      }).unwrap()

      Swal.fire({ icon: 'success', title: 'Saved!', text: 'Period attendance marked successfully.', timer: 1500, showConfirmButton: false })
      reset({ periodId: data.periodId, attendance: [] })
    } catch (err: any) {
      Swal.fire('Error', err?.data?.message || 'Failed to mark attendance', 'error')
    }
  }

  if (!sectionId || !classId || !academicYearId) {
    return (
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl text-center text-gray-500 text-sm">
        <BookOpenIcon className="mx-auto mb-3 opacity-30" size={36} />
        Please select a class and section from the filters above to mark attendance.
      </div>
    )
  }

  return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Mark Period Attendance</h2>
        {geo.lat ? (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <MapPin size={12} /> Location captured
          </span>
        ) : geoError ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle size={12} /> Location unavailable
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={12} /> Getting location...
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5">
        {/* Period selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Select Period <span className="text-red-500">*</span>
          </label>
          <Controller
            name="periodId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <select {...field} className="erp-input w-full max-w-xs">
                  <option value="">Choose period...</option>
                  {availablePeriods.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Period {p.periodNumber}
                    </option>
                  ))}
                </select>
                {fieldState.error && (
                  <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>

        {/* Quick-mark all buttons */}
        {students.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Mark all:</span>
            <button type="button" onClick={() => markAll(attendanceStatus.PRESENT)} className="px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">✓ All Present</button>
            <button type="button" onClick={() => markAll(attendanceStatus.ABSENT)} className="px-3 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">All Absent</button>
          </div>
        )}

        {/* Students table */}
        {isLoadingStudents ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No students enrolled in this section.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 w-1/3">Student</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((row: any) => {
                  const currentStatus = getStudentStatus(row.studentId)
                  const remark = attendanceWatch.find((a) => a.studentId === row.studentId)?.remark || ''

                  return (
                    <tr key={row.studentId} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.student?.user?.profileImage ? (
                            <img src={row.student.user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {row.student?.user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                            {row.student?.user?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <StatusButton
                            label="Present"
                            active={!currentStatus}
                            color="green"
                            onClick={() => setPresent(row.studentId)}
                          />
                          <StatusButton
                            label="Absent"
                            active={currentStatus === attendanceStatus.ABSENT}
                            color="red"
                            onClick={() => toggleStatus(row.studentId, attendanceStatus.ABSENT)}
                          />
                          <StatusButton
                            label="Late"
                            active={currentStatus === attendanceStatus.LATE}
                            color="yellow"
                            onClick={() => toggleStatus(row.studentId, attendanceStatus.LATE)}
                          />
                          <StatusButton
                            label="Leave"
                            active={currentStatus === attendanceStatus.LEAVE}
                            color="blue"
                            onClick={() => toggleStatus(row.studentId, attendanceStatus.LEAVE)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Optional reason..."
                          disabled={!currentStatus}
                          value={remark}
                          onChange={(e) => handleRemarkChange(row.studentId, e.target.value)}
                          className="erp-input w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {attendanceWatch.length === 0
              ? `All ${students.length} students will be marked Present.`
              : `${attendanceWatch.length} student(s) marked non-present.`}
          </p>
          <button
            type="submit"
            disabled={isSubmitting || students.length === 0}
            className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatusButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color: 'green' | 'red' | 'yellow' | 'blue'
  onClick: () => void
}) {
  const baseStyle = 'px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer'
  const colorMap = {
    green:  active ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300'  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400 hover:text-green-700',
    red:    active ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-300'        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-red-400 hover:text-red-700',
    yellow: active ? 'bg-yellow-500 text-white border-yellow-500 ring-2 ring-yellow-300' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-yellow-400 hover:text-yellow-700',
    blue:   active ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-700',
  }

  return (
    <button type="button" onClick={onClick} className={`${baseStyle} ${colorMap[color]}`}>
      {label}
    </button>
  )
}

function BookOpenIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
