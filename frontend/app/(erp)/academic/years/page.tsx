import AcademicYears from '@/src/features/academic/academicYear/AcademicYears'
import CheckPermission from '@/src/config/rbac.config'

export const metadata = { title: 'Academic Years | Campus Desk' }

export default function AcademicYearsPage() {
  return (
    <CheckPermission allowedBy={['principal', 'admin_staff']}>
      <AcademicYears />
    </CheckPermission>
  )
}
