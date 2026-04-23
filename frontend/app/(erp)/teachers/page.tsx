"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"
import Teachers from "@/src/features/teachers/teachers"

export default function TeachersPage() {
    return (
        <CheckPermission allowedBy={[role.PRINCIPAL, role.ADMIN_STAFF,role.ACCOUNTANT]}>
            <Teachers />
        </CheckPermission>
    )
}