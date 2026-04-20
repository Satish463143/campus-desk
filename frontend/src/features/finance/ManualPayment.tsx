'use client'
import React, { useState } from 'react'
import {
  CreditCard, Search, Plus, Eye, Download, AlertCircle,
  Check, X, Calendar, User, FileText, ChevronDown
} from 'lucide-react'
import {
  useRecordManualPaymentMutation,
  useListManualPaymentsQuery,
  useGetManualPaymentByIdQuery,
  useGetStudentFeeSummaryQuery,
} from '@/src/store/api/paymentApi'
import { useListStudentsQuery } from '@/src/store/api/studentApi'

const METHODS = ['esewa', 'khalti']

const METHOD_COLORS: Record<string, string> = {
  esewa:         'badge-active',
  khalti:        'bg-[var(--warning-bg)] text-[var(--warning-dark)]',
}

// ── Student Fee Summary panel ──────────────────────
function StudentFeeSummary({ studentId }: { studentId: string }) {
  const { data, isLoading } = useGetStudentFeeSummaryQuery(studentId, { skip: !studentId })
  const summary = data?.result

  if (isLoading) return <div className="text-xs text-[var(--foreground-muted)] animate-pulse">Loading summary...</div>
  if (!summary) return null

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] p-3 flex flex-wrap gap-3 text-sm">
      <div className="flex flex-col">
        <span className="text-xs text-[var(--foreground-muted)]">Total Due</span>
        <span className="font-bold text-[var(--danger)]">Rs. {Number(summary.totalDue ?? 0).toLocaleString()}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-[var(--foreground-muted)]">Total Paid</span>
        <span className="font-bold text-[var(--success)]">Rs. {Number(summary.totalPaid ?? 0).toLocaleString()}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-[var(--foreground-muted)]">Overdue</span>
        <span className="font-bold text-[var(--warning)]">Rs. {Number(summary.totalOverdue ?? 0).toLocaleString()}</span>
      </div>
    </div>
  )
}

// ── Record Payment Form ────────────────────────────
function RecordForm({ onSuccess }: { onSuccess: () => void }) {
  const [recordPayment, { isLoading }] = useRecordManualPaymentMutation()
  const { data: studentsData } = useListStudentsQuery({ limit: 200 })
  const students = studentsData?.result ?? []

  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    note: '',
    depositedBy: '',
    referenceNumber: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Resolve to studentProfileId from the selected student
  const selectedStudent = students.find((s: any) => s.id === form.studentId)
  const profileId = (selectedStudent as any)?.studentProfile?.id ?? form.studentId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await recordPayment({
        studentId: profileId,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        paymentDate: form.paymentDate || undefined,
        note: form.note || undefined,
        depositedBy: form.depositedBy || undefined,
        referenceNumber: form.referenceNumber || undefined,
      }).unwrap()
      setSuccess(true)
      setForm(f => ({ ...f, studentId: '', amount: '', note: '', depositedBy: '', referenceNumber: '' }))
      setTimeout(() => { setSuccess(false); onSuccess() }, 1500)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to record payment')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="erp-card flex flex-col gap-4">
      <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Plus size={16} className="text-[var(--primary)]" /> Record Manual Payment
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Student */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Student</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <select
              required
              className="erp-input pl-8"
              value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
            >
              <option value="">Select student...</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} {s.studentProfile?.admissionNumber ? `— ${s.studentProfile.admissionNumber}` : ''}</option>
              ))}
            </select>
          </div>
          {form.studentId && <div className="mt-2"><StudentFeeSummary studentId={profileId} /></div>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Amount (Rs.)</label>
          <input
            required type="number" min="1" step="0.01"
            className="erp-input" placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Payment Method</label>
          <select className="erp-input" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
            {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Payment Date</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input type="date" className="erp-input pl-8" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
          </div>
        </div>

        {/* Reference */}
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Reference Number</label>
          <input type="text" className="erp-input" placeholder="Cheque / Txn ref." value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} />
        </div>

        {/* Deposited By */}
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Received By</label>
          <input type="text" className="erp-input" placeholder="Staff name" value={form.depositedBy} onChange={e => setForm(f => ({ ...f, depositedBy: e.target.value }))} />
        </div>

        {/* Note */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Note (optional)</label>
          <input type="text" className="erp-input" placeholder="Any additional note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[var(--danger)] text-sm bg-[var(--danger-bg)] px-3 py-2 rounded-[var(--radius-md)]">
          <AlertCircle size={14} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-[var(--success)] text-sm bg-[var(--success-bg)] px-3 py-2 rounded-[var(--radius-md)]">
          <Check size={14} /> Payment recorded successfully!
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          <CreditCard size={15} />{isLoading ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}

// ── Payment Detail Modal ───────────────────────────
function PaymentDetail({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const { data, isLoading } = useGetManualPaymentByIdQuery(paymentId)
  const payment = data?.result

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2"><FileText size={18} className="text-[var(--primary)]" />Payment Detail</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
        ) : !payment ? (
          <div className="text-center text-[var(--foreground-muted)] py-4">No details found.</div>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            {[
              ['Student', payment.student?.user?.name ?? '—'],
              ['Amount', `Rs. ${Number(payment.amount).toLocaleString()}`],
              ['Method', payment.paymentMethod?.replace(/_/g, ' ').toUpperCase()],
              ['Date', payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—'],
              ['Reference', payment.referenceNumber ?? '—'],
              ['Received By', payment.depositedBy ?? '—'],
              ['Note', payment.note ?? '—'],
              ['Status', payment.status ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--foreground-muted)] font-medium">{label}</span>
                <span className="text-[var(--foreground)] text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-ghost w-full mt-1">Close</button>
      </div>
    </div>
  )
}

// ── Payment History Table ──────────────────────────
function PaymentHistory({ refresh }: { refresh: number }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isLoading } = useListManualPaymentsQuery({ page, limit: 20, from: from || undefined, to: to || undefined })
  const payments = data?.result ?? []
  const total = data?.meta?.total ?? 0

  const filtered = search
    ? payments.filter((p: any) => p.student?.user?.name?.toLowerCase().includes(search.toLowerCase()))
    : payments

  const totalCollected = filtered.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

  return (
    <div className="flex flex-col gap-3">
      {viewId && <PaymentDetail paymentId={viewId} onClose={() => setViewId(null)} />}

      <div className="erp-card flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2"><FileText size={16} className="text-[var(--secondary)]" />Payment History</h2>
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            Total: <span className="font-bold text-[var(--success)]">Rs. {totalCollected.toLocaleString()}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="erp-input pl-8" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="erp-input w-auto" value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="erp-input w-auto" value={to} onChange={e => setTo(e.target.value)} />
          <button className="btn-ghost flex items-center gap-1.5 text-sm"><Download size={14} />Export</button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-[var(--foreground-muted)]">
            <AlertCircle size={28} opacity={0.4} />
            <p className="text-sm">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Method</th>
                  <th className="pb-2 pr-4">Reference</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[var(--foreground)]">{p.student?.user?.name ?? '—'}</div>
                      <div className="text-xs text-[var(--foreground-muted)]">{p.student?.admissionNumber ?? ''}</div>
                    </td>
                    <td className="py-3 pr-4 font-bold text-[var(--success)]">Rs. {Number(p.amount).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.paymentMethod] ?? 'badge-pending'}`}>
                        {p.paymentMethod?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--foreground-muted)]">{p.referenceNumber ?? '—'}</td>
                    <td className="py-3 pr-4 text-[var(--foreground-muted)]">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3">
                      <button onClick={() => setViewId(p.id)} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors font-medium">
                        <Eye size={11} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)] pt-2 border-t border-[var(--border)]">
            <span>Page {page} of {Math.ceil(total / 20)} — {total} total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Prev</button>
              <button disabled={payments.length < 20} onClick={() => setPage(p => p + 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Export ────────────────────────────────────
export default function ManualPayment({ schoolId, onClose }: { schoolId: string, onClose: () => void }) {
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="p-5 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
          <CreditCard size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Manual Payments</h1>
          <p className="text-sm text-[var(--foreground-muted)]">Record offline / cash payments and view history</p>
        </div>
      </div>

      <RecordForm onSuccess={() => setRefresh(r => r + 1)} />
      <PaymentHistory refresh={refresh} />
    </div>
  )
}
