'use client'
import React, { useState, useCallback } from 'react'
import ReactSelect, { SingleValue, StylesConfig } from 'react-select'
import { useListTeachersQuery } from '@/src/store/api/teacherApi'

interface Option { value: string; label: string; sub?: string }

interface TeacherSelectProps {
  value: string                    // current teacher ID
  onChange: (id: string) => void   // called with teacher profile ID
  placeholder?: string
  isClearable?: boolean
  classNamePrefix?: string
}

/**
 * Searchable teacher dropdown backed by the listTeachers API.
 * - Shows teacher name + designation/email as sub-label
 * - Supports typing to search by name or email (server-side)
 * - Uses the project design tokens via inline styles so it matches erp-input
 */
export default function TeacherSelect({
  value,
  onChange,
  placeholder = 'Search teacher…',
  isClearable = true,
}: TeacherSelectProps) {
  const [search, setSearch] = useState('')

  const { data, isFetching } = useListTeachersQuery({
    limit: 30,
    search: search || undefined,
  })

  const teachers: any[] = (() => {
    if (!data) return []
    const r = data.result ?? data.data ?? data
    return Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])
  })()

  const options: Option[] = teachers.map((t: any) => ({
    value: t.id,
    label: t.user?.name ?? 'Unknown',
    sub: t.designation ?? t.department ?? t.user?.email ?? '',
  }))

  // Resolve the selected option from the value prop
  const selectedOption = options.find(o => o.value === value) ?? (
    value ? { value, label: 'Loading…', sub: '' } : null
  )

  // Custom styles to match erp-input design tokens
  const styles: StylesConfig<Option, false> = {
    control: (base, state) => ({
      ...base,
      background: 'var(--input-bg, var(--surface-raised, #fff))',
      borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
      borderRadius: 'var(--radius-md, 8px)',
      boxShadow: state.isFocused ? '0 0 0 3px var(--primary-light)' : 'none',
      minHeight: '38px',
      fontSize: '14px',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      '&:hover': { borderColor: 'var(--primary)' },
    }),
    menu: (base) => ({
      ...base,
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md, 8px)',
      boxShadow: 'var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.12))',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected
        ? 'var(--primary)'
        : state.isFocused
        ? 'var(--primary-light)'
        : 'transparent',
      color: state.isSelected ? '#fff' : 'var(--foreground)',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (base) => ({ ...base, color: 'var(--foreground)' }),
    placeholder: (base) => ({ ...base, color: 'var(--foreground-muted)' }),
    input: (base) => ({ ...base, color: 'var(--foreground)' }),
    clearIndicator: (base) => ({ ...base, color: 'var(--foreground-muted)', cursor: 'pointer' }),
    dropdownIndicator: (base) => ({ ...base, color: 'var(--foreground-muted)' }),
    indicatorSeparator: (base) => ({ ...base, background: 'var(--border)' }),
    noOptionsMessage: (base) => ({ ...base, color: 'var(--foreground-muted)', fontSize: '13px' }),
    loadingMessage: (base) => ({ ...base, color: 'var(--foreground-muted)', fontSize: '13px' }),
  }

  return (
    <ReactSelect<Option, false>
      options={options}
      value={selectedOption ?? null}
      onChange={(opt: SingleValue<Option>) => onChange(opt?.value ?? '')}
      onInputChange={setSearch}
      inputValue={search}
      filterOption={() => true}           // disable client-side filtering — server handles it
      isLoading={isFetching}
      isClearable={isClearable}
      placeholder={placeholder}
      noOptionsMessage={() => search ? 'No teachers found' : 'Start typing to search…'}
      loadingMessage={() => 'Searching…'}
      styles={styles}
      // Custom option to show name + sub-label
      formatOptionLabel={(opt: Option) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">{opt.label}</span>
          {opt.sub && <span className="text-xs opacity-60">{opt.sub}</span>}
        </div>
      )}
    />
  )
}
