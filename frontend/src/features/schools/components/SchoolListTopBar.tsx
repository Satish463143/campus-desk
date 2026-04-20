import React from 'react'
import { Search, Plus } from 'lucide-react'

interface SchoolListTopBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  onAddSchool: () => void
}

export const SchoolListTopBar: React.FC<SchoolListTopBarProps> = ({
  searchQuery,
  setSearchQuery,
  onAddSchool
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-[var(--card-bg)] p-4 rounded-[var(--card-radius)] shadow-[var(--shadow-sm)] border border-[var(--card-border)] mb-2 gap-4">
      <div className="relative w-full sm:w-96 text-[var(--foreground)]">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-[var(--foreground-muted)]" />
        </div>
        <input
          type="text"
          className="erp-input pl-10 h-10 w-full"
          placeholder="Search by school name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-auto">
        <button onClick={onAddSchool} className="btn-primary w-full flex items-center justify-center gap-2 px-5 py-2">
          <Plus size={18} />
          <span>Add School</span>
        </button>
      </div>
    </div>
  )
}
