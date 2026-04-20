import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, Save, Building2, User, MapPin } from 'lucide-react'
import { useRegisterSchoolMutation } from '@/src/store/api/schoolApi'
import Swal from 'sweetalert2'

const schoolSchema = yup.object().shape({
  schoolName: yup.string().required('School name is required').trim(),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  principal: yup.object().shape({
    name: yup.string().required('Principal name is required').trim(),
    email: yup.string().email('Invalid email').required('Principal email is required').lowercase().trim(),
    phone: yup.string().required('Principal phone is required')
  }),
  address: yup.object().shape({
    country: yup.string().default('Nepal').required('Country is required'),
    province: yup.string().required('Province is required'),
    district: yup.string().required('District is required'),
    fullAddress: yup.string().required('Full address is required')
  })
})

interface SchoolFormProps {
  onClose: () => void
}

export const SchoolForm: React.FC<SchoolFormProps> = ({ onClose }) => {
  const [registerSchool, { isLoading }] = useRegisterSchoolMutation()
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schoolSchema),
    defaultValues: {
      address: {
        country: 'Nepal'
      }
    }
  })

  const onSubmit = async (data: any) => {
    try {
      await registerSchool(data).unwrap()
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'School registered successfully!',
        timer: 1500,
        showConfirmButton: false
      })
      onClose()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.data?.message || 'Failed to register school'
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto w-full h-full animate-fade-in p-4 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-[var(--card-radius)] border border-[var(--card-border)] shadow-[var(--shadow-lg)] w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Building2 className="text-[var(--primary)]" />
            Register New School
          </h2>
          <button onClick={onClose} className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" id="school-register-form">
            
            {/* School Info */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)] pb-2 flex items-center gap-2">
                <Building2 size={16} /> School Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">School Name *</label>
                  <input {...register('schoolName')} className="erp-input w-full" placeholder="Enter school name" />
                  {errors.schoolName && <span className="text-xs text-[var(--danger)]">{errors.schoolName.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Password *</label>
                  <input type="password" {...register('password')} className="erp-input w-full" placeholder="Enter password for initial login" />
                  {errors.password && <span className="text-xs text-[var(--danger)]">{errors.password.message}</span>}
                </div>
              </div>
            </div>

            {/* Principal Info */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)] pb-2 flex items-center gap-2">
                <User size={16} /> Principal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Name *</label>
                  <input {...register('principal.name')} className="erp-input w-full" placeholder="Principal's name" />
                  {errors.principal?.name && <span className="text-xs text-[var(--danger)]">{errors.principal?.name?.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Email *</label>
                  <input type="email" {...register('principal.email')} className="erp-input w-full" placeholder="Principal's email" />
                  {errors.principal?.email && <span className="text-xs text-[var(--danger)]">{errors.principal?.email?.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Phone *</label>
                  <input {...register('principal.phone')} className="erp-input w-full" placeholder="Principal's phone" />
                  {errors.principal?.phone && <span className="text-xs text-[var(--danger)]">{errors.principal?.phone?.message}</span>}
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-wide border-b border-[var(--border)] pb-2 flex items-center gap-2">
                <MapPin size={16} /> Address Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Country *</label>
                  <input {...register('address.country')} className="erp-input w-full" placeholder="Country" readOnly />
                  {errors.address?.country && <span className="text-xs text-[var(--danger)]">{errors.address?.country?.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">Province *</label>
                  <input {...register('address.province')} className="erp-input w-full" placeholder="Province" />
                  {errors.address?.province && <span className="text-xs text-[var(--danger)]">{errors.address?.province?.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--foreground)]">District *</label>
                  <input {...register('address.district')} className="erp-input w-full" placeholder="District" />
                  {errors.address?.district && <span className="text-xs text-[var(--danger)]">{errors.address?.district?.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Full Address *</label>
                  <input {...register('address.fullAddress')} className="erp-input w-full" placeholder="Street, City, Ward, etc." />
                  {errors.address?.fullAddress && <span className="text-xs text-[var(--danger)]">{errors.address?.fullAddress?.message}</span>}
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 shrink-0 bg-[var(--card-bg)] rounded-b-[var(--card-radius)]">
          <button type="button" onClick={onClose} disabled={isLoading} className="btn-ghost px-5 py-2">
            Cancel
          </button>
          <button type="submit" form="school-register-form" disabled={isLoading} className="btn-primary px-5 py-2 flex items-center gap-2">
            {isLoading ? (
              <>
               <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
               Registering...
              </>
            ) : (
              <>
                <Save size={18} />
                Register School
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
