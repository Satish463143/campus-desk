'use client'
import React, { useState, useRef } from 'react'
import {
  X, User, Mail, Phone, Lock, MapPin,
  Camera, AlertCircle, CheckCircle, Eye, EyeOff,
} from 'lucide-react'
import {
  useCreateAdminStaffMutation,
  useCreateAccountantMutation,
  useUpdateUserMutation,
} from '@/src/store/api/userApi'
import Swal from 'sweetalert2'

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
        {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Password input with toggle ─────────────────────────────────────────────
function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className="erp-input pr-10"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

// ── Role meta ─────────────────────────────────────────────────────────────
export const ROLE_META: Record<string, { label: string; color: string; icon: string; border: string }> = {
  admin_staff: {
    label: 'Admin Staff',
    color: 'bg-blue-100 text-blue-700',
    icon: '🛡️',
    border: 'border-l-blue-500',
  },
  accountant: {
    label: 'Accountant',
    color: 'bg-emerald-100 text-emerald-700',
    icon: '💰',
    border: 'border-l-emerald-500',
  },
  principal: {
    label: 'Principal',
    color: 'bg-violet-100 text-violet-700',
    icon: '👑',
    border: 'border-l-violet-500',
  },
  teacher: {
    label: 'Teacher',
    color: 'bg-amber-100 text-amber-700',
    icon: '📚',
    border: 'border-l-amber-500',
  },
}

// ── Props ─────────────────────────────────────────────────────────────────
interface MemberFormProps {
  /** 'admin_staff' | 'accountant' */
  createRole?: 'admin_staff' | 'accountant'
  /** Pass existing member when editing */
  existing?: any
  onClose: () => void
}

export default function MemberForm({ createRole = 'admin_staff', existing, onClose }: MemberFormProps) {
  const isEdit = !!existing

  const [createAdminStaff, { isLoading: creatingAdmin }] = useCreateAdminStaffMutation()
  const [createAccountant, { isLoading: creatingAcct }]  = useCreateAccountantMutation()
  const [updateUser,       { isLoading: updating }]       = useUpdateUserMutation()
  const isLoading = creatingAdmin || creatingAcct || updating

  // ── Form state ─────────────────────────────────────────────────────────
  const [role, setRole] = useState<'admin_staff' | 'accountant'>(
    existing?.role ?? createRole
  )
  const [form, setForm] = useState({
    name:        existing?.name  ?? '',
    email:       existing?.email ?? '',
    phone:       existing?.phone ?? '',
    password:    '',
    // Address
    province:    existing?.address?.province    ?? '',
    district:    existing?.address?.district    ?? '',
    fullAddress: existing?.address?.fullAddress ?? '',
    status:      existing?.status ?? 'active',
  })
  const [profilePreview, setProfilePreview] = useState<string | null>(existing?.profileImage ?? null)
  const [profileFile, setProfileFile]       = useState<File | null>(null)
  const [error, setError] = useState('')

  const imgRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const swalTheme = { background: 'var(--card-bg)', color: 'var(--foreground)' }

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!form.name.trim())  { setError('Name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!isEdit && !form.password) { setError('Password is required'); return }
    if (!form.province || !form.district || !form.fullAddress) {
      setError('Province, district, and full address are required'); return
    }

    const fd = new FormData()
    fd.append('name',  form.name)
    fd.append('email', form.email)
    if (form.phone) fd.append('phone', form.phone)
    if (form.password) fd.append('password', form.password)
    fd.append('address[country]',     'Nepal')
    fd.append('address[province]',    form.province)
    fd.append('address[district]',    form.district)
    fd.append('address[fullAddress]', form.fullAddress)
    if (isEdit) fd.append('status', form.status)
    if (profileFile) fd.append('profileImage', profileFile)

    try {
      if (isEdit) {
        await updateUser({ id: existing.id, body: fd }).unwrap()
      } else if (role === 'admin_staff') {
        await createAdminStaff(fd).unwrap()
      } else {
        await createAccountant(fd).unwrap()
      }

      await Swal.fire({
        ...swalTheme,
        icon: 'success',
        title: isEdit ? 'Member Updated!' : 'Member Added!',
        text: `${form.name} has been ${isEdit ? 'updated' : 'added'} successfully.`,
        timer: 2000, showConfirmButton: false,
      })
      onClose()
    } catch (err: any) {
      setError(err?.data?.message ?? 'Something went wrong. Please try again.')
    }
  }

  const roleMeta = ROLE_META[role]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="font-bold text-lg text-[var(--foreground)]">
              {isEdit ? 'Edit Member' : 'Add School Member'}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              {isEdit ? `Editing ${existing?.name}` : 'Fill in details to add a new member'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="member-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

            {/* Role picker (create mode only) */}
            {!isEdit && (
              <div>
                <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['admin_staff', 'accountant'] as const).map(r => {
                    const m = ROLE_META[r]
                    const active = role === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <div>
                          <div className={`text-sm font-bold ${active ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{m.label}</div>
                          <div className="text-xs text-[var(--foreground-muted)]">
                            {r === 'admin_staff' ? 'Can manage staff & students' : 'Manages fees & payments'}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Profile photo */}
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors relative bg-[var(--surface-raised)]"
                onClick={() => imgRef.current?.click()}
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-[var(--foreground-muted)]" />
                )}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                  <Camera size={18} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)] mb-0.5">Profile Photo</div>
                <div className="text-xs text-[var(--foreground-muted)]">Click to upload (JPG, PNG)</div>
                <button type="button" onClick={() => imgRef.current?.click()} className="text-xs text-[var(--primary)] font-semibold mt-1 hover:underline">
                  {profilePreview ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
              <input ref={imgRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setProfileFile(f); setProfilePreview(URL.createObjectURL(f)) }
                }}
              />
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Full Name" required>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                    <input className="erp-input pl-9" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh Sharma" />
                  </div>
                </Field>
              </div>

              <Field label="Email" required>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input type="email" className="erp-input pl-9" value={form.email} onChange={e => set('email', e.target.value)} placeholder="member@school.com" />
                </div>
              </Field>

              <Field label="Phone">
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input type="tel" className="erp-input pl-9" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="98XXXXXXXX" />
                </div>
              </Field>

              <div className="col-span-2">
                <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} required={!isEdit}>
                  <PasswordField value={form.password} onChange={v => set('password', v)} />
                </Field>
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
                <MapPin size={12} className="text-[var(--primary)]" /> Address
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Province" required>
                  <input className="erp-input" value={form.province} onChange={e => set('province', e.target.value)} placeholder="e.g. Bagmati" />
                </Field>
                <Field label="District" required>
                  <input className="erp-input" value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Kathmandu" />
                </Field>
                <div className="col-span-2">
                  <Field label="Full Address" required>
                    <input className="erp-input" value={form.fullAddress} onChange={e => set('fullAddress', e.target.value)} placeholder="Street / Tole / Landmark" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Status (edit only) */}
            {isEdit && (
              <Field label="Status">
                <div className="flex gap-2">
                  {['active', 'inactive'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('status', s)}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                        form.status === s
                          ? s === 'active'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-red-500 bg-red-500 text-white'
                          : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {s === 'active' ? '✅' : '🚫'} {s}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2.5 rounded-lg">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-[var(--border)] shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            type="submit"
            form="member-form"
            disabled={isLoading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            ) : (
              <><CheckCircle size={15} />{isEdit ? 'Save Changes' : `Add ${ROLE_META[role].label}`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
