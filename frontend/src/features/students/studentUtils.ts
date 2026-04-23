// ── Shared constants & helpers for the Students feature ──────────────────

export const GENDER_OPTIONS = ['male', 'female', 'other'] as const
export const BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export const ACADEMIC_STATUSES = ['active', 'graduated', 'dropped', 'transferred'] as const
export const RELATION_TYPES = ['father', 'mother', 'guardian'] as const

export const STATUS_STYLE: Record<string, string> = {
  active:      'bg-emerald-100 text-emerald-700',
  inactive:    'bg-gray-100 text-gray-600',
  graduated:   'bg-blue-100 text-blue-700',
  dropped:     'bg-red-100 text-red-700',
  transferred: 'bg-amber-100 text-amber-700',
  pending:     'bg-orange-100 text-orange-700',
}

export const STATUS_DOT: Record<string, string> = {
  active:      'bg-emerald-500',
  inactive:    'bg-gray-400',
  graduated:   'bg-blue-500',
  dropped:     'bg-red-500',
  transferred: 'bg-amber-500',
  pending:     'bg-orange-500',
}

/** Extract students array from any RTK response shape */
export function safeStudents(data: any): any[] {
  if (!data) return []
  const r = data.result ?? data.data ?? data
  return Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []
}

/** Get initials from a name string */
export function initials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

/** Format a date string nicely */
export function fmtDate(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Colour for avatar background based on name */
const AVATAR_COLORS = [
  'bg-violet-200 text-violet-800',
  'bg-sky-200 text-sky-800',
  'bg-emerald-200 text-emerald-800',
  'bg-rose-200 text-rose-800',
  'bg-amber-200 text-amber-800',
  'bg-indigo-200 text-indigo-800',
]
export function avatarColor(name?: string): string {
  if (!name) return AVATAR_COLORS[0]
  const code = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}
