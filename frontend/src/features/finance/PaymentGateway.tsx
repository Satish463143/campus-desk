'use client'
import React, { useState } from 'react'
import {
  Settings, Plus, Pencil, Trash2, AlertCircle, Check, X,
  Shield, Zap, Globe, Star
} from 'lucide-react'
import {
  useListGatewaysQuery,
  useCreateGatewayMutation,
  useUpdateGatewayMutation,
  useDeleteGatewayMutation,
  useGetPaymentMethodsQuery,
} from '@/src/store/api/paymentApi'

const ALL_METHODS = ['cash', 'fone_pay', 'check', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'card']

const METHOD_ICONS: Record<string, string> = {
  esewa:        '💚',
  khalti:       '💜'
}

const METHOD_COLORS: Record<string, string> = {
  esewa:         'bg-green-100 text-green-700',
  khalti:        'bg-purple-100 text-purple-700',
}

// ── Gateway Form Modal ─────────────────────────────
function GatewayModal({ existing, onClose }: { existing?: any; onClose: () => void }) {
  const [create, { isLoading: creating }] = useCreateGatewayMutation()
  const [update, { isLoading: updating }] = useUpdateGatewayMutation()

  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? 'esewa')
  const [isDefault, setIsDefault] = useState<boolean>(existing?.isDefault ?? false)
  const [status, setStatus] = useState<'active' | 'inactive'>(existing?.status ?? 'active')
  const [configRaw, setConfigRaw] = useState(existing?.config ? JSON.stringify(existing.config, null, 2) : '{\n  "merchantId": "",\n  "secretKey": ""\n}')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    let config: any
    try { config = JSON.parse(configRaw) } catch { setError('Config must be valid JSON'); return }
    try {
      if (existing) await update({ id: existing.id, body: { config, isDefault, status } }).unwrap()
      else await create({ paymentMethod, config, isDefault, status }).unwrap()
      setSuccess(true)
      setTimeout(onClose, 900)
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to save gateway')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <Settings size={18} className="text-[var(--primary)]" />
            {existing ? 'Edit' : 'Add'} Payment Gateway
          </h3>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
        </div>

        {success ? (
          <div className="flex items-center gap-2 text-[var(--success)] py-6 justify-center font-medium"><Check size={22} />Gateway saved successfully!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Method picker (only on create) */}
            {!existing && (
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_METHODS.map(m => (
                    <button
                      key={m} type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-[var(--radius-md)] border text-xs font-medium transition-all ${
                        paymentMethod === m
                          ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                          : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className="text-lg">{METHOD_ICONS[m]}</span>
                      {m.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Config JSON */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                Configuration <span className="font-normal">(JSON)</span>
              </label>
              <textarea
                required rows={6}
                className="erp-input font-mono text-xs resize-y"
                value={configRaw}
                onChange={e => setConfigRaw(e.target.value)}
                placeholder='{ "merchantId": "", "secretKey": "" }'
              />
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Enter gateway-specific keys as JSON. Keys are stored securely.</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Status</label>
              <select className="erp-input w-auto" value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Default toggle */}
            <label className="flex items-center justify-between cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] p-3">
              <div>
                <div className="font-semibold text-sm text-[var(--foreground)]">Set as Default</div>
                <div className="text-xs text-[var(--foreground-muted)]">Use this gateway by default for online payments.</div>
              </div>
              <button
                type="button"
                onClick={() => setIsDefault(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${isDefault ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-4' : ''}`} />
              </button>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-[var(--danger)] text-sm bg-[var(--danger-bg)] px-3 py-2 rounded-[var(--radius-md)]">
                <AlertCircle size={14} />{error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={creating || updating} className="btn-primary flex-1">
                {(creating || updating) ? 'Saving...' : 'Save Gateway'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Delete Confirm ─────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel, isLoading }: { name: string; onConfirm: () => void; onCancel: () => void; isLoading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h3 className="font-bold text-lg text-[var(--foreground)]">Remove Gateway</h3>
        <p className="text-sm text-[var(--foreground-secondary)]">Are you sure you want to remove the <strong>{name}</strong> gateway? This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={isLoading} className="flex-1 bg-[var(--danger)] text-white border-none rounded-[var(--radius-md)] px-4 py-2 font-medium cursor-pointer hover:opacity-90 disabled:opacity-60">
            {isLoading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Active Methods Panel ───────────────────────────
function ActiveMethods() {
  const { data, isLoading } = useGetPaymentMethodsQuery(undefined)
  const methods = data?.result ?? []

  if (isLoading) return null
  if (methods.length === 0) return null

  return (
    <div className="erp-card flex flex-col gap-3">
      <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Globe size={16} className="text-[var(--secondary)]" /> Available Payment Methods
      </h2>
      <div className="flex flex-wrap gap-2">
        {methods.map((m: any) => (
          <span key={m.paymentMethod ?? m} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${METHOD_COLORS[m.paymentMethod ?? m] ?? 'badge-active'}`}>
            <span>{METHOD_ICONS[m.paymentMethod ?? m] ?? '💰'}</span>
            {(m.paymentMethod ?? m).replace(/_/g, ' ').toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Gateway Card ───────────────────────────────────
function GatewayCard({ gateway, onEdit, onDelete }: { gateway: any; onEdit: () => void; onDelete: () => void }) {
  const [showConfig, setShowConfig] = useState(false)

  return (
    <div className="erp-card flex flex-col gap-3 relative overflow-hidden">
      {/* Default badge */}
      {gateway.isDefault && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold text-[var(--accent)] bg-[var(--accent-light)] px-2 py-0.5 rounded-full">
          <Star size={11} /> Default
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="text-3xl">{METHOD_ICONS[gateway.paymentMethod] ?? '💰'}</div>
        <div className="min-w-0">
          <div className="font-bold text-[var(--foreground)] capitalize">{gateway.paymentMethod?.replace(/_/g, ' ')}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${gateway.status === 'active' ? 'badge-active' : 'bg-[var(--gray-100)] text-[var(--gray-600)]'}`}>
              {gateway.status}
            </span>
          </div>
        </div>
      </div>

      {/* Config preview */}
      <button onClick={() => setShowConfig(v => !v)} className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
        <Shield size={12} /> {showConfig ? 'Hide' : 'Show'} config keys
      </button>
      {showConfig && (
        <pre className="text-xs bg-[var(--surface-raised)] p-3 rounded-[var(--radius-md)] text-[var(--foreground-muted)] overflow-x-auto">
          {JSON.stringify(gateway.config ? Object.fromEntries(Object.entries(gateway.config).map(([k]) => [k, '••••••'])) : {}, null, 2)}
        </pre>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button onClick={onEdit} className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors font-medium flex-1 justify-center">
          <Pencil size={12} /> Edit
        </button>
        <button onClick={onDelete} className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded bg-[var(--danger-bg)] text-[var(--danger-text)] hover:bg-[var(--danger)] hover:text-white transition-colors font-medium flex-1 justify-center">
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  )
}

// ── Main Export ────────────────────────────────────
export default function PaymentGateway({ schoolId, onClose }: { schoolId: string, onClose: () => void }) {
  const [addModal, setAddModal] = useState(false)
  const [editGateway, setEditGateway] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useListGatewaysQuery(undefined)
  const [deleteGw, { isLoading: deleting }] = useDeleteGatewayMutation()

  const gateways = data?.result ?? []
  const deleteTarget = gateways.find((g: any) => g.id === deleteId)

  return (
    <div className="p-5 flex flex-col gap-6 max-w-4xl">
      {/* Modals */}
      {addModal && <GatewayModal onClose={() => setAddModal(false)} />}
      {editGateway && <GatewayModal existing={editGateway} onClose={() => setEditGateway(null)} />}
      {deleteId && deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.paymentMethod?.replace(/_/g, ' ').toUpperCase()}
          onConfirm={async () => { await deleteGw(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
          isLoading={deleting}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Payment Gateways</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Configure online payment methods for your school</p>
          </div>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Gateway
        </button>
      </div>

      {/* Active methods strip */}
      <ActiveMethods />

      {/* Gateways grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : gateways.length === 0 ? (
        <div className="erp-card flex flex-col items-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-2xl">💳</div>
          <div>
            <div className="font-semibold text-[var(--foreground)] mb-1">No gateways configured</div>
            <div className="text-sm text-[var(--foreground-muted)]">Add a payment gateway to enable online fee collection.</div>
          </div>
          <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2 mt-2 text-sm">
            <Plus size={15} /> Add your first gateway
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((g: any) => (
            <GatewayCard
              key={g.id}
              gateway={g}
              onEdit={() => setEditGateway(g)}
              onDelete={() => setDeleteId(g.id)}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 text-sm text-[var(--foreground-muted)] bg-[var(--info-bg)] rounded-[var(--radius-md)] px-4 py-3">
        <Shield size={15} className="text-[var(--info)] mt-0.5 shrink-0" />
        <span>Gateway credentials are stored securely. Config values are never displayed in full — only key names are shown for verification.</span>
      </div>
    </div>
  )
}
