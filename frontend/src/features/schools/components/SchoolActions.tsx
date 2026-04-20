import React, { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useUpdateSchoolStatusMutation, useDeleteSchoolMutation } from '@/src/store/api/schoolApi'
import { useUpdatePrincipalStatusMutation } from '@/src/store/api/userApi'
import { userStatus } from '@/src/config/constant'
import { schoolStatus } from '@/src/config/constant'
import Swal from 'sweetalert2'

interface SchoolActionsProps {
  school: any
}

export const SchoolActions: React.FC<SchoolActionsProps> = ({ school }) => {
  const [updateSchool, { isLoading: isUpdatingSchool }] = useUpdateSchoolStatusMutation()
  const [deleteSchool, { isLoading: isDeletingSchool }] = useDeleteSchoolMutation()
  const [updatePrincipal, { isLoading: isUpdatingPrincipal }] = useUpdatePrincipalStatusMutation()
  
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 224 + window.scrollX // 224px is w-56
      })
    }
    setIsOpen(!isOpen)
  }

  React.useEffect(() => {
    if (isOpen) {
      const closeMenu = () => setIsOpen(false)
      window.addEventListener('scroll', closeMenu, true)
      window.addEventListener('resize', closeMenu)
      return () => {
        window.removeEventListener('scroll', closeMenu, true)
        window.removeEventListener('resize', closeMenu)
      }
    }
  }, [isOpen])

  const handleUpdateSchoolStatus = async (status: string) => {
    try {
      await updateSchool({ id: school.id, status }).unwrap()
      setIsOpen(false)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.data?.message || 'Failed to update school status' })
    }
  }

  const handleUpdatePrincipalStatus = async (status: string) => {
    if (school.principal?.id) {
      try {
        await updatePrincipal({ id: school.principal.id, status }).unwrap()
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err?.data?.message || 'Failed to update principal status' })
      }
    }
    setIsOpen(false)
  }

  const handleDeleteSchool = async () => {
    setIsOpen(false)
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! All related data will be permanently deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--danger)',
      cancelButtonColor: 'var(--primary)',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await deleteSchool(school.id).unwrap()
        Swal.fire('Deleted!', 'The school has been deleted.', 'success')
      } catch (error) {
        Swal.fire('Error', 'Failed to delete school.', 'error')
      }
    }
  }

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          toggleDropdown()
        }} 
        className="p-2 border border-[var(--border-strong)] rounded-[var(--radius-md)] text-[var(--foreground-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}></div>
          <div 
            className="absolute w-56 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-lg)] rounded-[var(--radius-md)] z-[101] py-2 animate-fade-in"
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
              School Status
            </div>
            <button onClick={() => handleUpdateSchoolStatus(schoolStatus.ACTIVE)} disabled={isUpdatingSchool} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--primary-light)] hover:text-[var(--primary-700)] transition-colors">Set to Active</button>
            <button onClick={() => handleUpdateSchoolStatus(schoolStatus.SUSPENDED)} disabled={isUpdatingSchool} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--warning-bg)] hover:text-[var(--warning-dark)] transition-colors">Suspend School</button>
            <button onClick={() => handleUpdateSchoolStatus(schoolStatus.CLOSED)} disabled={isUpdatingSchool} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--danger-bg)] hover:text-[var(--danger-dark)] transition-colors">Close School</button>
            
            {school.principal && (
              <>
                <div className="border-t border-[var(--border-strong)] my-2"></div>
                <div className="px-4 py-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                  Principal Status
                </div>
                <button onClick={() => handleUpdatePrincipalStatus(userStatus.ACTIVE)} disabled={isUpdatingPrincipal} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--primary-light)] hover:text-[var(--primary-700)] transition-colors">Set Principal Active</button>
                <button onClick={() => handleUpdatePrincipalStatus(userStatus.INACTIVE)} disabled={isUpdatingPrincipal} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--danger-bg)] hover:text-[var(--danger-dark)] transition-colors">Set Principal Inactive</button>
              </>
            )}

            <div className="border-t border-[var(--border-strong)] my-2"></div>
            <button onClick={handleDeleteSchool} disabled={isDeletingSchool} className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-dark)] transition-colors">
              Delete School
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
