'use client'
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { User, Briefcase, MapPin, X, Upload, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Camera } from 'lucide-react'

// ── Yup Schema ─────────────────────────────────────────────────────────────
const createSchema = yup.object({
  name: yup.string().trim().min(2, 'At least 2 chars').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^\d{7,15}$/, 'Enter 7-15 digits').required('Phone is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  joiningDate: yup.string().required('Joining date is required'),
  employeeId: yup.string().optional(),
  qualification: yup.string().optional(),
  experienceYears: yup.number().integer().min(0).optional().nullable(),
  salary: yup.number().min(0).optional().nullable(),
  department: yup.string().optional(),
  designation: yup.string().optional(),
  province: yup.string().required('Province is required'),
  district: yup.string().required('District is required'),
  fullAddress: yup.string().required('Full address is required'),
  country: yup.string().default('Nepal'),
  status: yup.string().optional(),
})

const editSchema = createSchema.shape({
  // Transform empty string -> undefined so min(6) is only checked when the user actually types
  password: yup.string()
    .transform(v => (v === '' || v == null) ? undefined : v)
    .min(6, 'Minimum 6 characters')
    .optional(),
  status: yup.string().required('Status is required'),
})

export type TeacherFormValues = yup.InferType<typeof createSchema>

// ── Step config ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Employment', icon: Briefcase },
  { label: 'Address', icon: MapPin },
]

// ── Sub-components ──────────────────────────────────────────────────────────
function Field({ label, error, children, required }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
        {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-[var(--danger)] mt-0.5">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
interface TeacherFormProps {
  initial?: any
  onClose: () => void
  onSave: (formData: FormData) => Promise<void>
  isLoading: boolean
}

export default function TeacherForm({ initial, onClose, onSave, isLoading }: TeacherFormProps) {
  const isEdit = !!initial
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState<string | null>(initial?.profileImage ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const schema = isEdit ? editSchema : createSchema

  const { register, handleSubmit, formState: { errors }, trigger, getValues } =
    useForm<TeacherFormValues>({
      resolver: yupResolver(schema) as any,
      defaultValues: {
        name: initial?.user?.name ?? '',
        email: initial?.user?.email ?? '',
        phone: initial?.user?.phone ?? '',
        password: '',
        joiningDate: initial?.joiningDate?.slice(0, 10) ?? '',
        employeeId: initial?.employeeId ?? '',
        qualification: initial?.qualification ?? '',
        experienceYears: initial?.experienceYears ?? undefined,
        salary: initial?.salary ?? undefined,
        department: initial?.department ?? '',
        designation: initial?.designation ?? '',
        province: initial?.user?.address?.province ?? '',
        district: initial?.user?.address?.district ?? '',
        fullAddress: initial?.user?.address?.fullAddress ?? '',
        country: initial?.user?.address?.country ?? 'Nepal',
        status: initial?.user?.status ?? 'active',
      },
    })

  // Step field groups for validation on "Next"
  const stepFields: (keyof TeacherFormValues)[][] = [
    ['name', 'email', 'phone', 'password'],
    ['joiningDate', 'employeeId', 'qualification', 'experienceYears', 'salary', 'department', 'designation'],
    ['province', 'district', 'fullAddress', 'country'],
  ]

  const handleNext = async () => {
    const valid = await trigger(stepFields[step])
    if (valid) setStep(s => s + 1)
  }

  const onSubmit = async (values: TeacherFormValues) => {
    setServerError('')
    const fd = new FormData()
    fd.append('name', values.name)
    fd.append('email', values.email)
    fd.append('phone', values.phone)
    if (values.password) fd.append('password', values.password)
    fd.append('joiningDate', values.joiningDate)
    if (values.employeeId)       fd.append('employeeId', values.employeeId)
    if (values.qualification)    fd.append('qualification', values.qualification)
    if (values.experienceYears != null) fd.append('experienceYears', String(values.experienceYears))
    if (values.salary != null)   fd.append('salary', String(values.salary))
    if (values.department)       fd.append('department', values.department)
    if (values.designation)      fd.append('designation', values.designation)
    if (isEdit && values.status) fd.append('status', values.status)
    fd.append('address[province]', values.province)
    fd.append('address[district]', values.district)
    fd.append('address[fullAddress]', values.fullAddress)
    fd.append('address[country]', values.country ?? 'Nepal')
    if (imageFile) fd.append('profileImage', imageFile)
    try {
      await onSave(fd)
    } catch (err: any) {
      setServerError(err?.data?.message ?? 'Something went wrong.')
    }
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[95vh] overflow-hidden">

        {/* ── Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
              <StepIcon size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--foreground)]">
                {isEdit ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">{STEPS[step].label} — Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-raised)] transition-colors">
            <X size={16} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* ── Step progress bar */}
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`w-full h-1.5 rounded-full transition-all ${i <= step ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
              />
              <span className={`text-[10px] font-semibold ${i === step ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* ---------- Step 0: Personal ---------- */}
          {step === 0 && (
            <>
              {/* Avatar upload */}
              <div className="flex items-center gap-4 p-4 bg-[var(--surface-raised)] rounded-xl border border-[var(--border)]">
                <div
                  className="w-16 h-16 rounded-full bg-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 border-2 border-[var(--primary)] cursor-pointer relative group"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview
                    ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    : <User size={28} className="text-[var(--foreground-muted)]" />
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Profile Photo</p>
                  <p className="text-xs text-[var(--foreground-muted)] mb-2">JPG/PNG/WEBP · Max 5 MB</p>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline">
                    <Upload size={12} /> Upload photo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Field label="Full Name" error={errors.name?.message} required>
                  <div className="relative">
                    <input {...register('name')} className="erp-input pl-10" placeholder="e.g. Sita Thapa" />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email" error={errors.email?.message} required>
                    <div className="relative">
                      <input {...register('email')} type="email" className="erp-input pl-10" placeholder="teacher@school.com" />
                    </div>
                  </Field>
                  <Field label="Phone" error={errors.phone?.message} required>
                    <div className="relative">
                      <input {...register('phone')} className="erp-input pl-10" placeholder="98XXXXXXXX" />
                    </div>
                  </Field>
                </div>
                <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password?.message} required={!isEdit}>
                  <div className="relative">
                    <input {...register('password')} type="password" className="erp-input pl-10" placeholder="Min 6 characters" />
                  </div>
                </Field>
                {isEdit && (
                  <Field label="Status" error={(errors as any).status?.message} required>
                    <select {...register('status')} className="erp-input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                )}
              </div>
            </>
          )}

          {/* ---------- Step 1: Employment ---------- */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Joining Date" error={errors.joiningDate?.message} required>
                  <div className="relative">
                    <input {...register('joiningDate')} type="date" className="erp-input pl-10" />
                  </div>
                </Field>
                <Field label="Employee ID" error={errors.employeeId?.message}>
                  <div className="relative">
                    <input {...register('employeeId')} className="erp-input pl-10" placeholder="EMP-001" />
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department" error={errors.department?.message}>
                  <div className="relative">
                    <input {...register('department')} className="erp-input pl-10" placeholder="e.g. Science" />
                  </div>
                </Field>
                <Field label="Designation" error={errors.designation?.message}>
                  <div className="relative">
                    <input {...register('designation')} className="erp-input pl-10" placeholder="e.g. Senior Teacher" />
                  </div>
                </Field>
              </div>
              <Field label="Qualification" error={errors.qualification?.message}>
                <div className="relative">
                  <input {...register('qualification')} className="erp-input pl-10" placeholder="e.g. M.Ed., B.Sc." />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Experience (years)" error={errors.experienceYears?.message}>
                  <input {...register('experienceYears')} type="number" min={0} className="erp-input" placeholder="0" />
                </Field>
                <Field label="Salary (NPR)" error={errors.salary?.message}>
                  <div className="relative">
                    <input {...register('salary')} type="number" min={0} className="erp-input pl-10" placeholder="25000" />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ---------- Step 2: Address ---------- */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-xl border border-[var(--primary)]/20">
                <p className="text-xs text-[var(--primary)] font-semibold flex items-center gap-1.5">
                  <MapPin size={12} /> Residential Address
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Province" error={errors.province?.message} required>
                  <input {...register('province')} className="erp-input" placeholder="e.g. Bagmati" />
                </Field>
                <Field label="District" error={errors.district?.message} required>
                  <input {...register('district')} className="erp-input" placeholder="e.g. Kathmandu" />
                </Field>
              </div>
              <Field label="Full Address" error={errors.fullAddress?.message} required>
                <textarea {...register('fullAddress')} rows={2} className="erp-input resize-none" placeholder="Street, ward, locality…" />
              </Field>
              <Field label="Country">
                <input {...register('country')} className="erp-input" placeholder="Nepal" />
              </Field>
            </div>
          )}

          {serverError && (
            <div className="flex items-center gap-2 text-sm text-[var(--danger)] bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-xl p-3">
              <AlertCircle size={15} />{serverError}
            </div>
          )}
        </form>

        {/* ── Footer navigation */}
        <div className="px-6 pb-5 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="btn-ghost flex items-center gap-1.5"
          >
            <ChevronLeft size={15} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-1.5">
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit(onSubmit)}
              className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isLoading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <CheckCircle2 size={15} />
              }
              {isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Teacher'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
