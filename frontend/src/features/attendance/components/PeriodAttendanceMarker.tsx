import React, { useState, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Swal from 'sweetalert2'
import { useMarkPeriodAttendanceMutation, useGetSectionDailySummaryQuery } from '../../../store/api/attendanceApi'
import { useGetPeriodsQuery } from '../../../store/api/periodApi'
import { AttendanceFilterState, AttendanceStatus } from '../types/attendance.types'
import { RootState } from '../../../store/store'
import { useSelector } from 'react-redux'
import { attendanceStatus } from '@/src/config/constant'

const attendanceSchema = yup.object().shape({
  periodId: yup.string().required('Period is required'),
  attendance: yup.array().of(
    yup.object().shape({
      studentId: yup.string().required(),
      status: yup.mixed<Exclude<AttendanceStatus, typeof attendanceStatus.PRESENT>>().oneOf([attendanceStatus.ABSENT, attendanceStatus.LATE, attendanceStatus.LEAVE]).required(),
      remark: yup.string().nullable(),
    })
  ).required(),
})

interface PeriodAttendanceMarkerProps {
  filters: AttendanceFilterState
}

export function PeriodAttendanceMarker({ filters }: PeriodAttendanceMarkerProps) {
  const { academicYearId, classId, sectionId, date } = filters
  const loggedInUser = useSelector((state: RootState) => state.user.loggedInUser as any)
  const teacherId = loggedInUser?.user?.id // Assuming the teacher ID is here, or we fetch it from profile
  
  const [markAttendance, { isLoading: isSubmitting }] = useMarkPeriodAttendanceMutation()
  
  const { data: periodsData, isFetching: isLoadingPeriods } = useGetPeriodsQuery(
    { academicYearId: academicYearId || undefined },
    { skip: !academicYearId }
  )
  
  const { data: studentsData, isFetching: isLoadingStudents } = useGetSectionDailySummaryQuery(
    { sectionId: sectionId as string, date },
    { skip: !sectionId }
  )

  const periods = periodsData?.result || []
  const students = studentsData?.result || []

  const [geo, setGeo] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    resolver: yupResolver(attendanceSchema),
    defaultValues: {
      periodId: '',
      attendance: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attendance',
  })

  const attendanceWatch = watch('attendance')

  const toggleStudentStatus = (studentId: string, status: Exclude<AttendanceStatus, typeof attendanceStatus.PRESENT>) => {
    const existingIndex = attendanceWatch.findIndex(a => a.studentId === studentId)
    
    if (existingIndex >= 0) {
      if (attendanceWatch[existingIndex].status === status) {
        // Toggle off -> implies PRESENT
        remove(existingIndex)
      } else {
        // Change status
        const newArr = [...attendanceWatch]
        newArr[existingIndex].status = status
        setValue('attendance', newArr)
      }
    } else {
      // Add new non-present status
      append({ studentId, status, remark: '' })
    }
  }

  const handleRemarkChange = (studentId: string, remark: string) => {
    const existingIndex = attendanceWatch.findIndex(a => a.studentId === studentId)
    if (existingIndex >= 0) {
      const newArr = [...attendanceWatch]
      newArr[existingIndex].remark = remark
      setValue('attendance', newArr)
    }
  }

  const onSubmit = async (data: any) => {
    if (!sectionId || !classId || !academicYearId || !teacherId) {
      Swal.fire('Error', 'Missing required filters (Class, Section, etc) or Teacher profile.', 'error')
      return
    }

    try {
      await markAttendance({
        sectionId,
        classId,
        academicYearId,
        date,
        periodId: data.periodId,
        teacherId,
        teacherLatitude: geo.lat,
        teacherLongitude: geo.lng,
        attendance: data.attendance,
      }).unwrap()

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Period attendance marked successfully.',
        timer: 1500,
        showConfirmButton: false
      })
      reset({ periodId: '', attendance: [] })
    } catch (err: any) {
      Swal.fire('Error', err?.data?.message || 'Failed to mark attendance', 'error')
    }
  }

  if (!sectionId || !classId || !academicYearId) {
    return (
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Mark Period Attendance</h2>
        <p className="text-gray-500">Please select an Academic Year, Class, and Section first.</p>
      </div>
    )
  }

  return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mark Period Attendance</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Period
          </label>
          <Controller
            name="periodId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <select {...field} className="erp-input w-full" disabled={isLoadingPeriods}>
                  <option value="">Select Period...</option>
                  {periods.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (P{p.periodNumber})</option>
                  ))}
                </select>
                {fieldState.error && <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>}
              </>
            )}
          />
        </div>

        {isLoadingStudents ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <p className="text-gray-500 py-4">No students found in this section.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 w-1/3">Student</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Remark (Optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((row: any) => {
                  const currentStatus = attendanceWatch.find(a => a.studentId === row.studentId)?.status
                  const remark = attendanceWatch.find(a => a.studentId === row.studentId)?.remark || ''

                  return (
                    <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.student.user.profileImage ? (
                            <img src={row.student.user.profileImage} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {row.student.user.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">{row.student.user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Present is implied if none selected */}
                          <button
                            type="button"
                            onClick={() => {
                               // To select present, we actually remove the student from the array
                               const idx = attendanceWatch.findIndex(a => a.studentId === row.studentId)
                               if (idx >= 0) remove(idx)
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${!currentStatus ? 'bg-green-100 text-green-700 ring-2 ring-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            PRESENT
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(row.studentId, attendanceStatus.ABSENT)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentStatus === attendanceStatus.ABSENT ? 'bg-red-100 text-red-700 ring-2 ring-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            ABSENT
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(row.studentId, attendanceStatus.LATE)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentStatus === attendanceStatus.LATE ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            LATE
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(row.studentId, attendanceStatus.LEAVE)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentStatus === attendanceStatus.LEAVE ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            LEAVE
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Reason..."
                          disabled={!currentStatus}
                          value={remark}
                          onChange={(e) => handleRemarkChange(row.studentId, e.target.value)}
                          className="erp-input w-full text-sm disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || students.length === 0}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </form>
    </div>
  )
}
