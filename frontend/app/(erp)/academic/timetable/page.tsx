import Timetable from '@/src/features/academic/timeTable/Timetable'
import CheckPermission from '@/src/config/rbac.config'

export const metadata = { title: 'Timetable | Campus Desk' }

export default function TimetablePage() {
  return (
    <CheckPermission allowedBy={['principal', 'admin_staff', 'teacher', 'student', 'parent']}>
      <Timetable />
    </CheckPermission>
  )
}
