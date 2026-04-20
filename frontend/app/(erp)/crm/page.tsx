"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"

import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import CRM from "@/src/features/finance/CRM"

export default function CRMPage() {
    const user = useSelector((state: any) => state.user.loggedInUser)
    const router = useRouter()

    return (
        <CheckPermission allowedBy={[role.PRINCIPAL, role.ACCOUNTANT, role.ADMIN_STAFF]}>
            {user?.schoolId ? (
                <CRM
                    schoolId={user.schoolId} 
                    onClose={() => router.back()} 
                />
            ) : (
                <div className="w-full min-h-screen flex items-center justify-center p-8 text-center text-red-500 font-medium">
                    Critical Error: No School ID is associated with your account.
                </div>
            )}
        </CheckPermission>
    )
}