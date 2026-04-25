import { attendanceStatus } from '@/src/config/constant'

export type AttendanceTab = 'student' | 'teacher'


export interface AttendanceFilterState {
  activeTab: AttendanceTab
  date: string
  academicYearId: string | null
  classId: string | null
  sectionId: string | null
  periodId: string | null
}

export type AttendanceStatus = typeof attendanceStatus[keyof typeof attendanceStatus]
