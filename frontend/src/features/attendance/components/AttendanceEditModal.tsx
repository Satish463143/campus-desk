import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Swal from 'sweetalert2'
import { useGetPeriodAttendanceByIdQuery, useUpdatePeriodAttendanceMutation } from '../../../store/api/attendanceApi'
import { AttendanceStatus } from '../types/attendance.types'
import { X } from 'lucide-react'
import { attendanceStatus } from '@/src/config/constant'

const updateSchema = yup.object().shape({
  status: yup.string<AttendanceStatus>().oneOf(Object.values(attendanceStatus)).required(),
  remark: yup.string().nullable(),
})

interface AttendanceEditModalProps {
  recordId: string | null
  onClose: () => void
}


export function AttendanceEditModal({ recordId, onClose }: AttendanceEditModalProps) {
  const { data: recordData, isFetching } = useGetPeriodAttendanceByIdQuery(recordId as string, {
    skip: !recordId,
  })
  
  const [updateAttendance, { isLoading: isUpdating }] = useUpdatePeriodAttendanceMutation()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(updateSchema),
    defaultValues: {
      status: attendanceStatus.PRESENT as AttendanceStatus,
      remark: '',
    }
  })

  useEffect(() => {
    if (recordData?.result) {
      reset({
        status: recordData.result.status as AttendanceStatus,
        remark: recordData.result.remark || '',
      })
    }
  }, [recordData, reset])

  if (!recordId) return null

  const onSubmit = async (data: any) => {
    try {
      await updateAttendance({ id: recordId, data }).unwrap()
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Attendance record has been updated.',
        timer: 1500,
        showConfirmButton: false,
      })
      onClose()
    } catch (err: any) {
      Swal.fire('Error', err?.data?.message || 'Failed to update attendance', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Attendance Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {isFetching ? (
          <div className="p-6 space-y-4 animate-pulse">
             <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
             <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
             <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-4">
                Updating attendance for <span className="font-semibold text-gray-700 dark:text-gray-200">{recordData?.result?.student?.user?.name}</span>
                <br />
                Period: <span className="font-semibold text-gray-700 dark:text-gray-200">{recordData?.result?.period?.name}</span>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select {...register('status')} className="erp-input w-full">
                <option value={attendanceStatus.PRESENT}>PRESENT</option>
                <option value={attendanceStatus.ABSENT}>ABSENT</option>
                <option value={attendanceStatus.LATE}>LATE</option>
                <option value={attendanceStatus.LEAVE}>LEAVE</option>
              </select>
              {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remark (Optional)
              </label>
              <textarea
                {...register('remark')}
                className="erp-input w-full resize-none"
                rows={3}
                placeholder="Add a reason..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={isUpdating} className="btn-primary">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
