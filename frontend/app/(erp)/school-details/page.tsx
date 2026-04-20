"use client"
import { role } from "@/src/config/constant"
import CheckPermission from "@/src/config/rbac.config"
import { SchoolDetails } from "@/src/features/schools/SchoolDetails"

import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"

export default function SchoolDetailsPage() {
    const user = useSelector((state: any) => state.user.loggedInUser)
    const router = useRouter()

    return (
        <CheckPermission allowedBy={[role.SUPER_ADMIN, role.PRINCIPAL]}>
            {user?.schoolId ? (
                <SchoolDetails 
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