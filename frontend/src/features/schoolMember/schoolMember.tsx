'use client'
import React, { useState } from 'react'
import {
  Users, Plus,  Pencil, Trash2, X,
  Shield, DollarSign, Crown, Mail, Phone,
  MapPin, Eye, EyeOff,  UserCog,
  CheckCircle,
} from 'lucide-react'
import { useListUsersQuery, useDeleteUserMutation, useUpdateUserMutation } from '@/src/store/api/userApi'
import Swal from 'sweetalert2'
import MemberForm, { ROLE_META } from './MemberForm'
import { useAppSelector } from '@/src/store/hooks'
import CheckPermission from '@/src/config/rbac.config'
import { role } from '@/src/config/constant'

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

const AVATAR_COLORS = [
  'bg-violet-200 text-violet-800',
  'bg-sky-200   text-sky-800',
  'bg-emerald-200 text-emerald-800',
  'bg-rose-200  text-rose-800',
  'bg-amber-200 text-amber-800',
  'bg-indigo-200 text-indigo-800',
]
function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0]
  const code = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className={`erp-card flex items-center gap-3 border-l-4 ${color}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color.includes('violet') ? 'bg-violet-100 text-violet-700' :
          color.includes('blue') ? 'bg-blue-100 text-blue-700' :
            color.includes('emerald') ? 'bg-emerald-100 text-emerald-700' :
              'bg-amber-100 text-amber-700'
        }`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
        <div className="text-xs text-[var(--foreground-muted)]">{label}</div>
      </div>
    </div>
  )
}

// ── Member card ────────────────────────────────────────────────────────────
function MemberCard({ member, canEdit, onEdit, onDelete }: {
  member: any; canEdit: boolean; onEdit: () => void; onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = ROLE_META[member.role]
  const isActive = member.status === 'active'

  return (
    <div className={`erp-card border-l-4 ${meta?.border ?? 'border-l-[var(--border)]'} flex flex-col gap-3 transition-shadow hover:shadow-md`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {member.profileImage ? (
          <img src={member.profileImage} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
        ) : (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(member.name)}`}>
            {initials(member.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[var(--foreground)] truncate">{member.name}</span>
            {/* Status dot */}
            <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {meta ? (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${meta.color}`}>
                {meta.icon} {meta.label}
              </span>
            ) : (
              <span className="text-xs text-[var(--foreground-muted)] capitalize">{member.role?.replace(/_/g, ' ')}</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        {/* Actions menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
            title={expanded ? 'Hide details' : 'Show details'}
          >
            {expanded ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {canEdit && (
            <>
              <button onClick={onEdit} className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors" title="Edit">
                <Pencil size={14} />
              </button>
              <button onClick={onDelete} className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors" title="Delete">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contact row (always visible) */}
      <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-muted)]">
        {member.email && (
          <div className="flex items-center gap-1">
            <Mail size={11} className="text-[var(--primary)]" />
            <span className="truncate max-w-[180px]">{member.email}</span>
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-1">
            <Phone size={11} className="text-[var(--primary)]" />
            {member.phone}
          </div>
        )}
      </div>

      {/* Expanded: address */}
      {expanded && (
        <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--foreground-muted)]">
          {member.address ? (
            <div className="flex items-start gap-1.5">
              <MapPin size={11} className="text-[var(--primary)] mt-0.5 shrink-0" />
              <span>
                {[member.address.fullAddress, member.address.district, member.address.province, member.address.country].filter(Boolean).join(', ')}
              </span>
            </div>
          ) : (
            <span>No address on record</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SchoolMember() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Modal state: null | { mode:'create'; role } | { mode:'edit'; member }
  const [modal, setModal] = useState<
    null | { mode: 'create'; role: 'admin_staff' | 'accountant' }
    | { mode: 'edit'; member: any }
  >(null)

  // Logged-in user for permission checks
  const loggedInUser = useAppSelector(state => (state.user.loggedInUser as any))
  const myRole: string = loggedInUser?.role ?? ''

  // Permission matrix
  const isPrincipal = myRole === 'principal'
  const isAdminStaff = myRole === 'admin_staff'
  const canCreate = isPrincipal || isAdminStaff
  const canEdit = isPrincipal || isAdminStaff

  // ── Fetch ──────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useListUsersQuery({
    page, limit: 20,
    search: search || undefined,
    status: (statusFilter as any) || undefined,
  })
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation()

  // Normalize whatever shape the API returns into a plain array
  const rawResult = data?.result
  const allMembers: any[] = Array.isArray(rawResult)
    ? rawResult
    : Array.isArray(rawResult?.data)
      ? rawResult.data
      : Array.isArray(rawResult?.rows)
        ? rawResult.rows
        : []

  // Client-side role filter (backend might not support it directly)
  const members = roleFilter
    ? allMembers.filter(m => m.role === roleFilter)
    : allMembers

  // Stats
  const adminCount = allMembers.filter(m => m.role === 'admin_staff').length
  const accountantCount = allMembers.filter(m => m.role === 'accountant').length
  const activeCount = allMembers.filter(m => m.status === 'active').length

  const swalTheme = { background: 'var(--card-bg)', color: 'var(--foreground)' }

  const handleDelete = async (member: any) => {
    const result = await Swal.fire({
      ...swalTheme,
      title: 'Remove this member?',
      html: `<span style="color:var(--foreground-muted);font-size:14px;">This will permanently remove <strong>${member.name}</strong> from the school.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    try {
      await deleteUser(member.id).unwrap()
      Swal.fire({ ...swalTheme, toast: true, position: 'top-end', icon: 'success', title: 'Member removed', showConfirmButton: false, timer: 2000 })
    } catch (err: any) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Failed', text: err?.data?.message })
    }
  }

  const hasFilters = !!search || !!roleFilter || !!statusFilter

  return (
    <div className="p-5 flex flex-col gap-6 max-w-5xl">

      {/* Form modal */}
      {modal?.mode === 'create' && (
        <MemberForm createRole={modal.role} onClose={() => setModal(null)} />
      )}
      {modal?.mode === 'edit' && (
        <MemberForm existing={modal.member} onClose={() => setModal(null)} />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <UserCog size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">School Members</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Manage admin staff and accountants</p>
          </div>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2">
            {isPrincipal && (
              <button
                onClick={() => setModal({ mode: 'create', role: 'admin_staff' })}
                className="btn-ghost flex items-center gap-1.5 text-sm border border-[var(--border)]"
              >
                <Shield size={14} className="text-blue-600" /> Add Admin Staff
              </button>
            )}
            <button
              onClick={() => setModal({ mode: 'create', role: 'accountant' })}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <Plus size={14} /> Add Accountant
            </button>
          </div>
        )}
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Admin Staff" value={adminCount} icon={Shield} color="border-l-blue-500" />
        <StatCard label="Accountants" value={accountantCount} icon={DollarSign} color="border-l-emerald-500" />
        <StatCard label="Active Total" value={activeCount} icon={CheckCircle} color="border-l-gray-400" />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-[350px]">
          <input
            className="erp-input pl-9 text-sm "
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        
        {loggedInUser.role === role.PRINCIPAL && (
          <select className="erp-input w-auto text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin_staff">🛡️ Admin Staff</option>
            <option value="accountant">💰 Accountant</option>
          </select>
        )}
        

        <select className="erp-input w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter('') }}
            className="flex items-center gap-1 text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            <X size={11} /> Clear
          </button>
        )}

        <span className="text-xs text-[var(--foreground-muted)] ml-auto">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="erp-card flex flex-col items-center py-16 gap-4 text-[var(--foreground-muted)]">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center">
            <Users size={28} opacity={0.4} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--foreground)]">{hasFilters ? 'No members match your filters' : 'No school members yet'}</p>
            <p className="text-sm mt-0.5">{hasFilters ? 'Try adjusting your search or filters.' : 'Add your first admin staff or accountant.'}</p>
          </div>
          {canCreate && !hasFilters && (
            <div className="flex gap-2">
              {isPrincipal && (
                <button onClick={() => setModal({ mode: 'create', role: 'admin_staff' })} className="btn-ghost text-sm flex items-center gap-1.5">
                  <Shield size={14} /> Add Admin Staff
                </button>
              )}
              <button onClick={() => setModal({ mode: 'create', role: 'accountant' })} className="btn-primary text-sm flex items-center gap-1.5">
                <Plus size={14} /> Add Accountant
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isFetching ? 'opacity-70' : ''}`}>
          {members.map((m: any) => (
            <MemberCard
              key={m.id}
              member={m}
              canEdit={canEdit && m.role !== 'principal'}
              onEdit={() => setModal({ mode: 'edit', member: m })}
              onDelete={() => handleDelete(m)}
            />
          ))}
        </div>
      )}

      {/* ── Role permissions guide ─────────────────────────────────────────── */}
      <div className="erp-card bg-[var(--surface-raised)] border border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
          <Shield size={14} className="text-[var(--primary)]" /> Role Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--foreground-muted)]">
          {[
            {
              role: 'principal', icon: '👑', label: 'Principal',
              can: ['Create Admin Staff', 'Create Accountants', 'View all members', 'Edit/delete members'],
            },
            {
              role: 'admin_staff', icon: '🛡️', label: 'Admin Staff',
              can: ['Create Accountants', 'View members', 'Edit accountants', 'Delete accountants'],
            },
            {
              role: 'accountant', icon: '💰', label: 'Accountant',
              can: ['View own profile', 'Manage fees', 'Record payments', 'View payment history'],
            },
          ].map(({ role, icon, label, can }) => {
            const isMine = myRole === role
            return (
              <div key={role} className={`rounded-lg p-3 ${isMine ? 'bg-[var(--primary-light)] border border-[var(--primary)] border-opacity-30' : 'bg-[var(--card-bg)]'}`}>
                <div className="font-semibold text-[var(--foreground)] mb-2">{icon} {label} {isMine && <span className="text-[var(--primary)] text-[10px]">(You)</span>}</div>
                {can.map(item => (
                  <div key={item} className="flex items-center gap-1.5 py-0.5">
                    <CheckCircle size={10} className="text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
