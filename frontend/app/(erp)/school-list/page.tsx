"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"
import { SchoolList } from "@/src/features/schools/SchoolList"

export default function SchoolListPage() {
    return (
        <CheckPermission allowedBy={role.SUPER_ADMIN}>
            <SchoolList />
        </CheckPermission>
    )
}