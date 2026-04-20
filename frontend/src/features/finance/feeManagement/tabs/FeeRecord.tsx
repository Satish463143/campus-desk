'use client'
import React, { useState } from 'react'
import { Search, Download, Plus, ChevronDown, ChevronUp, Award, DollarSign, FileText, CreditCard, X, Check, AlertCircle } from 'lucide-react'
import { useListStudentsQuery } from '@/src/store/api/studentApi'
import {
  useAssignStudentFeeMutation,
  useUpsertScholarshipMutation,
  useRecordFeePaymentMutation,
  useGetStudentFeesQuery,
  useGetFeeCategoriesQuery,
  useGetFeeStructuresQuery,
} from '@/src/store/api/feeApi'
import { useGenerateInvoiceForStudentMutation } from '@/src/store/api/invoiceApi'

interface Student {
  id: string
  name: string
  email: string
  studentProfile?: {
    id: string
    admissionNumber?: string
    academicStatus?: string
  }
}

interface FeeRecordProps { schoolId: string }

// ── Small status badge ─────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'badge-paid', PAID: 'badge-paid',
    pending: 'badge-pending', PENDING: 'badge-pending',
    overdue: 'badge-overdue', OVERDUE: 'badge-overdue',
    partial: 'badge-pending', PARTIAL: 'badge-pending',
    waived: 'bg-[var(--gray-100)] text-[var(--gray-600)]', WAIVED: 'bg-[var(--gray-100)] text-[var(--gray-600)]',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'badge-pending'}`}>
      {status}
    </span>
  )
}

// ── Assign Fee Modal ───────────────────────────────
function AssignFeeModal({ studentId, studentName, onClose }: { studentId: string; studentName: string; onClose: () => void }) {
  const { data: structuresData } = useGetFeeStructuresQuery({})
  const [assignFee, { isLoading }] = useAssignStudentFeeMutation()
  const [form, setForm] = useState({ feeStructureId: '', dueDate: '', amount: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const structures = structuresData?.result ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await assignFee({ studentId, feeStructureId: form.feeStructureId, dueDate: form.dueDate, amount: form.amount ? Number(form.amount) : undefined }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 1000)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to assign fee')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)]">Assign Fee — {studentName}</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
        </div>
        {success ? (
          <div className="flex items-center gap-2 text-[var(--success)] py-4 justify-center"><Check size={20} /> Fee assigned successfully!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Fee Structure</label>
              <select required className="erp-input" value={form.feeStructureId} onChange={e => setForm(f => ({ ...f, feeStructureId: e.target.value }))}>
                <option value="">Select structure...</option>
                {structures.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.feeCategory?.name ?? s.id} — Rs. {s.amount} ({s.frequency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Due Date</label>
              <input required type="date" className="erp-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Override Amount (optional)</label>
              <input type="number" min="0" step="0.01" className="erp-input" placeholder="Leave blank to use structure amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            {error && <div className="flex items-center gap-2 text-[var(--danger)] text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Assigning...' : 'Assign Fee'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Scholarship Modal ──────────────────────────────
function ScholarshipModal({ studentId, studentName, onClose }: { studentId: string; studentName: string; onClose: () => void }) {
  const [upsert, { isLoading }] = useUpsertScholarshipMutation()
  const [form, setForm] = useState({ type: 'percentage', value: '', startDate: '', endDate: '', reason: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await upsert({ studentId, type: form.type, value: Number(form.value), startDate: form.startDate, endDate: form.endDate, reason: form.reason }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 1000)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to set scholarship')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)]">Scholarship — {studentName}</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
        </div>
        {success ? (
          <div className="flex items-center gap-2 text-[var(--success)] py-4 justify-center"><Check size={20} /> Scholarship saved!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Discount Type</label>
              <select className="erp-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Value ({form.type === 'percentage' ? '%' : 'Rs.'})</label>
              <input required type="number" min="0" max={form.type === 'percentage' ? 100 : undefined} step="0.01" className="erp-input" placeholder={form.type === 'percentage' ? '0–100' : 'Amount'} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Start Date</label>
                <input required type="date" className="erp-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">End Date</label>
                <input required type="date" className="erp-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Reason (optional)</label>
              <input type="text" className="erp-input" placeholder="Merit, need-based, etc." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            {error && <div className="flex items-center gap-2 text-[var(--danger)] text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Saving...' : 'Save Scholarship'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Record Payment Modal ───────────────────────────
function RecordPaymentModal({ studentId, studentName, onClose }: { studentId: string; studentName: string; onClose: () => void }) {
  const [record, { isLoading }] = useRecordFeePaymentMutation()
  const [form, setForm] = useState({ totalAmount: '', paymentMethod: 'cash', transactionId: '', receivedBy: '', note: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const methods = ['cash', 'fone_pay', 'check', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'card']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await record({ studentId, totalAmount: Number(form.totalAmount), paymentMethod: form.paymentMethod, transactionId: form.transactionId || undefined, receivedBy: form.receivedBy || undefined, note: form.note || undefined }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 1000)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to record payment')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)]">Record Payment — {studentName}</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
        </div>
        {success ? (
          <div className="flex items-center gap-2 text-[var(--success)] py-4 justify-center"><Check size={20} /> Payment recorded!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Amount (Rs.)</label>
              <input required type="number" min="1" step="0.01" className="erp-input" placeholder="0.00" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Payment Method</label>
              <select className="erp-input" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {methods.map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Transaction ID (optional)</label>
              <input type="text" className="erp-input" placeholder="Ref. / transaction number" value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Received By</label>
              <input type="text" className="erp-input" placeholder="Staff name" value={form.receivedBy} onChange={e => setForm(f => ({ ...f, receivedBy: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Note</label>
              <input type="text" className="erp-input" placeholder="Optional note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            {error && <div className="flex items-center gap-2 text-[var(--danger)] text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Recording...' : 'Record Payment'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Student Fee Row (expanded) ─────────────────────
function StudentFeeRow({ student }: { student: Student }) {
  const [expanded, setExpanded] = useState(false)
  const [modal, setModal] = useState<'assign' | 'scholarship' | 'payment' | 'invoice' | null>(null)
  const [genInvoice, { isLoading: invoiceLoading }] = useGenerateInvoiceForStudentMutation()
  const [invoiceMsg, setInvoiceMsg] = useState('')

  const profileId = student.studentProfile?.id
  const { data: feesData, isLoading: feesLoading } = useGetStudentFeesQuery(
    { studentId: profileId!, params: { limit: 20 } },
    { skip: !expanded || !profileId }
  )
  const fees = feesData?.result ?? []

  const handleGenerateInvoice = async () => {
    if (!profileId) return
    setInvoiceMsg('')
    try {
      await genInvoice({ studentProfileId: profileId }).unwrap()
      setInvoiceMsg('Invoice generated!')
      setTimeout(() => setInvoiceMsg(''), 2500)
    } catch (err: any) {
      setInvoiceMsg(err?.data?.message ?? 'Failed')
    }
  }

  return (
    <>
      {/* Modals */}
      {modal === 'assign'      && profileId && <AssignFeeModal studentId={profileId} studentName={student.name} onClose={() => setModal(null)} />}
      {modal === 'scholarship' && profileId && <ScholarshipModal studentId={profileId} studentName={student.name} onClose={() => setModal(null)} />}
      {modal === 'payment'     && profileId && <RecordPaymentModal studentId={profileId} studentName={student.name} onClose={() => setModal(null)} />}

      <div className="border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--card-bg)] overflow-hidden">
        {/* Row header */}
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--surface-raised)] transition-colors" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[var(--foreground)] text-sm truncate">{student.name}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{student.studentProfile?.admissionNumber ?? student.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <button onClick={e => { e.stopPropagation(); setModal('assign') }} className="hidden sm:flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors font-medium"><Plus size={12} />Assign Fee</button>
            <button onClick={e => { e.stopPropagation(); setModal('scholarship') }} className="hidden sm:flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--warning-bg)] text-[var(--warning-dark)] hover:bg-[var(--warning)] hover:text-white transition-colors font-medium"><Award size={12} />Scholarship</button>
            <button onClick={e => { e.stopPropagation(); setModal('payment') }} className="hidden sm:flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--success-bg)] text-[var(--success-dark)] hover:bg-[var(--success)] hover:text-white transition-colors font-medium"><CreditCard size={12} />Payment</button>
            <button onClick={e => { e.stopPropagation(); handleGenerateInvoice() }} disabled={invoiceLoading} className="hidden sm:flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--info-bg)] text-[var(--info-dark)] hover:bg-[var(--info)] hover:text-white transition-colors font-medium"><FileText size={12} />{invoiceLoading ? '...' : 'Invoice'}</button>
            {invoiceMsg && <span className="text-xs text-[var(--success)]">{invoiceMsg}</span>}
            {expanded ? <ChevronUp size={16} className="text-[var(--foreground-muted)]" /> : <ChevronDown size={16} className="text-[var(--foreground-muted)]" />}
          </div>
        </div>

        {/* Mobile actions */}
        <div className="flex sm:hidden gap-1 px-4 pb-2 flex-wrap">
          <button onClick={() => setModal('assign')} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--primary-light)] text-[var(--primary)] font-medium"><Plus size={11} />Assign</button>
          <button onClick={() => setModal('scholarship')} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--warning-bg)] text-[var(--warning-dark)] font-medium"><Award size={11} />Scholarship</button>
          <button onClick={() => setModal('payment')} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--success-bg)] text-[var(--success-dark)] font-medium"><CreditCard size={11} />Pay</button>
          <button onClick={handleGenerateInvoice} disabled={invoiceLoading} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--info-bg)] text-[var(--info-dark)] font-medium"><FileText size={11} />Invoice</button>
        </div>

        {/* Expanded fee list */}
        {expanded && (
          <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--surface-raised)] animate-fade-in">
            {feesLoading ? (
              <div className="text-sm text-[var(--foreground-muted)] py-2">Loading fees...</div>
            ) : fees.length === 0 ? (
              <div className="text-sm text-[var(--foreground-muted)] py-2 flex items-center gap-2"><AlertCircle size={14} /> No fees assigned yet. Click "Assign Fee" to get started.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
                    <th className="pb-2 pr-3">Fee</th>
                    <th className="pb-2 pr-3">Amount</th>
                    <th className="pb-2 pr-3">Due</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {fees.map((fee: any) => (
                    <tr key={fee.id} className="hover:bg-[var(--surface)]">
                      <td className="py-2 pr-3 font-medium text-[var(--foreground)]">{fee.feeStructure?.feeCategory?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-[var(--foreground)]">Rs. {Number(fee.amount).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-[var(--foreground-muted)]">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="py-2"><StatusBadge status={fee.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Class Group ────────────────────────────────────
function ClassGroup({ className, students }: { className: string; students: Student[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>{className}</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold">{students.length}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 pl-2 animate-fade-in">
          {students.map(s => <StudentFeeRow key={s.id} student={s} />)}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────
export default function FeeRecord({ schoolId }: FeeRecordProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useListStudentsQuery({ search, page, limit: 50 })
  const students: Student[] = data?.result ?? []
  const total = data?.meta?.total ?? 0

  // Group by class name (pulled from enrollment if available)
  const grouped = students.reduce<Record<string, Student[]>>((acc, s) => {
    const cls = (s as any).currentClass ?? 'Unassigned'
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(s)
    return acc
  }, {})

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            className="erp-input pl-8"
            placeholder="Search students..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="erp-input w-auto min-w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <button className="btn-ghost flex items-center gap-1.5 text-sm">
          <Download size={14} /> Export CSV
        </button>
        <span className="text-sm text-[var(--foreground-muted)]">{total} student(s)</span>
      </div>

      {/* Student list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[var(--foreground-muted)]">
          <div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /><span className="text-sm">Loading students...</span></div>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[var(--foreground-muted)]">
          <AlertCircle size={32} opacity={0.4} />
          <p className="text-sm">No students found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([cls, sts]) => (
            <ClassGroup key={cls} className={cls} students={sts} />
          ))}
        </div>
      )}
    </div>
  )
}
