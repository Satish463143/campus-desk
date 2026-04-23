'use client'
import React, { useState } from 'react'
import {
  CreditCard, Search, Eye, Download,
   X, Calendar, User, FileText,
  Receipt, CheckCircle, TrendingUp, Clock,
   Hash, MessageSquare, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  useRecordManualPaymentMutation,
  useListManualPaymentsQuery,
  useGetManualPaymentByIdQuery,
  useGetStudentFeeSummaryQuery,
} from '@/src/store/api/paymentApi'
import { useListStudentsQuery } from '@/src/store/api/studentApi'
import Swal from 'sweetalert2'

// ── Constants ──────────────────────────────────────────────────────────────
const METHODS = [
  { value: 'cash',          label: 'Cash',          icon: '💵' },
  { value: 'cheque',        label: 'Cheque',         icon: '📄' },
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: '🏦' },
  { value: 'esewa',         label: 'eSewa',          icon: '💚' },
  { value: 'khalti',        label: 'Khalti',         icon: '💜' },
  { value: 'ime_pay',       label: 'IME Pay',        icon: '📱' },
]

const METHOD_STYLE: Record<string, string> = {
  cash:          'bg-emerald-100 text-emerald-700',
  cheque:        'bg-slate-100 text-slate-700',
  bank_transfer: 'bg-blue-100 text-blue-700',
  esewa:         'bg-green-100 text-green-700',
  khalti:        'bg-purple-100 text-purple-700',
  ime_pay:       'bg-orange-100 text-orange-700',
}

// ── Student Fee Summary ────────────────────────────────────────────────────
function FeeSummaryStrip({ studentId }: { studentId: string }) {
  const { data, isLoading } = useGetStudentFeeSummaryQuery(studentId, { skip: !studentId })
  const s = data?.result

  if (isLoading) return (
    <div className="flex gap-2 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex-1 h-14 rounded-lg bg-[var(--border)]" />
      ))}
    </div>
  )
  if (!s) return null

  const due    = Number(s.totalDue    ?? 0)
  const paid   = Number(s.totalPaid   ?? 0)
  const overdue = Number(s.totalOverdue ?? 0)
  const paidPct = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
        <div className="px-3 py-2.5 bg-[var(--danger-bg)]">
          <div className="text-xs text-[var(--danger)] font-semibold">Total Due</div>
          <div className="font-bold text-[var(--danger)] text-base">Rs. {due.toLocaleString()}</div>
        </div>
        <div className="px-3 py-2.5 bg-emerald-50">
          <div className="text-xs text-emerald-600 font-semibold">Collected</div>
          <div className="font-bold text-emerald-700 text-base">Rs. {paid.toLocaleString()}</div>
        </div>
        <div className="px-3 py-2.5 bg-amber-50">
          <div className="text-xs text-amber-600 font-semibold">Overdue</div>
          <div className="font-bold text-amber-700 text-base">Rs. {overdue.toLocaleString()}</div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="px-3 py-2 bg-[var(--surface-raised)] flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
        </div>
        <span className="text-xs font-semibold text-[var(--foreground-muted)] shrink-0">{paidPct}% paid</span>
      </div>
    </div>
  )
}

// ── Record Payment Form ────────────────────────────────────────────────────
function RecordForm({ onSuccess }: { onSuccess: () => void }) {
  const [recordPayment, { isLoading }] = useRecordManualPaymentMutation()
  const { data: studentsData } = useListStudentsQuery({ limit: 500 })
  const students: any[] = studentsData?.result ?? []

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: today,
    note: '',
    depositedBy: '',
    referenceNumber: '',
  })

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const selectedStudent = students.find((s: any) => s.id === form.studentId)
  const profileId = (selectedStudent as any)?.studentProfile?.id ?? form.studentId

  const swalTheme = { background: 'var(--card-bg)', color: 'var(--foreground)' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentId || !form.amount) {
      Swal.fire({ ...swalTheme, icon: 'warning', title: 'Missing fields', text: 'Please select a student and enter the amount.' })
      return
    }

    // Confirm before recording
    const method = METHODS.find(m => m.value === form.paymentMethod)
    const confirm = await Swal.fire({
      ...swalTheme,
      title: 'Record this payment?',
      html: `
        <div style="font-size:14px; text-align:left; color:var(--foreground-muted); display:flex; flex-direction:column; gap:6px;">
          <div><b>Student:</b> ${selectedStudent?.name ?? '—'}</div>
          <div><b>Amount:</b> Rs. ${Number(form.amount).toLocaleString()}</div>
          <div><b>Method:</b> ${method?.icon} ${method?.label}</div>
          <div><b>Date:</b> ${form.paymentDate}</div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Record',
      confirmButtonColor: 'var(--primary)',
    })
    if (!confirm.isConfirmed) return

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

      await Swal.fire({
        ...swalTheme,
        icon: 'success',
        title: 'Payment Recorded!',
        html: `<span style="color:var(--foreground-muted);font-size:14px;">Rs. ${Number(form.amount).toLocaleString()} recorded for <b>${selectedStudent?.name}</b></span>`,
        timer: 2500,
        showConfirmButton: false,
      })

      setForm({ studentId: '', amount: '', paymentMethod: 'cash', paymentDate: today, note: '', depositedBy: '', referenceNumber: '' })
      onSuccess()
    } catch (err: any) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Failed to record', text: err?.data?.message ?? 'Something went wrong.' })
    }
  }

  const selectedMethod = METHODS.find(m => m.value === form.paymentMethod)
  const needsRef = ['cheque', 'bank_transfer', 'esewa', 'khalti', 'ime_pay'].includes(form.paymentMethod)

  return (
    <div className="erp-card">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
          <Receipt size={16} />
        </div>
        <div>
          <h2 className="font-bold text-[var(--foreground)]">Record Manual Payment</h2>
          <p className="text-xs text-[var(--foreground-muted)]">Log an offline or cash fee payment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* STEP 1 — Student */}
        <div>
          <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] mr-1.5">1</span>
            Select Student *
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <select
              required
              className="erp-input pl-9"
              value={form.studentId}
              onChange={e => set('studentId', e.target.value)}
            >
              <option value="">— Choose a student —</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.studentProfile?.admissionNumber ? ` · ${s.studentProfile.admissionNumber}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fee summary after student is chosen */}
          {form.studentId && (
            <div className="mt-3">
              <FeeSummaryStrip studentId={profileId} />
            </div>
          )}
        </div>

        {/* STEP 2 — Payment Method (pill selector) */}
        <div>
          <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] mr-1.5">2</span>
            Payment Method *
          </label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map(m => {
              const active = form.paymentMethod === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set('paymentMethod', m.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm'
                      : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* STEP 3 — Amount + Date */}
        <div>
          <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] mr-1.5">3</span>
            Payment Details *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--foreground-muted)]">Rs.</div>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                className="erp-input pl-10 text-lg font-bold"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="date"
                className="erp-input pl-9"
                value={form.paymentDate}
                onChange={e => set('paymentDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* STEP 4 — Optional details — collapsible-like row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Reference — shown for non-cash */}
          <div className={needsRef ? '' : 'opacity-70'}>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
              <Hash size={11} className="inline mr-1" />
              Reference Number {needsRef ? '*' : '(optional)'}
            </label>
            <input
              type="text"
              className="erp-input"
              placeholder={`${selectedMethod?.label ?? 'Txn'} ref / cheque no.`}
              value={form.referenceNumber}
              onChange={e => set('referenceNumber', e.target.value)}
            />
          </div>

          {/* Received by */}
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
              <User size={11} className="inline mr-1" />
              Received By (optional)
            </label>
            <input
              type="text"
              className="erp-input"
              placeholder="Staff / cashier name"
              value={form.depositedBy}
              onChange={e => set('depositedBy', e.target.value)}
            />
          </div>

          {/* Note — full width */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
              <MessageSquare size={11} className="inline mr-1" />
              Note (optional)
            </label>
            <textarea
              rows={2}
              className="erp-input resize-none"
              placeholder="Any remarks or additional info…"
              value={form.note}
              onChange={e => set('note', e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Recording…</>
            ) : (
              <><CheckCircle size={16} />Record Payment</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Payment Detail Modal ───────────────────────────────────────────────────
function PaymentDetail({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const { data, isLoading } = useGetManualPaymentByIdQuery(paymentId)
  const p = data?.result
  const method = p ? METHODS.find(m => m.value === p.paymentMethod) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-sm mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
            <FileText size={16} className="text-[var(--primary)]" /> Payment Receipt
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)]">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          ) : !p ? (
            <div className="text-center text-[var(--foreground-muted)] py-6">No details found.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Amount hero */}
              <div className="text-center py-4 mb-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700">Rs. {Number(p.amount).toLocaleString()}</div>
                <div className="text-xs text-emerald-600 mt-0.5">
                  {method?.icon} {method?.label ?? p.paymentMethod?.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>

              {/* Details grid */}
              {[
                { label: 'Student', value: p.student?.user?.name ?? '—', icon: User },
                { label: 'Date', value: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: Calendar },
                { label: 'Reference', value: p.referenceNumber ?? '—', icon: Hash },
                { label: 'Received By', value: p.depositedBy ?? '—', icon: User },
                { label: 'Note', value: p.note ?? '—', icon: MessageSquare },
                { label: 'Status', value: p.status ?? '—', icon: CheckCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] font-medium shrink-0">
                    <Icon size={11} />{label}
                  </div>
                  <div className="text-sm text-[var(--foreground)] text-right font-medium">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-4">
          <button onClick={onClose} className="btn-ghost w-full">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Payment History ────────────────────────────────────────────────────────
function PaymentHistory() {
  const [page, setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useListManualPaymentsQuery({
    page, limit: 15,
    from: from || undefined,
    to: to || undefined,
  })
  const payments: any[] = data?.result ?? []
  const total = data?.meta?.total ?? 0
  const pages = Math.ceil(total / 15)

  // Client-side filter by name + method
  const filtered = payments
    .filter(p => !search || p.student?.user?.name?.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !methodFilter || p.paymentMethod === methodFilter)

  const totalCollected = filtered.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

  return (
    <div className="erp-card flex flex-col gap-4">
      {viewId && <PaymentDetail paymentId={viewId} onClose={() => setViewId(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <TrendingUp size={15} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--foreground)]">Payment History</h2>
            <p className="text-xs text-[var(--foreground-muted)]">{total} record{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--foreground-muted)]">Showing total</div>
          <div className="font-bold text-emerald-600">Rs. {totalCollected.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            className="erp-input pl-9 text-sm"
            placeholder="Search student name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Method filter */}
        <select
          className="erp-input w-auto text-sm"
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
        >
          <option value="">All Methods</option>
          {METHODS.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input type="date" className="erp-input pl-8 text-sm w-auto" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <span className="text-[var(--foreground-muted)] text-xs px-1">to</span>
          <input type="date" className="erp-input text-sm w-auto" value={to} onChange={e => setTo(e.target.value)} />
        </div>

        {/* Clear filters */}
        {(search || methodFilter || from || to) && (
          <button
            onClick={() => { setSearch(''); setMethodFilter(''); setFrom(''); setTo('') }}
            className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg px-2 py-1.5"
          >
            <X size={11} /> Clear
          </button>
        )}

        <button className="btn-ghost flex items-center gap-1.5 text-sm ml-auto">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-[var(--foreground-muted)]">
          <Clock size={32} opacity={0.3} />
          <p className="text-sm">No payment records found.</p>
          {(search || methodFilter || from || to) && (
            <p className="text-xs">Try removing some filters.</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '580px' }}>
              <thead>
                <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                  <th className="pb-2.5 pr-4">Student</th>
                  <th className="pb-2.5 pr-4">Amount</th>
                  <th className="pb-2.5 pr-4">Method</th>
                  <th className="pb-2.5 pr-4">Reference</th>
                  <th className="pb-2.5 pr-4">Date</th>
                  <th className="pb-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((p: any) => {
                  const method = METHODS.find(m => m.value === p.paymentMethod)
                  return (
                    <tr key={p.id} className={`hover:bg-[var(--surface-raised)] transition-colors ${isFetching ? 'opacity-60' : ''}`}>
                      {/* Student */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0">
                            {(p.student?.user?.name ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--foreground)] text-xs">{p.student?.user?.name ?? '—'}</div>
                            <div className="text-xs text-[var(--foreground-muted)]">{p.student?.admissionNumber ?? ''}</div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 pr-4">
                        <span className="font-bold text-emerald-600">Rs. {Number(p.amount).toLocaleString()}</span>
                      </td>

                      {/* Method */}
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_STYLE[p.paymentMethod] ?? 'bg-[var(--surface-raised)] text-[var(--foreground)]'}`}>
                          {method?.icon} {method?.label ?? p.paymentMethod?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="py-3 pr-4 font-mono text-xs text-[var(--foreground-muted)]">
                        {p.referenceNumber ?? <span className="opacity-40">—</span>}
                      </td>

                      {/* Date */}
                      <td className="py-3 pr-4 text-xs text-[var(--foreground-muted)]">
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'
                        }
                      </td>

                      {/* View */}
                      <td className="py-3">
                        <button
                          onClick={() => setViewId(p.id)}
                          className="flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors font-medium"
                        >
                          <Eye size={11} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--foreground-muted)]">
                Page {page} of {pages} · {total} records
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const p = i + Math.max(1, page - 2)
                  if (p > pages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        p === page
                          ? 'bg-[var(--primary)] text-white'
                          : 'border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ManualPayment({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="p-5 flex flex-col gap-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
          <CreditCard size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Manual Payments</h1>
          <p className="text-sm text-[var(--foreground-muted)]">Record offline payments and track collection history</p>
        </div>
      </div>

      <RecordForm onSuccess={() => setRefresh(r => r + 1)} />
      <PaymentHistory key={refresh} />
    </div>
  )
}
