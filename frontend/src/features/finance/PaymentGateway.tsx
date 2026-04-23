'use client'
import React, { useState } from 'react'
import {
  Settings, Plus, Pencil, Trash2, Shield,
  Zap, Globe, Star, Eye, EyeOff, CheckCircle, XCircle,
} from 'lucide-react'
import {
  useListGatewaysQuery,
  useDeleteGatewayMutation,
  useGetPaymentMethodsQuery,
} from '@/src/store/api/paymentApi'
import Swal from 'sweetalert2'
import PaymentGatewayForm from './PaymentGatewayForm'

// ── Visual config ──────────────────────────────────────────────────────────
const GATEWAY_META: Record<string, { icon: string; name: string; color: string; tagColor: string }> = {
  esewa: {
    icon: '💚',
    name: 'eSewa',
    color: 'border-l-green-500',
    tagColor: 'bg-green-100 text-green-700',
  },
  khalti: {
    icon: '💜',
    name: 'Khalti',
    color: 'border-l-purple-500',
    tagColor: 'bg-purple-100 text-purple-700',
  },
}

// ── Active payment methods strip ───────────────────────────────────────────
function ActiveMethods() {
  const { data, isLoading } = useGetPaymentMethodsQuery(undefined)
  const methods: any[] = data?.result ?? []
  if (isLoading || methods.length === 0) return null

  return (
    <div className="erp-card flex flex-col gap-3">
      <h2 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
        <Globe size={15} className="text-[var(--primary)]" />
        Live Payment Methods
        <span className="ml-auto text-xs font-normal text-[var(--foreground-muted)]">
          Currently accepting payments via:
        </span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {methods.map((m: any) => {
          const key = m.paymentMethod ?? m
          const meta = GATEWAY_META[key]
          return (
            <span
              key={key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${meta?.tagColor ?? 'bg-[var(--surface-raised)] text-[var(--foreground)]'}`}
            >
              {meta?.icon ?? '💳'} {meta?.name ?? key.replace(/_/g, ' ')}
              <CheckCircle size={13} className="opacity-70" />
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Gateway card — masked config preview ───────────────────────────────────
function GatewayCard({ gateway, onEdit, onDelete }: {
  gateway: any; onEdit: () => void; onDelete: () => void
}) {
  const [showConfig, setShowConfig] = useState(false)
  const meta = GATEWAY_META[gateway.paymentMethod]

  // Mask all values — show only key names
  const maskedConfig = gateway.config
    ? Object.fromEntries(Object.entries(gateway.config).map(([k]) => [k, '••••••••']))
    : {}

  return (
    <div className={`erp-card border-l-4 ${meta?.color ?? 'border-l-[var(--border)]'} flex flex-col gap-3 relative overflow-hidden`}>

      {/* Default badge */}
      {gateway.isDefault && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Star size={10} /> Default
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 pr-16">
        <div className="text-3xl">{meta?.icon ?? '💳'}</div>
        <div className="min-w-0">
          <div className="font-bold text-[var(--foreground)]">{meta?.name ?? gateway.paymentMethod}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              gateway.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
            }`}>
              {gateway.status === 'active'
                ? <><CheckCircle size={10} /> Active</>
                : <><XCircle size={10} /> Inactive</>
              }
            </span>
            {gateway.config?.env && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                gateway.config.env === 'live'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {gateway.config.env === 'live' ? '🔴 Live' : '🧪 Test'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Config keys preview toggle */}
      <button
        onClick={() => setShowConfig(v => !v)}
        className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors w-fit"
      >
        <Shield size={11} />
        {showConfig ? <><EyeOff size={11} /> Hide config keys</> : <><Eye size={11} /> Show config keys</>}
      </button>

      {showConfig && (
        <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-3 text-xs font-mono text-[var(--foreground-muted)]">
          {Object.keys(maskedConfig).length === 0 ? (
            <span className="italic">No keys stored</span>
          ) : (
            Object.entries(maskedConfig).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-[var(--foreground)] font-semibold">{k}</span>
                <span className="opacity-60">{String(v)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-[var(--radius-sm)] bg-[var(--info-bg)] text-[var(--info-text)] hover:bg-[var(--info)] hover:text-white transition-colors font-medium flex-1 justify-center"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] text-[var(--danger-text)] hover:bg-[var(--danger)] hover:text-white transition-colors font-medium flex-1 justify-center"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PaymentGateway({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const [modalState, setModalState] = useState<
    { mode: 'add'; defaultMethod: string } | { mode: 'edit'; gateway: any } | null
  >(null)

  const { data, isLoading } = useListGatewaysQuery(undefined)
  const [deleteGw, { isLoading: deleting }] = useDeleteGatewayMutation()

  const gateways: any[] = data?.result ?? []

  const swalTheme = {
    background: 'var(--card-bg)',
    color: 'var(--foreground)',
  }

  const handleDelete = async (gateway: any) => {
    const meta = GATEWAY_META[gateway.paymentMethod]
    const result = await Swal.fire({
      ...swalTheme,
      title: `Remove ${meta?.name ?? gateway.paymentMethod}?`,
      html: `
        <div style="font-size:14px; color: var(--foreground-muted);">
          This will permanently remove the <strong>${meta?.name ?? gateway.paymentMethod}</strong> gateway configuration.
          ${gateway.isDefault ? '<br/><br/><span style="color: var(--danger);">⚠️ This is your default gateway.</span>' : ''}
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return

    try {
      await deleteGw(gateway.id).unwrap()
      Swal.fire({
        ...swalTheme,
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `${meta?.name} removed`,
        showConfirmButton: false,
        timer: 2000,
      })
    } catch (err: any) {
      Swal.fire({
        ...swalTheme,
        icon: 'error',
        title: 'Failed to remove',
        text: err?.data?.message ?? 'Something went wrong.',
      })
    }
  }

  // Which methods are already configured (to suggest the other on "Add")
  const configuredMethods = new Set(gateways.map((g: any) => g.paymentMethod))
  const availableMethods = ['esewa', 'khalti'].filter(m => !configuredMethods.has(m))
  const defaultAddMethod = availableMethods[0] ?? 'esewa'

  return (
    <div className="p-5 flex flex-col gap-6 max-w-4xl">

      {/* Form modal */}
      {modalState?.mode === 'add' && (
        <PaymentGatewayForm
          defaultMethod={modalState.defaultMethod}
          onClose={() => setModalState(null)}
        />
      )}
      {modalState?.mode === 'edit' && (
        <PaymentGatewayForm
          existing={modalState.gateway}
          onClose={() => setModalState(null)}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Payment Gateways</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Configure online payment methods for fee collection
            </p>
          </div>
        </div>

        {availableMethods.length > 0 && (
          <button
            onClick={() => setModalState({ mode: 'add', defaultMethod: defaultAddMethod })}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Gateway
          </button>
        )}
      </div>

      {/* Quick-add buttons for unconfigured gateways */}
      {availableMethods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableMethods.map(m => {
            const meta = GATEWAY_META[m]
            return (
              <button
                key={m}
                onClick={() => setModalState({ mode: 'add', defaultMethod: m })}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-sm text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
              >
                <span>{meta.icon}</span>
                <span>Set up {meta.name}</span>
                <Plus size={13} />
              </button>
            )
          })}
        </div>
      )}

      {/* Active methods strip */}
      <ActiveMethods />

      {/* Gateways grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : gateways.length === 0 ? (
        <div className="erp-card flex flex-col items-center py-16 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-3xl">💳</div>
          <div>
            <div className="font-semibold text-[var(--foreground)] mb-1">No gateways configured</div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Add eSewa or Khalti to start accepting online fee payments.
            </div>
          </div>
          <div className="flex gap-3">
            {['esewa', 'khalti'].map(m => {
              const meta = GATEWAY_META[m]
              return (
                <button
                  key={m}
                  onClick={() => setModalState({ mode: 'add', defaultMethod: m })}
                  className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                >
                  {meta.icon} {meta.name}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gateways.map((g: any) => (
            <GatewayCard
              key={g.id}
              gateway={g}
              onEdit={() => setModalState({ mode: 'edit', gateway: g })}
              onDelete={() => handleDelete(g)}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 text-sm text-[var(--foreground-muted)] bg-[var(--info-bg)] rounded-[var(--radius-md)] px-4 py-3">
        <Shield size={15} className="text-[var(--info)] mt-0.5 shrink-0" />
        <span>Credentials are stored securely on the server. Config key names are shown for verification — secret values are never returned to the browser.</span>
      </div>
    </div>
  )
}
