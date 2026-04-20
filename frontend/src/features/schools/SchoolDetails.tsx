import React from 'react'
import { useGetSchoolQuery } from '@/src/store/api/schoolApi'
import { X, Building2, MapPin, Mail, Phone, Calendar, Hash, FileText } from 'lucide-react'
import { schoolStatus } from '@/src/config/constant'

interface SchoolDetailsProps {
  schoolId: string
  onClose: () => void
}

export const SchoolDetails: React.FC<SchoolDetailsProps> = ({ schoolId, onClose }) => {
  const { data: response, isLoading } = useGetSchoolQuery(schoolId)
  // Based on your route response structure -> { message, result: { ...school } } 
  // Let's fallback to response if it returned plain.
  const school = response?.result || response

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

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 bg-[var(--background-secondary)] w-full h-full flex flex-col animate-fade-in">
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-[var(--border-strong)] border-t-[var(--primary)] animate-spin"></div>
            <div className="text-[var(--foreground-muted)] font-medium">Loading details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="absolute inset-0 z-50 bg-[var(--background-secondary)] p-6 overflow-auto">
        <button onClick={onClose} className="btn-ghost flex items-center gap-2 mb-4"><X size={18} /> Back</button>
        <div className="p-8 text-center text-[var(--foreground-muted)] bg-[var(--card-bg)] rounded-[var(--card-radius)] border border-[var(--card-border)]">School not found.</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 bg-[var(--background-secondary)] overflow-y-auto animate-fade-in h-full w-full">
      <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="btn-ghost flex items-center gap-2">
            <X size={18} /> Back to Directory
          </button>
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getSchoolBadge(school.schoolStatus)}`}>
            {school.schoolStatus}
          </span>
        </div>

        <div className="flex flex-col gap-1 px-2">
           <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
             {school.schoolName}
           </h1>
        </div>

        {/* Cover & Logo Section */}
        <div className="relative w-full h-64 bg-[var(--primary-light)] rounded-[var(--card-radius)] border border-[var(--card-border)] overflow-visible mb-6">
           {school.coverImage ? (
             <img src={school.coverImage} className="w-full h-full object-cover rounded-[var(--card-radius)]" alt="Cover" />
           ) : (
             <div className="absolute inset-0 flex items-center justify-center text-[var(--primary-300)]">
                <Building2 size={64} opacity={0.5} />
             </div>
           )}
           <div className="absolute -bottom-8 left-8 w-24 h-24 bg-[var(--card-bg)] rounded-xl border-4 border-[var(--card-bg)] shadow-[var(--shadow-md)] flex items-center justify-center overflow-hidden">
             {school.logo ? (
                <img src={school.logo} className="w-full h-full object-cover" alt="Logo" />
             ) : (
                <Building2 size={32} className="text-[var(--primary)]" />
             )}
           </div>
        </div>

        {/* Details Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="erp-card flex flex-col gap-4">
             <h2 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">Basic Information</h2>
             <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 flex items-center gap-1 text-xs uppercase tracking-wide"><Hash size={12}/> Registration Type</div>
                  <div className="font-semibold text-[var(--foreground)]">{school.schoolType || 'General'}</div>
                </div>
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 flex items-center gap-1 text-xs uppercase tracking-wide"><Calendar size={12}/> Established Year</div>
                  <div className="font-semibold text-[var(--foreground)]">{school.establishedYear || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 flex items-center gap-1 text-xs uppercase tracking-wide"><Hash size={12}/> PAN Number</div>
                  <div className="font-semibold text-[var(--foreground)]">{school.panNumber || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 flex items-center gap-1 text-xs uppercase tracking-wide"><FileText size={12}/> Reg. Number</div>
                  <div className="font-semibold text-[var(--foreground)]">{school.registrationNumber || 'N/A'}</div>
                </div>
             </div>
          </div>

          <div className="erp-card flex flex-col gap-4">
             <h2 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">Contact Details</h2>
             <div className="flex flex-col gap-4 text-sm mt-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--info-bg)] text-[var(--info)] flex items-center justify-center shrink-0"><Phone size={18}/></div>
                  <div>
                    <div className="text-[var(--foreground-muted)] text-xs uppercase tracking-wide">Primary Phone</div>
                    <div className="font-semibold text-[var(--foreground)] text-base">{school.schoolPhone || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-[var(--border-strong)] text-[var(--foreground-muted)] flex items-center justify-center shrink-0"><Phone size={18}/></div>
                  <div>
                    <div className="text-[var(--foreground-muted)] text-xs uppercase tracking-wide">Alternate Phone</div>
                    <div className="font-semibold text-[var(--foreground)] text-base">{school.alternatePhone || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0"><Mail size={18}/></div>
                  <div className="min-w-0">
                    <div className="text-[var(--foreground-muted)] text-xs uppercase tracking-wide">Email Address</div>
                    <div className="font-semibold text-[var(--foreground)] text-base truncate">{school.schoolEmail || 'N/A'}</div>
                  </div>
                </div>
             </div>
          </div>

          <div className="erp-card md:col-span-2 flex flex-col gap-4">
             <h2 className="text-lg font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">Physical Location</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mt-1">
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 text-xs uppercase tracking-wide">Country</div>
                  <div className="font-semibold text-[var(--foreground)] text-base">{school.address?.country || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 text-xs uppercase tracking-wide">Province</div>
                  <div className="font-semibold text-[var(--foreground)] text-base">{school.address?.province || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 text-xs uppercase tracking-wide">District</div>
                  <div className="font-semibold text-[var(--foreground)] text-base">{school.address?.district || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[var(--foreground-muted)] mb-1 text-xs uppercase tracking-wide">Full Address</div>
                  <div className="font-semibold text-[var(--foreground)] text-base">
                    <div className="flex items-start gap-1">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--primary)]"/>
                      <span>{school.address?.fullAddress || 'N/A'}</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
