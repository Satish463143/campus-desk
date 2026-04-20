import React, { useState, useEffect } from 'react'
import { useListSchoolsQuery } from '@/src/store/api/schoolApi'
import { SchoolListTopBar } from './components/SchoolListTopBar'
import { SchoolTable } from './components/SchoolTable'
import { SchoolDetails } from './SchoolDetails'
import { SchoolForm } from './components/SchoolForm'

export const SchoolList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const { data, isLoading } = useListSchoolsQuery({
    search: debouncedSearch,
    limit: 20,
    page: 1
  })
  console.log('school list data',data)

  const handleAddSchool = () => {
    setShowAddForm(true)
  }

  return (
    <div className="relative w-full min-h-full animate-fade-in flex flex-col gap-5">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Schools Directory</h1>
        <p className="text-[var(--foreground-secondary)] text-sm">
          Manage registered schools, update active status, and oversee principal accounts.
        </p>
      </div>

      <SchoolListTopBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onAddSchool={handleAddSchool}
      />

      <SchoolTable 
        schools={data?.result || []} 
        isLoading={isLoading} 
        onSchoolClick={(id: string) => setSelectedSchoolId(id)}
      />

      {selectedSchoolId && (
         <SchoolDetails schoolId={selectedSchoolId} onClose={() => setSelectedSchoolId(null)} />
      )}

      {showAddForm && (
         <SchoolForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  )
}
