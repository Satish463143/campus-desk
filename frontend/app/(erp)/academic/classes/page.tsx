import ClassesAndSections from '@/src/features/academic/class/ClassesAndSections'
import CheckPermission from '@/src/config/rbac.config'

export const metadata = { title: 'Classes & Sections | Campus Desk' }

export default function ClassesPage() {
  return (
    <CheckPermission allowedBy={['principal', 'admin_staff', 'teacher']}>
      <ClassesAndSections />
    </CheckPermission>
  )
}
