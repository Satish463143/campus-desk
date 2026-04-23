'use client'
import React, { useState } from 'react'
import {
  X, User, BookOpen, Users, Phone, Mail,
  Calendar, Droplets, MapPin, Pencil, Save,
  Camera, CheckCircle, AlertCircle, ChevronRight,
} from 'lucide-react'
import { useGetStudentByIdQuery, useUpdateStudentProfileMutation } from '@/src/store/api/studentApi'
import Swal from 'sweetalert2'
import { initials, avatarColor, fmtDate, STATUS_STYLE, GENDER_OPTIONS, BLOOD_GROUPS } from './studentUtils'

// ── Section heading ────────────────────────────────────────────────────────
function Section({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 py-2 mb-2 border-b border-[var(--border)]">
      <Icon size={14} className="text-[var(--primary)]" />
      <h3 className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wide">{title}</h3>
    </div>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--foreground-muted)] font-medium shrink-0">{label}</span>
      <span className="text-sm text-[var(--foreground)] text-right font-medium">{value || '—'}</span>
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────
type ActiveTab = 'profile' | 'academic' | 'guardian' | 'documents'

interface Props {
  studentId: string
  onClose: () => void
  canEdit?: boolean
}

export default function StudentProfile({ studentId, onClose, canEdit }: Props) {
  const { data, isLoading, refetch } = useGetStudentByIdQuery(studentId)
  const [updateProfile, { isLoading: saving }] = useUpdateStudentProfileMutation()

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState('')

  const student = data?.result

  // Edit form state (simple fields for now)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)

  const startEdit = () => {
    if (!student) return
    setEditForm({
      name: student.user?.name ?? '',
      email: student.user?.email ?? '',
      phone: student.user?.phone ?? '',
      gender: student.gender ?? 'male',
      dateOfBirth: student.dateOfBirth?.split('T')[0] ?? '',
      bloodGroup: student.bloodGroup ?? '',
      class: student.class ?? '',
      section: student.section ?? '',
      admissionNumber: student.admissionNumber ?? '',
    })
    setEditMode(true)
  }

  const cancelEdit = () => { setEditMode(false); setError(''); setProfileFile(null); setProfilePreview(null) }

  const handleSave = async () => {
    setError('')
    const fd = new FormData()
    Object.entries(editForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
    if (profileFile) fd.append('profileImage', profileFile)
    try {
      await updateProfile({ id: studentId, body: fd }).unwrap()
      await Swal.fire({
        background: 'var(--card-bg)', color: 'var(--foreground)',
        icon: 'success', title: 'Profile updated!', timer: 1800, showConfirmButton: false,
      })
      setEditMode(false)
      refetch()
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to update profile.')
    }
  }

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',   label: 'Profile',   icon: User },
    { id: 'academic',  label: 'Academic',  icon: BookOpen },
    { id: 'guardian',  label: 'Guardian',  icon: Users },
    { id: 'documents', label: 'Documents', icon: CheckCircle },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {student?.user?.profileImage ? (
              <img src={student.user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(student?.user?.name)}`}>
                {initials(student?.user?.name)}
              </div>
            )}
            <div>
              <h2 className="font-bold text-[var(--foreground)]">{isLoading ? 'Loading…' : student?.user?.name ?? 'Student'}</h2>
              <div className="flex items-center gap-2">
                {student?.admissionNumber && (
                  <span className="text-xs text-[var(--foreground-muted)]">#{student.admissionNumber}</span>
                )}
                {student?.academicStatus && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[student.academicStatus] ?? ''}`}>
                    {student.academicStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !editMode && (
              <button onClick={startEdit} className="flex items-center gap-1.5 text-xs btn-ghost py-1.5 px-3">
                <Pencil size={13} /> Edit
              </button>
            )}
            {editMode && (
              <>
                <button onClick={cancelEdit} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                  {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)]">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] shrink-0 px-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          ) : !student ? (
            <div className="flex flex-col items-center py-12 gap-3 text-[var(--foreground-muted)]">
              <AlertCircle size={32} opacity={0.3} />
              <p>Student data not found.</p>
            </div>
          ) : (
            <>
              {/* ── Profile tab ─────────────────────────────────────────── */}
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-6">
                  {editMode ? (
                    <>
                      {/* Photo upload in edit */}
                      <div className="flex items-center gap-4">
                        <div
                          className="w-20 h-20 rounded-full overflow-hidden bg-[var(--surface-raised)] border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors relative"
                          onClick={() => document.getElementById('profile-img-input')?.click()}
                        >
                          {profilePreview || student.user?.profileImage ? (
                            <img src={profilePreview ?? student.user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${avatarColor(student.user?.name)}`}>
                              {initials(student.user?.name)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white" />
                          </div>
                        </div>
                        <div className="text-xs text-[var(--foreground-muted)]">Click to change profile photo</div>
                        <input id="profile-img-input" type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) { setProfileFile(f); setProfilePreview(URL.createObjectURL(f)) } }} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'name', label: 'Full Name', type: 'text' },
                          { key: 'email', label: 'Email', type: 'email' },
                          { key: 'phone', label: 'Phone', type: 'tel' },
                        ].map(({ key, label, type }) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">{label}</label>
                            <input type={type} className="erp-input" value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Gender</label>
                          <select className="erp-input" value={editForm.gender ?? ''} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Date of Birth</label>
                          <input type="date" className="erp-input" value={editForm.dateOfBirth ?? ''} onChange={e => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">Blood Group</label>
                          <select className="erp-input" value={editForm.bloodGroup ?? ''} onChange={e => setEditForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                            <option value="">— None —</option>
                            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* View mode */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-raised)]">
                        {student.user?.profileImage ? (
                          <img src={student.user.profileImage} alt="" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${avatarColor(student.user?.name)}`}>
                            {initials(student.user?.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-lg text-[var(--foreground)]">{student.user?.name}</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {student.gender && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)] capitalize">{student.gender}</span>}
                            {student.bloodGroup && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold"><Droplets size={9} className="inline mr-0.5" />{student.bloodGroup}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                        <div>
                          <Section icon={User} title="Personal Info" />
                          <InfoRow label="Email" value={student.user?.email} />
                          <InfoRow label="Phone" value={student.user?.phone} />
                          <InfoRow label="Date of Birth" value={fmtDate(student.dateOfBirth)} />
                          <InfoRow label="Blood Group" value={student.bloodGroup} />
                          <InfoRow label="Status" value={student.user?.status} />
                        </div>
                        <div>
                          <Section icon={MapPin} title="Address" />
                          <InfoRow label="Country"  value={student.user?.address?.country} />
                          <InfoRow label="Province" value={student.user?.address?.province} />
                          <InfoRow label="District" value={student.user?.address?.district} />
                          <InfoRow label="Address"  value={student.user?.address?.fullAddress} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Academic tab ──────────────────────────────────────────── */}
              {activeTab === 'academic' && (
                <div className="flex flex-col gap-4">
                  {editMode ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'class', label: 'Class' }, { key: 'section', label: 'Section' },
                        { key: 'admissionNumber', label: 'Admission Number' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">{label}</label>
                          <input className="erp-input" value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                      <div>
                        <Section icon={BookOpen} title="Enrollment" />
                        <InfoRow label="Class" value={student.class} />
                        <InfoRow label="Section" value={student.section} />
                        <InfoRow label="Admission No." value={student.admissionNumber} />
                        <InfoRow label="Date of Admission" value={fmtDate(student.dateOfAdmission)} />
                        <InfoRow label="Academic Status" value={student.academicStatus} />
                      </div>
                      <div>
                        <Section icon={BookOpen} title="Additional" />
                        <InfoRow label="Nationality" value={student.studentProfile?.studentInfo?.nationality} />
                        <InfoRow label="Religion" value={student.studentProfile?.studentInfo?.religion} />
                        <InfoRow label="Time Batch" value={student.studentProfile?.studentInfo?.timeBatch} />
                        <InfoRow label="Language at Home" value={student.studentProfile?.studentInfo?.languageAtHome} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Guardian tab ──────────────────────────────────────────── */}
              {activeTab === 'guardian' && (
                <div className="flex flex-col gap-4">
                  {(['father', 'mother', 'guardian'] as const).map(role => {
                    const p = student.studentProfile?.[role] as any
                    if (!p?.name && !editMode) return null
                    return (
                      <div key={role} className="rounded-xl border border-[var(--border)] p-4">
                        <h3 className="font-semibold text-sm text-[var(--foreground)] capitalize mb-2">{role}</h3>
                        {p?.name ? (
                          <div className="grid grid-cols-2 gap-x-8 gap-y-0 text-sm">
                            <InfoRow label="Name" value={p.name} />
                            <InfoRow label="Email" value={p.email} />
                            <InfoRow label="Phone" value={p.phone} />
                            <InfoRow label="Occupation" value={p.occupation} />
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--foreground-muted)]">No {role} information recorded.</p>
                        )}
                      </div>
                    )
                  })}
                  {!student.studentProfile?.father?.name && !student.studentProfile?.mother?.name && !student.studentProfile?.guardian?.name && (
                    <div className="flex flex-col items-center py-10 gap-3 text-[var(--foreground-muted)]">
                      <Users size={32} opacity={0.3} />
                      <p className="text-sm">No guardian information recorded.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Documents tab ─────────────────────────────────────────── */}
              {activeTab === 'documents' && (
                <div className="flex flex-col items-center py-12 gap-3 text-[var(--foreground-muted)]">
                  <CheckCircle size={32} opacity={0.3} />
                  <p className="text-sm">Document management coming soon.</p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 mt-4 text-sm text-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2.5 rounded-lg">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
