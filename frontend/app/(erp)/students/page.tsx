"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"
import Student from "@/src/features/students/Student"

export default function StudentsPage() {
    return (
        <CheckPermission allowedBy={[role.PRINCIPAL, role.ADMIN_STAFF, role.TEACHER, role.ACCOUNTANT]}>
            <Student />
        </CheckPermission>
    )
}