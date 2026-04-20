import React from 'react'
import { SchoolActions } from './SchoolActions'
import { Building2, User, Mail, MapPin } from 'lucide-react'
import { schoolStatus, userStatus } from '@/src/config/constant'

interface SchoolTableProps {
  schools: any[]
  isLoading: boolean
  onSchoolClick: (id: string) => void
}

export const SchoolTable: React.FC<SchoolTableProps> = ({ schools, isLoading, onSchoolClick }) => {
  
  const getSchoolBadge = (status: string) => {
    switch (status) {
      case schoolStatus.ACTIVE: return 'badge-active'
      case schoolStatus.SUSPENDED: return 'badge-pending'
      case schoolStatus.CLOSED: return 'badge-overdue'
      case schoolStatus.NEW_REGISTRATION: return 'badge-pending'
      case schoolStatus.INACTIVE: return 'bg-[var(--gray-200)] text-[var(--gray-800)]'
      case schoolStatus.CLOSURE_REQUESTED: return 'badge-overdue'
      default: return 'bg-[var(--gray-200)] text-[var(--gray-800)]'
    }
  }

  const getPrincipalBadge = (status: string) => {
    switch (status) {
      case userStatus.ACTIVE: return 'badge-active'
      case userStatus.INACTIVE: return 'bg-[var(--gray-200)] text-[var(--gray-800)]'
    }
  }

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12 bg-[var(--card-bg)] rounded-[var(--card-radius)] border border-[var(--card-border)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--border-strong)] border-t-[var(--primary)] animate-spin"></div>
          <div className="text-[var(--foreground-muted)] font-medium">Loading schools...</div>
        </div>
      </div>
    )
  }

  if (schools.length === 0) {
    return (
        <div className="w-full flex items-center justify-center p-12 bg-[var(--card-bg)] rounded-[var(--card-radius)] border border-[var(--card-border)] shadow-[var(--shadow-sm)]">
          <div className="text-[var(--foreground-muted)] font-medium">No schools found matching your search.</div>
        </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-[var(--card-radius)] shadow-[var(--shadow-sm)] border border-[var(--card-border)] bg-[var(--card-bg)]">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs uppercase bg-[var(--surface-raised)] text-[var(--foreground-secondary)] border-b border-[var(--card-border)]">
          <tr>
            <th className="px-5 py-4 font-semibold">School</th>
            <th className="px-5 py-4 font-semibold">Contact & Address</th>
            <th className="px-5 py-4 font-semibold">School Status</th>
            <th className="px-5 py-4 font-semibold">Principal Details</th>
            <th className="px-5 py-4 font-semibold">Principal Status</th>
            <th className="px-5 py-4 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {schools.map((row) => (
            <tr key={row.id} onClick={() => onSchoolClick(row.id)} className="hover:bg-[var(--sidebar-hover-bg)] transition-colors cursor-pointer">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">{row.schoolName}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{row.schoolType || 'General'}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col gap-1 text-[var(--foreground-secondary)]">
                  <div className="flex items-center gap-2"><Mail size={14} className="text-[var(--primary)] flex-shrink-0"/> <span className="truncate max-w-[180px]">{row.schoolEmail}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-[var(--primary)] flex-shrink-0"/> <span className="truncate max-w-[180px]">{row.address?.province}, {row.address?.district}</span></div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getSchoolBadge(row.schoolStatus)}`}>
                  {row.schoolStatus}
                </span>
              </td>
              <td className="px-5 py-4">
                {row.principal ? (
                  <div className="flex items-center gap-3">
                    {row.principal.profileImage ? (
                      <img src={row.principal.profileImage} alt="profile" className="w-8 h-8 rounded-full object-cover shadow-[var(--shadow-sm)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--secondary-light)] flex items-center justify-center text-[var(--secondary)] flex-shrink-0">
                        <User size={16} />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--foreground)] truncate max-w-[150px]">{row.principal.name}</span>
                      <span className="text-xs text-[var(--foreground-muted)] truncate max-w-[150px]">{row.principal.email}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-[var(--foreground-muted)] italic">Not Assigned</span>
                )}
              </td>
              <td className="px-5 py-4">
                {row.principal ? (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPrincipalBadge(row.principal.status)}`}>
                    {row.principal.status}
                  </span>
                ) : (
                  <span className="text-[var(--foreground-muted)]">-</span>
                )}
              </td>
              <td className="px-5 py-4 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <SchoolActions school={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
