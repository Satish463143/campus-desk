import Subjects from '@/src/features/academic/subject/Subjects'
import CheckPermission from '@/src/config/rbac.config'

export const metadata = { title: 'Subjects | Campus Desk' }

export default function SubjectsPage() {
  return (
    <CheckPermission allowedBy={['principal', 'admin_staff', 'teacher']}>
      <Subjects />
    </CheckPermission>
  )
}
