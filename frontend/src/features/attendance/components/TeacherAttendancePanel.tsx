import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from 'react-select'
import { useAppSelector } from '../../../store/hooks'
import { useListTeachersQuery } from '../../../store/api/teacherApi'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Swal from 'sweetalert2'
import { useGetTeacherAttendanceQuery, useMarkTeacherAttendanceMutation } from '../../../store/api/attendanceApi'
import { AttendanceFilterState, AttendanceStatus } from '../types/attendance.types'
import { attendanceStatus } from '@/src/config/constant'

const teacherAttendanceSchema = yup.object().shape({
  teacherId: yup.string().required('Teacher ID is required'),
  status: yup.mixed<AttendanceStatus>().oneOf([attendanceStatus.PRESENT, attendanceStatus.ABSENT, attendanceStatus.LATE, attendanceStatus.LEAVE]).required(),
  remark: yup.string().nullable(),
  checkInTime: yup.string().nullable(),
  checkOutTime: yup.string().nullable(),
})

interface TeacherAttendancePanelProps {
  filters: AttendanceFilterState
}

export function TeacherAttendancePanel({ filters }: TeacherAttendancePanelProps) {
  const { date } = filters
  const [page, setPage] = useState(1)

  const { data: recordsData, isFetching } = useGetTeacherAttendanceQuery({
    from: date,
    to: date,
    page,
    limit: 20,
  })

  const records = recordsData?.result || []

  const [markTeacherAttendance, { isLoading: isSubmitting }] = useMarkTeacherAttendanceMutation()
  
  const user = useAppSelector((state: any) => state.user.loggedInUser)
  const isTeacher = user?.role === 'TEACHER'

  const { data: teachersData, isFetching: isTeachersLoading } = useListTeachersQuery({ limit: 500 })
  const teachers = teachersData?.result || teachersData?.data || []
  
  const teacherOptions = teachers.map((t: any) => ({
    value: t.id,
    label: t.user?.name || t.name || t.id
  }))

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(teacherAttendanceSchema),
    defaultValues: {
      teacherId: '', // Ideally a select, using text input since we lack teacherApi right now
      status: 'PRESENT' as AttendanceStatus,
      remark: '',
      checkInTime: '',
      checkOutTime: '',
    }
  })

  // Auto-set teacherId if logged in user is a teacher
  useEffect(() => {
    if (isTeacher && teachers.length > 0) {
      const teacher = teachers.find((t: any) => t.user?.id === user?.id || t.user?._id === user?.id)
      if (teacher || user?.teacherId) {
        setValue('teacherId', teacher?.id || user?.teacherId)
      }
    }
  }, [isTeacher, teachers, user, setValue])

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        date,
        checkInTime: data.checkInTime ? new Date(`${date}T${data.checkInTime}`).toISOString() : null,
        checkOutTime: data.checkOutTime ? new Date(`${date}T${data.checkOutTime}`).toISOString() : null,
      }
      
      await markTeacherAttendance(payload).unwrap()
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Teacher attendance marked successfully.',
        timer: 1500,
        showConfirmButton: false
      })
      reset()
    } catch (err: any) {
      Swal.fire('Error', err?.data?.message || 'Failed to mark teacher attendance', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mark Teacher Attendance ({date})</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teacher
            </label>
            {isTeacher ? (
              <div className="erp-input w-full bg-gray-50 text-gray-500 cursor-not-allowed flex items-center h-[42px]">
                {user?.name || 'Loading...'}
              </div>
            ) : (
              <Controller
                name="teacherId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={teacherOptions}
                    isLoading={isTeachersLoading}
                    placeholder="Search teacher..."
                    className="react-select-container text-black"
                    classNamePrefix="react-select"
                    onChange={(option) => field.onChange(option?.value)}
                    value={teacherOptions.find((opt: any) => opt.value === field.value) || null}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '42px',
                        borderColor: errors.teacherId ? '#ef4444' : base.borderColor,
                      })
                    }}
                  />
                )}
              />
            )}
            {errors.teacherId && <p className="text-xs text-red-600 mt-1">{errors.teacherId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select {...register('status')} className="erp-input w-full">
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="LATE">LATE</option>
              <option value="LEAVE">LEAVE</option>
            </select>
          </div>

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

          <div className="col-span-1 md:col-span-1">
             <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-[42px]">
               {isSubmitting ? 'Saving...' : 'Save'}
             </button>
          </div>
        </form>
      </div>

      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
           <h3 className="font-semibold text-gray-700 dark:text-gray-200">Attendance Records</h3>
        </div>
        
        {isFetching ? (
          <div className="p-6 flex justify-center text-gray-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No teacher attendance records found for this date.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Teacher</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Check-In</th>
                  <th className="px-4 py-3 font-semibold">Check-Out</th>
                  <th className="px-4 py-3 font-semibold">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {records.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {row.teacher?.user?.name || row.teacherId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let color = 'bg-gray-100 text-gray-600'
  if (status === 'PRESENT') color = 'bg-green-100 text-green-700'
  if (status === 'ABSENT') color = 'bg-red-100 text-red-700'
  if (status === 'LATE') color = 'bg-yellow-100 text-yellow-700'
  if (status === 'LEAVE') color = 'bg-blue-100 text-blue-700'

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full px-2.5 py-1 text-xs ${color}`}>
      {status}
    </span>
  )
}
