import Periods from '@/src/features/academic/periods/Periods'
import CheckPermission from '@/src/config/rbac.config'

export const metadata = { title: 'Periods | Campus Desk' }

export default function PeriodsPage() {
  return (
    <CheckPermission allowedBy={['principal', 'admin_staff']}>
      <Periods />
    </CheckPermission>
  )
}
