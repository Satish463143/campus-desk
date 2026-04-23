'use client'
import React, { useState } from 'react'
import {
  Settings, X, AlertCircle, Eye, EyeOff, Shield, Globe, Key, Link, CheckCircle
} from 'lucide-react'
import {
  useCreateGatewayMutation,
  useUpdateGatewayMutation,
} from '@/src/store/api/paymentApi'
import Swal from 'sweetalert2'

// ── Gateway field definitions ─────────────────────────────────────────────
//   Each gateway has a schema: array of field configs.
//   "secret" fields render as password inputs with toggle.

interface FieldDef {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'secret' | 'select' | 'url'
  options?: { label: string; value: string }[]
  hint?: string
}

const GATEWAY_FIELDS: Record<string, FieldDef[]> = {
  esewa: [
    {
      key: 'merchantCode',
      label: 'Merchant Code',
      placeholder: 'e.g. EPAYTEST',
      type: 'text',
      hint: 'Your eSewa merchant/product code (provided by eSewa)',
    },
    {
      key: 'secretKey',
      label: 'Secret Key',
      placeholder: 'Your eSewa HMAC secret key',
      type: 'secret',
      hint: 'Used to sign payment requests. Keep this confidential.',
    },
    {
      key: 'successUrl',
      label: 'Success URL',
      placeholder: 'https://yourschool.com/payment/success',
      type: 'url',
      hint: 'eSewa redirects here after a successful payment',
    },
    {
      key: 'failureUrl',
      label: 'Failure URL',
      placeholder: 'https://yourschool.com/payment/failed',
      type: 'url',
      hint: 'eSewa redirects here if the payment fails or is cancelled',
    },
    {
      key: 'env',
      label: 'Environment',
      placeholder: '',
      type: 'select',
      options: [
        { label: 'Test (Sandbox)', value: 'test' },
        { label: 'Live (Production)', value: 'live' },
      ],
      hint: 'Use Test while integrating; switch to Live before go-live',
    },
  ],

  khalti: [
    {
      key: 'publicKey',
      label: 'Public Key',
      placeholder: 'test_public_key_...',
      type: 'text',
      hint: 'Used on the frontend to load the Khalti widget',
    },
    {
      key: 'secretKey',
      label: 'Secret Key',
      placeholder: 'test_secret_key_...',
      type: 'secret',
      hint: 'Server-side key for initiating & verifying payments. Keep confidential.',
    },
    {
      key: 'returnUrl',
      label: 'Return URL',
      placeholder: 'https://yourschool.com/payment/success',
      type: 'url',
      hint: 'Khalti redirects here after the user completes or cancels payment',
    },
    {
      key: 'websiteUrl',
      label: 'Website URL',
      placeholder: 'https://yourschool.com',
      type: 'url',
      hint: 'Your school\'s main website URL (required by Khalti)',
    },
    {
      key: 'env',
      label: 'Environment',
      placeholder: '',
      type: 'select',
      options: [
        { label: 'Test (Sandbox)', value: 'test' },
        { label: 'Live (Production)', value: 'live' },
      ],
      hint: 'Use Test while integrating; switch to Live before go-live',
    },
  ],
}

const GATEWAY_META: Record<string, { icon: string; color: string; name: string; description: string }> = {
  esewa: {
    icon: '💚',
    color: 'border-green-500 bg-green-50',
    name: 'eSewa',
    description: 'Nepal\'s most popular digital wallet. Supports HMAC-signed v2 integration.',
  },
  khalti: {
    icon: '💜',
    color: 'border-purple-500 bg-purple-50',
    name: 'Khalti',
    description: 'Fast & secure Nepali payment gateway. Uses KPG-2 checkout flow.',
  },
}

// ── Single field renderer ─────────────────────────────────────────────────
function GatewayField({
  field, value, onChange,
}: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const [showSecret, setShowSecret] = useState(false)

  const baseClass = 'erp-input w-full'

  const inputEl = (() => {
    if (field.type === 'select') {
      return (
        <select className={baseClass} value={value} onChange={e => onChange(e.target.value)}>
          {field.options?.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'secret') {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
          </div>
          <input
            type={showSecret ? 'text' : 'password'}
            className={`${baseClass} pl-9 pr-10`}
            placeholder={field.placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowSecret(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )
    }

    if (field.type === 'url') {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
          </div>
          <input
            type="url"
            className={`${baseClass} pl-9`}
            placeholder={field.placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )
    }

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
        </div>
        <input
          type="text"
          className={`${baseClass} pl-9`}
          placeholder={field.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    )
  })()

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
        {field.label}
        {field.type === 'secret' && (
          <span className="ml-1.5 text-amber-500 normal-case font-normal">🔒 sensitive</span>
        )}
      </label>
      {inputEl}
      {field.hint && (
        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{field.hint}</p>
      )}
    </div>
  )
}

// ── Main Form Component ────────────────────────────────────────────────────
interface PaymentGatewayFormProps {
  existing?: any          // full gateway object when editing
  defaultMethod?: string  // pre-selected method on create
  onClose: () => void
}

export default function PaymentGatewayForm({
  existing, defaultMethod = 'esewa', onClose,
}: PaymentGatewayFormProps) {
  const [create, { isLoading: creating }] = useCreateGatewayMutation()
  const [update, { isLoading: updating }] = useUpdateGatewayMutation()
  const isLoading = creating || updating

  const isEditMode = !!existing

  // Gateway method is fixed on edit; selectable on create
  const [paymentMethod, setPaymentMethod] = useState<string>(
    existing?.paymentMethod ?? defaultMethod
  )

  const fields = GATEWAY_FIELDS[paymentMethod] ?? []

  // Config: one key per field, pre-filled from existing config if editing
  const initialConfig = () => {
    const base: Record<string, string> = {}
    fields.forEach(f => {
      base[f.key] = existing?.config?.[f.key] ?? (f.type === 'select' ? (f.options?.[0]?.value ?? 'test') : '')
    })
    return base
  }
  const [config, setConfig] = useState<Record<string, string>>(initialConfig)

  // Re-init config keys when method changes (create mode only)
  const handleMethodChange = (m: string) => {
    setPaymentMethod(m)
    const newFields = GATEWAY_FIELDS[m] ?? []
    const fresh: Record<string, string> = {}
    newFields.forEach(f => {
      fresh[f.key] = f.type === 'select' ? (f.options?.[0]?.value ?? 'test') : ''
    })
    setConfig(fresh)
  }

  const [isDefault, setIsDefault] = useState<boolean>(existing?.isDefault ?? false)
  const [status, setStatus] = useState<'active' | 'inactive'>(existing?.status ?? 'active')
  const [error, setError]   = useState('')

  const swalTheme = {
    background: 'var(--card-bg)',
    color: 'var(--foreground)',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields (all fields required except url on khalti publicKey is optional? No — all required)
    const empty = fields.filter(f => !config[f.key]?.trim())
    if (empty.length) {
      setError(`Please fill in: ${empty.map(f => f.label).join(', ')}`)
      return
    }

    // Confirm sensitive save
    const confirm = await Swal.fire({
      ...swalTheme,
      title: isEditMode ? 'Update Gateway?' : 'Save Gateway?',
      html: `
        <div style="font-size:14px; color: var(--foreground-muted); text-align:left;">
          <p>Gateway: <strong>${GATEWAY_META[paymentMethod]?.name ?? paymentMethod}</strong></p>
          <p>Environment: <strong>${config.env ?? 'test'}</strong></p>
          <p style="margin-top:8px;font-size:12px;">Credentials will be stored securely on the server.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isEditMode ? 'Update' : 'Save',
      confirmButtonColor: 'var(--primary)',
    })
    if (!confirm.isConfirmed) return

    try {
      if (isEditMode) {
        await update({ id: existing.id, body: { config, isDefault, status } }).unwrap()
      } else {
        await create({ paymentMethod, config, isDefault, status }).unwrap()
      }

      await Swal.fire({
        ...swalTheme,
        icon: 'success',
        title: isEditMode ? 'Gateway Updated!' : 'Gateway Added!',
        text: `${GATEWAY_META[paymentMethod]?.name} has been configured successfully.`,
        timer: 2000,
        showConfirmButton: false,
      })
      onClose()

    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to save gateway. Please try again.')
    }
  }

  const meta = GATEWAY_META[paymentMethod]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--card-radius)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center gap-2">
            <Settings size={18} className="text-[var(--primary)]" />
            {isEditMode ? 'Edit' : 'Add'} Payment Gateway
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form id="gateway-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

            {/* Method picker — create mode only */}
            {!isEditMode && (
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                  Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(GATEWAY_META).map(([m, meta]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMethodChange(m)}
                      className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border-2 text-left transition-all ${
                        paymentMethod === m
                          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]'
                      }`}
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--foreground)]">{meta.name}</div>
                        <div className="text-xs text-[var(--foreground-muted)] line-clamp-2">{meta.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gateway meta header (edit mode) */}
            {isEditMode && meta && (
              <div className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border-2 ${meta.color}`}>
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <div className="font-bold text-sm">{meta.name}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">{meta.description}</div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Dynamic config fields */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                <Shield size={12} className="text-[var(--primary)]" />
                {meta?.name ?? paymentMethod} Configuration
              </div>
              {fields.map(field => (
                <GatewayField
                  key={field.key}
                  field={field}
                  value={config[field.key] ?? ''}
                  onChange={v => setConfig(prev => ({ ...prev, [field.key]: v }))}
                />
              ))}
            </div>

            <div className="border-t border-[var(--border)]" />

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  className="erp-input w-full"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Default toggle */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                  Set as Default
                </label>
                <button
                  type="button"
                  onClick={() => setIsDefault(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border w-full text-sm font-medium transition-all ${
                    isDefault
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${isDefault ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-4' : ''}`} />
                  </div>
                  {isDefault ? 'Default gateway' : 'Not default'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2.5 rounded-[var(--radius-md)]">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-start gap-2 text-xs text-[var(--foreground-muted)] bg-[var(--surface-raised)] px-3 py-2.5 rounded-[var(--radius-md)]">
              <Shield size={12} className="shrink-0 mt-0.5 text-[var(--primary)]" />
              <span>All credentials are stored encrypted on the server. Secret keys are never returned to the browser after saving.</span>
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-[var(--border)] shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            type="submit"
            form="gateway-form"
            disabled={isLoading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            ) : (
              <><CheckCircle size={15} />{isEditMode ? 'Update Gateway' : 'Save Gateway'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
