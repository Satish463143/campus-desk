'use client'
import React, { useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, Tag, DollarSign, Check, X } from 'lucide-react'
import {
  useGetFeeCategoriesQuery, useCreateFeeCategoryMutation, useUpdateFeeCategoryMutation, useDeleteFeeCategoryMutation,
  useGetFeeStructuresQuery, useCreateFeeStructureMutation, useDeleteFeeStructureMutation,
} from '@/src/store/api/feeApi'

interface FeeSetupProps { schoolId: string }

const FREQUENCIES = ['monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time']

// ── Fee Category Form ──────────────────────────────
function CategoryForm({ onClose, existing }: { onClose: () => void; existing?: any }) {
  const [create, { isLoading: creating }] = useCreateFeeCategoryMutation()
  const [update, { isLoading: updating }] = useUpdateFeeCategoryMutation()
  const [form, setForm] = useState({ name: existing?.name ?? '', code: existing?.code ?? '', scope: existing?.scope ?? 'school', description: existing?.description ?? '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (existing) await update({ id: existing.id, body: form }).unwrap()
      else await create(form).unwrap()
      setSuccess(true)
      setTimeout(onClose, 800)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)]">{existing ? 'Edit' : 'New'} Fee Category</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18}/></button>
        </div>
        {success ? <div className="text-[var(--success)] py-4 text-center flex items-center gap-2 justify-center"><Check size={18}/>Saved!</div> : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Name</label>
                <input required className="erp-input" placeholder="Tuition Fee" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Code</label>
                <input required className="erp-input uppercase" placeholder="TUI" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Scope</label>
              <select className="erp-input" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}>
                <option value="school">School-wide</option>
                <option value="class">Class-specific</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Description</label>
              <input className="erp-input" placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {error && <div className="text-[var(--danger)] text-sm flex gap-1 items-center"><AlertCircle size={13}/>{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={creating || updating} className="btn-primary flex-1">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Fee Structure Form ─────────────────────────────
function StructureForm({ onClose, categories }: { onClose: () => void; categories: any[] }) {
  const [create, { isLoading }] = useCreateFeeStructureMutation()
  const [form, setForm] = useState({ feeCategoryId: '', amount: '', frequency: 'monthly', allowPartialPayment: true, isOptional: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await create({ ...form, amount: Number(form.amount) }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 800)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)]">New Fee Structure</h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)]"><X size={18}/></button>
        </div>
        {success ? <div className="text-[var(--success)] py-4 text-center flex items-center gap-2 justify-center"><Check size={18}/>Created!</div> : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Fee Category</label>
              <select required className="erp-input" value={form.feeCategoryId} onChange={e => setForm(f => ({ ...f, feeCategoryId: e.target.value }))}>
                <option value="">Select category...</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Amount (Rs.)</label>
                <input required type="number" min="1" step="0.01" className="erp-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Frequency</label>
                <select className="erp-input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                  {FREQUENCIES.map(fr => <option key={fr} value={fr}>{fr.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.allowPartialPayment} onChange={e => setForm(f => ({ ...f, allowPartialPayment: e.target.checked }))} className="accent-[var(--primary)]" />
                Allow partial payment
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isOptional} onChange={e => setForm(f => ({ ...f, isOptional: e.target.checked }))} className="accent-[var(--primary)]" />
                Optional
              </label>
            </div>
            {error && <div className="text-[var(--danger)] text-sm flex gap-1 items-center"><AlertCircle size={13}/>{error}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function FeeSetup({ schoolId }: FeeSetupProps) {
  const [catModal, setCatModal] = useState<null | 'new' | any>(null)
  const [structModal, setStructModal] = useState(false)

  const { data: catData } = useGetFeeCategoriesQuery(undefined)
  const { data: structData } = useGetFeeStructuresQuery({})
  const [deleteCat] = useDeleteFeeCategoryMutation()
  const [deleteStruct] = useDeleteFeeStructureMutation()

  const categories = catData?.result ?? []
  const structures = structData?.result ?? []

  return (
    <div className="p-5 flex flex-col gap-6">
      {catModal && <CategoryForm onClose={() => setCatModal(null)} existing={catModal === 'new' ? undefined : catModal} />}
      {structModal && <StructureForm onClose={() => setStructModal(false)} categories={categories} />}

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2"><Tag size={16} className="text-[var(--primary)]" />Fee Categories</h2>
          <button onClick={() => setCatModal('new')} className="btn-primary flex items-center gap-1.5 text-sm"><Plus size={14} />New Category</button>
        </div>

        {categories.length === 0 ? (
          <div className="erp-card text-center text-sm text-[var(--foreground-muted)] py-8">No categories yet. <button onClick={() => setCatModal('new')} className="text-[var(--primary)] font-medium">Create one.</button></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat: any) => (
              <div key={cat.id} className="erp-card flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">{cat.name}</div>
                    <div className="text-xs text-[var(--foreground-muted)] font-mono">{cat.code}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCatModal(cat)} className="w-7 h-7 rounded flex items-center justify-center text-[var(--foreground-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--primary)] transition-colors"><Pencil size={13}/></button>
                    <button onClick={() => deleteCat(cat.id)} className="w-7 h-7 rounded flex items-center justify-center text-[var(--foreground-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors"><Trash2 size={13}/></button>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 w-fit rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-medium">{cat.scope}</span>
                {cat.description && <div className="text-xs text-[var(--foreground-muted)]">{cat.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Structures */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2"><DollarSign size={16} className="text-[var(--secondary)]" />Fee Structures</h2>
          <button onClick={() => setStructModal(true)} className="btn-primary flex items-center gap-1.5 text-sm"><Plus size={14} />New Structure</button>
        </div>

        {structures.length === 0 ? (
          <div className="erp-card text-center text-sm text-[var(--foreground-muted)] py-8">No structures yet. <button onClick={() => setStructModal(true)} className="text-[var(--primary)] font-medium">Create one.</button></div>
        ) : (
          <div className="erp-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Frequency</th>
                  <th className="pb-2 pr-4">Partial</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {structures.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-raised)]">
                    <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">{s.feeCategory?.name ?? s.feeCategoryId}</td>
                    <td className="py-3 pr-4 text-[var(--foreground)]">Rs. {Number(s.amount).toLocaleString()}</td>
                    <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded-full bg-[var(--info-bg)] text-[var(--info-text)] text-xs font-medium">{s.frequency?.replace('_', ' ')}</span></td>
                    <td className="py-3 pr-4 text-[var(--foreground-muted)]">{s.allowPartialPayment ? 'Yes' : 'No'}</td>
                    <td className="py-3">
                      <button onClick={() => deleteStruct(s.id)} className="w-7 h-7 rounded flex items-center justify-center text-[var(--foreground-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors"><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
