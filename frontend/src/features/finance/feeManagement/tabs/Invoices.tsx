'use client'
import React, { useState } from 'react'
import { FileText, Check, AlertCircle, Send, Users } from 'lucide-react'
import { useListPendingInvoicesQuery, useApproveInvoiceMutation, useSendInvoiceMutation, useGenerateBulkInvoicesMutation } from '@/src/store/api/invoiceApi'

interface InvoicesProps { schoolId: string }

const STATUS_COLOR: Record<string, string> = {
  PENDING_REVIEW: 'badge-pending',
  APPROVED: 'badge-active',
  SENT: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  PAID: 'badge-paid',
  EXPIRED: 'badge-overdue',
}

export default function Invoices({ schoolId }: InvoicesProps) {
  const [page, setPage] = useState(1)
  const [bulkModal, setBulkModal] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Record<string, string>>({})

  const { data, isLoading, refetch } = useListPendingInvoicesQuery({ page, limit: 20 })
  const [approve] = useApproveInvoiceMutation()
  const [sendInv] = useSendInvoiceMutation()
  const [generateBulk, { isLoading: bulkLoading }] = useGenerateBulkInvoicesMutation()

  const raw = data?.result
  const invoices: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
  const total = data?.meta?.total ?? raw?.total ?? 0

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    try {
      await approve(id).unwrap()
      setMsgs(m => ({ ...m, [id]: '✓ Approved' }))
    } catch (err: any) {
      setMsgs(m => ({ ...m, [id]: err?.data?.message ?? 'Error' }))
    } finally {
      setApprovingId(null)
      setTimeout(() => setMsgs(m => { const n = { ...m }; delete n[id]; return n }), 2000)
    }
  }

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      await sendInv(id).unwrap()
      setMsgs(m => ({ ...m, [id]: '✓ Sent' }))
    } catch (err: any) {
      setMsgs(m => ({ ...m, [id]: err?.data?.message ?? 'Error' }))
    } finally {
      setSendingId(null)
      setTimeout(() => setMsgs(m => { const n = { ...m }; delete n[id]; return n }), 2000)
    }
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Bulk generate modal */}
      {bulkModal && (
        <BulkModal
          onClose={() => setBulkModal(false)}
          onGenerate={async (body) => { await generateBulk(body).unwrap(); setBulkModal(false); refetch() }}
          isLoading={bulkLoading}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--foreground-muted)]">{total} invoice(s) pending</div>
        <button onClick={() => setBulkModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Users size={15} /> Generate Bulk Invoices
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-[var(--foreground-muted)]">
          <FileText size={32} opacity={0.4} />
          <p className="text-sm">No pending invoices found.</p>
          <button onClick={() => setBulkModal(true)} className="btn-primary mt-2 text-sm">Generate Invoices</button>
        </div>
      ) : (
        <div className="erp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                <th className="pb-2 pr-4">Invoice #</th>
                <th className="pb-2 pr-4">Student</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-[var(--surface-raised)]">
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--foreground-muted)]">{inv.invoiceNumber ?? inv.id?.slice(0, 8)}</td>
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-[var(--foreground)]">{inv.student?.user?.name ?? '—'}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">{inv.student?.admissionNumber ?? ''}</div>
                  </td>
                  <td className="py-3 pr-4 font-bold text-[var(--foreground)]">Rs. {Number(inv.totalAmount ?? 0).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-[var(--foreground-muted)] text-xs">{inv.invoiceType?.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[inv.status] ?? 'badge-pending'}`}>{inv.status?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {msgs[inv.id] ? (
                        <span className="text-xs text-[var(--success)] font-medium">{msgs[inv.id]}</span>
                      ) : (
                        <>
                          {inv.status === 'PENDING_REVIEW' && (
                            <button onClick={() => handleApprove(inv.id)} disabled={approvingId === inv.id} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--success-bg)] text-[var(--success-dark)] hover:bg-[var(--success)] hover:text-white transition-colors font-medium">
                              <Check size={11} />{approvingId === inv.id ? '...' : 'Approve'}
                            </button>
                          )}
                          {inv.status === 'APPROVED' && (
                            <button onClick={() => handleSend(inv.id)} disabled={sendingId === inv.id} className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors font-medium">
                              <Send size={11} />{sendingId === inv.id ? '...' : 'Send'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
            <button disabled={invoices.length < 20} onClick={() => setPage(p => p + 1)} className="btn-ghost py-1 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

function BulkModal({ onClose, onGenerate, isLoading }: { onClose: () => void; onGenerate: (body: any) => Promise<void>; isLoading: boolean }) {
  const [classId, setClassId] = useState('')
  const [invoiceType, setInvoiceType] = useState('FEE_INVOICE')
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onGenerate({ classId: classId || undefined, invoiceType })
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to generate')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2"><Users size={18}/>Bulk Generate Invoices</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)]"><AlertCircle size={18}/></button>
        </div>
        <form onSubmit={handle} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Class ID (leave blank for all)</label>
            <input type="text" className="erp-input" placeholder="UUID of class (optional)" value={classId} onChange={e => setClassId(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Invoice Type</label>
            <select className="erp-input" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
              <option value="FEE_INVOICE">Fee Invoice</option>
              <option value="OUTSTANDING">Outstanding</option>
              <option value="BULK">Bulk</option>
            </select>
          </div>
          {error && <div className="text-[var(--danger)] text-sm flex gap-1 items-center"><AlertCircle size={13}/>{error}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Generating...' : 'Generate'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
