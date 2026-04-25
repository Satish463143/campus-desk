import { useEffect } from 'react'
import Swal from 'sweetalert2'
import { useDeletePeriodAttendanceMutation } from '../../../store/api/attendanceApi'

interface AttendanceDeleteDialogProps {
  recordId: string | null
  onClose: () => void
}

export function AttendanceDeleteDialog({ recordId, onClose }: AttendanceDeleteDialogProps) {
  const [deleteAttendance] = useDeletePeriodAttendanceMutation()

  useEffect(() => {
    if (!recordId) return

    Swal.fire({
      title: 'Are you sure?',
      text: "You are about to delete this attendance record. This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteAttendance(recordId).unwrap()
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Attendance record has been deleted.',
            timer: 1500,
            showConfirmButton: false
          })
        } catch (error: any) {
          Swal.fire('Error!', error?.data?.message || 'Failed to delete record.', 'error')
        }
      }
      onClose()
    })
  }, [recordId, deleteAttendance, onClose])

  return null // SweetAlert handles the UI
}
