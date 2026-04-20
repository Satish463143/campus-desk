'use client'
import React, { useState } from 'react'
import { Search, AlertCircle, Users } from 'lucide-react'
import { useListFeeRecordsQuery } from '@/src/store/api/feeApi'

interface UncollectedProps { schoolId: string }

export default function Uncollected({ schoolId }: UncollectedProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useListFeeRecordsQuery({ status: 'PENDING', page, limit: 20 })
  const records = data?.result ?? []
  const total = data?.meta?.total ?? 0

  const filtered = search
    ? records.filter((r: any) => r.student?.user?.name?.toLowerCase().includes(search.toLowerCase()))
    : records

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[var(--warning-dark)] bg-[var(--warning-bg)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium">
        <Users size={15} />
        <span>{total} student(s) have uncollected (pending) fees</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input className="erp-input pl-8" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-[var(--foreground-muted)]">
          <AlertCircle size={32} opacity={0.4} />
          <p className="text-sm">No uncollected fees found.</p>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2 pr-4">Student</th>
                <th className="pb-2 pr-4">Fee</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Due Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-[var(--surface-raised)]">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-[var(--foreground)]">{r.student?.user?.name ?? '—'}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{r.student?.admissionNumber ?? ''}</div>
                  </td>
                  <td className="py-3 pr-4 text-[var(--foreground)]">{r.feeStructure?.feeCategory?.name ?? '—'}</td>
                  <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">Rs. {Number(r.amount).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-[var(--foreground-muted)]">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="py-3">
                    <span className="badge-pending px-2 py-0.5 rounded-full text-xs font-semibold">PENDING</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)]">
          <span>Page {page} — {total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Prev</button>
            <button disabled={records.length < 20} onClick={() => setPage(p => p + 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
