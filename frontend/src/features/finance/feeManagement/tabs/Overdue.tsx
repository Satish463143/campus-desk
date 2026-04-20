'use client'
import React, { useState } from 'react'
import { AlertTriangle, Search, AlertCircle, Clock } from 'lucide-react'
import { useGetOverdueFeesQuery, useExtendFeeMutation } from '@/src/store/api/feeApi'

interface OverdueProps { schoolId: string }

function ExtendModal({ feeId, onClose }: { feeId: string; onClose: () => void }) {
  const [extend, { isLoading }] = useExtendFeeMutation()
  const [days, setDays] = useState('7')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await extend({ id: feeId, body: { days: Number(days) } }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 1000)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to extend')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2"><Clock size={18} className="text-[var(--warning)]" /> Extend Due Date</h3>
        {success ? (
          <div className="text-[var(--success)] py-2 text-center font-medium">Due date extended successfully!</div>
        ) : (
          <form onSubmit={handle} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Days to extend (1–90)</label>
              <input type="number" min="1" max="90" required className="erp-input" value={days} onChange={e => setDays(e.target.value)} />
            </div>
            {error && <div className="text-[var(--danger)] text-sm flex gap-1 items-center"><AlertCircle size={13}/>{error}</div>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Extending...' : 'Extend'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Overdue({ schoolId }: OverdueProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [extendId, setExtendId] = useState<string | null>(null)

  const { data, isLoading } = useGetOverdueFeesQuery({ page, limit: 20 })
  const raw = data?.result
  const fees: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
  const total = data?.meta?.total ?? raw?.total ?? 0

  const filtered = search
    ? fees.filter((f: any) => f.student?.user?.name?.toLowerCase().includes(search.toLowerCase()))
    : fees

  return (
    <div className="p-5 flex flex-col gap-4">
      {extendId && <ExtendModal feeId={extendId} onClose={() => setExtendId(null)} />}

      <div className="flex items-center gap-2 text-[var(--danger-text)] bg-[var(--danger-bg)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium">
        <AlertTriangle size={15} />
        <span>{total} overdue fee record(s) — immediate action required</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input className="erp-input pl-8" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--danger)] rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-[var(--foreground-muted)]">
          <AlertCircle size={32} opacity={0.4} />
          <p className="text-sm">No overdue fees. Great!</p>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2 pr-4">Student</th>
                <th className="pb-2 pr-4">Fee Type</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Due Date</th>
                <th className="pb-2 pr-4">Days Overdue</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((f: any) => {
                const daysOverdue = f.dueDate ? Math.floor((Date.now() - new Date(f.dueDate).getTime()) / 86400000) : 0
                return (
                  <tr key={f.id} className="hover:bg-[var(--surface-raised)]">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[var(--foreground)]">{f.student?.user?.name ?? '—'}</div>
                      <div className="text-xs text-[var(--foreground-muted)]">{f.student?.admissionNumber ?? ''}</div>
                    </td>
                    <td className="py-3 pr-4 text-[var(--foreground)]">{f.feeStructure?.feeCategory?.name ?? '—'}</td>
                    <td className="py-3 pr-4 font-semibold text-[var(--danger)]">Rs. {Number(f.amount).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-[var(--foreground-muted)]">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="badge-overdue px-2 py-0.5 rounded-full text-xs font-semibold">{daysOverdue}d overdue</span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => setExtendId(f.id)} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--warning-bg)] text-[var(--warning-dark)] hover:bg-[var(--warning)] hover:text-white transition-colors font-medium">
                        <Clock size={12} /> Extend
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)]">
          <span>Page {page} — {total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Prev</button>
            <button disabled={fees.length < 20} onClick={() => setPage(p => p + 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
