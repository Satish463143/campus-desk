"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"
import Teachers from "@/src/features/teachers/teachers"

export default function SchoolListPage() {
    return (
        <CheckPermission allowedBy={[role.PRINCIPAL,role.ADMIN_STAFF]}>
            <Teachers />
        </CheckPermission>
    )
}