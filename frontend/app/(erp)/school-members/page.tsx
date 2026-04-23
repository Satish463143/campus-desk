"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"
import SchoolMember from "@/src/features/schoolMember/schoolMember"

export default function SchoolMembersPage() {
    return (
        <CheckPermission allowedBy={[role.PRINCIPAL, role.ADMIN_STAFF, role.ACCOUNTANT]}>
            <SchoolMember />
        </CheckPermission>
    )
}