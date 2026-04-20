'use client'
import React, { useState } from 'react'
import { Search, AlertCircle, CreditCard, Download, Eye, X, Wifi, Banknote } from 'lucide-react'
import {
  useListManualPaymentsQuery,
  useGetPaymentHistoryQuery,
  useGetManualPaymentByIdQuery,
  useGetPaymentByIdQuery,
} from '@/src/store/api/paymentApi'

interface PaymentsProps { schoolId: string }

const METHOD_COLORS: Record<string, string> = {
  cash:          'bg-[var(--success-bg)] text-[var(--success-text)]',
  cheque:        'bg-[var(--gray-100)] text-[var(--gray-600)]',
  bank_transfer: 'bg-[var(--primary-50)] text-[var(--primary)]',
  fone_pay:      'bg-[var(--info-bg)] text-[var(--info-text)]',
  esewa:         'bg-green-100 text-green-700',
  khalti:        'bg-purple-100 text-purple-700',
  ime_pay:       'bg-blue-100 text-blue-700',
  card:          'bg-[var(--primary-100)] text-[var(--primary-600)]',
}

// ── Detail modal ───────────────────────────────────
function ManualDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useGetManualPaymentByIdQuery(id)
  const p = data?.result
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2"><Banknote size={18} className="text-[var(--primary)]"/>Manual Payment</h3>
          <button onClick={onClose}><X size={18} className="text-[var(--foreground-muted)]"/></button>
        </div>
        {isLoading ? <div className="flex justify-center py-6"><div className="w-7 h-7 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"/></div>
        : !p ? <div className="text-center text-[var(--foreground-muted)] py-4">Not found.</div>
        : (
          <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
            {[
              ['Student', p.student?.user?.name ?? '—'],
              ['Admission #', p.student?.admissionNumber ?? '—'],
              ['Amount', `Rs. ${Number(p.amount ?? 0).toLocaleString()}`],
              ['Method', p.paymentMethod?.replace(/_/g,' ').toUpperCase() ?? '—'],
              ['Reference', p.referenceNumber ?? '—'],
              ['Received By', p.depositedBy ?? '—'],
              ['Date', p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'],
              ['Note', p.note ?? '—'],
              ['Status', p.status ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-sm gap-3">
                <span className="text-[var(--foreground-muted)] font-medium shrink-0">{k}</span>
                <span className="text-[var(--foreground)] text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-ghost w-full">Close</button>
      </div>
    </div>
  )
}

function OnlineDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useGetPaymentByIdQuery(id)
  const p = data?.result
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2"><Wifi size={18} className="text-[var(--primary)]"/>Online Payment</h3>
          <button onClick={onClose}><X size={18} className="text-[var(--foreground-muted)]"/></button>
        </div>
        {isLoading ? <div className="flex justify-center py-6"><div className="w-7 h-7 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"/></div>
        : !p ? <div className="text-center text-[var(--foreground-muted)] py-4">Not found.</div>
        : (
          <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
            {[
              ['Student', p.student?.user?.name ?? '—'],
              ['Amount', `Rs. ${Number(p.totalAmount ?? 0).toLocaleString()}`],
              ['Method', p.paymentMethod?.replace(/_/g,' ').toUpperCase() ?? '—'],
              ['Transaction ID', p.transactionId ?? '—'],
              ['Status', p.status ?? '—'],
              ['Date', p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-sm gap-3">
                <span className="text-[var(--foreground-muted)] font-medium shrink-0">{k}</span>
                <span className="text-[var(--foreground)] text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-ghost w-full">Close</button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────
export default function Payments({ schoolId }: PaymentsProps) {
  const [tab, setTab] = useState<'manual' | 'online' | 'all'>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detailId, setDetailId] = useState<{ id: string; type: 'manual' | 'online' } | null>(null)

  const { data: manualData, isLoading: manualLoading } = useListManualPaymentsQuery({ page, limit: 50, from: from || undefined, to: to || undefined })
  const { data: onlineData, isLoading: onlineLoading } = useGetPaymentHistoryQuery({ page, limit: 50, from: from || undefined, to: to || undefined })

  const manualPayments = (manualData?.result ?? []).map((p: any) => ({ ...p, _type: 'manual', _amount: Number(p.amount ?? 0) }))
  const onlinePayments = (onlineData?.result ?? []).map((p: any) => ({ ...p, _type: 'online', _amount: Number(p.totalAmount ?? 0) }))

  const all = tab === 'manual' ? manualPayments : tab === 'online' ? onlinePayments : [...manualPayments, ...onlinePayments].sort((a, b) => new Date(b.createdAt ?? b.paymentDate).getTime() - new Date(a.createdAt ?? a.paymentDate).getTime())

  const filtered = search ? all.filter((p: any) => p.student?.user?.name?.toLowerCase().includes(search.toLowerCase())) : all
  const isLoading = manualLoading || onlineLoading

  const totalCollected = filtered.reduce((s: number, p: any) => s + p._amount, 0)
  const manualTotal = manualPayments.reduce((s: number, p: any) => s + p._amount, 0)
  const onlineTotal = onlinePayments.reduce((s: number, p: any) => s + p._amount, 0)

  return (
    <div className="p-5 flex flex-col gap-4">
      {detailId?.type === 'manual' && <ManualDetail id={detailId.id} onClose={() => setDetailId(null)} />}
      {detailId?.type === 'online' && <OnlineDetail id={detailId.id} onClose={() => setDetailId(null)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="erp-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center shrink-0"><CreditCard size={18}/></div>
          <div>
            <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">Total Collected</div>
            <div className="text-xl font-bold text-[var(--foreground)]">Rs. {totalCollected.toLocaleString()}</div>
          </div>
        </div>
        <div className="erp-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--info-bg)] text-[var(--info)] flex items-center justify-center shrink-0"><Banknote size={18}/></div>
          <div>
            <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">Manual / Cash</div>
            <div className="text-xl font-bold text-[var(--foreground)]">Rs. {manualTotal.toLocaleString()}</div>
          </div>
        </div>
        <div className="erp-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--secondary-light)] text-[var(--secondary)] flex items-center justify-center shrink-0"><Wifi size={18}/></div>
          <div>
            <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">Online</div>
            <div className="text-xl font-bold text-[var(--foreground)]">Rs. {onlineTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sub-tabs */}
        <div className="flex bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-0.5 border border-[var(--border)]">
          {(['all', 'manual', 'online'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"/>
          <input className="erp-input pl-8" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <input type="date" className="erp-input w-auto" value={from} onChange={e => setFrom(e.target.value)}/>
        <input type="date" className="erp-input w-auto" value={to} onChange={e => setTo(e.target.value)}/>
        <button className="btn-ghost flex items-center gap-1.5 text-sm"><Download size={14}/>Export</button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-[var(--foreground-muted)]">
          <AlertCircle size={32} opacity={0.4}/>
          <p className="text-sm">No payment records found.</p>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Student</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4">Ref / Txn ID</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((p: any) => {
                const isManual = p._type === 'manual'
                const date = isManual ? p.paymentDate : p.createdAt
                return (
                  <tr key={p.id + p._type} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${isManual ? 'bg-[var(--info-bg)] text-[var(--info-text)]' : 'bg-[var(--secondary-light)] text-[var(--secondary)]'}`}>
                        {isManual ? <Banknote size={10}/> : <Wifi size={10}/>}
                        {isManual ? 'Manual' : 'Online'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="font-semibold text-[var(--foreground)]">{p.student?.user?.name ?? '—'}</div>
                      <div className="text-xs text-[var(--foreground-muted)]">{p.student?.admissionNumber ?? ''}</div>
                    </td>
                    <td className="py-2.5 pr-4 font-bold text-[var(--success)]">Rs. {p._amount.toLocaleString()}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.paymentMethod] ?? 'badge-pending'}`}>
                        {p.paymentMethod?.replace(/_/g,' ').toUpperCase() ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[var(--foreground-muted)]">{p.referenceNumber ?? p.transactionId ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-[var(--foreground-muted)]">{date ? new Date(date).toLocaleDateString() : '—'}</td>
                    <td className="py-2.5">
                      <button onClick={() => setDetailId({ id: p.id, type: p._type })} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors">
                        <Eye size={11}/>View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-[var(--foreground-muted)] text-right">{filtered.length} record(s)</div>
    </div>
  )
}
