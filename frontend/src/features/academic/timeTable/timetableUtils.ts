// ── Shared utilities for the timetable feature ───────────────────────────

export function safeArray(data: any): any[] {
  if (!data) return []
  const r = data.result ?? data.data ?? data
  return Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []
}

export const DAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const
export type DayType = typeof DAYS[number]

export const DAY_FULL: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}
export const DAY_SHORT: Record<string, string> = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
}

export const CLASS_MODE_COLORS: Record<string, string> = {
  online:  'bg-blue-100 text-blue-700',
  offline: 'bg-emerald-100 text-emerald-700',
  ONLINE:  'bg-blue-100 text-blue-700',
  OFFLINE: 'bg-emerald-100 text-emerald-700',
}

/** Returns today's day-of-week lowercase string, e.g. 'monday' */
export function getTodayDow(): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    new Date().getDay()
  ]
}

/** Returns today's display string, e.g. "Monday, 21 Apr 2026" */
export function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Build a 2-level lookup: dayOfWeek → periodId → entry */
export function buildGrid(entries: any[]): Record<string, Record<string, any>> {
  const grid: Record<string, Record<string, any>> = {}
  for (const e of entries) {
    if (!grid[e.dayOfWeek]) grid[e.dayOfWeek] = {}
    grid[e.dayOfWeek][e.periodId] = e
  }
  return grid
}

/** Returns true if current wall-clock time falls within the period. */
export function isCurrentPeriod(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return cur >= sh * 60 + sm && cur < eh * 60 + em
}
