import { attendanceStatus } from '@/src/config/constant'

export type TeacherAttendanceTab = 'student' | 'self'

export interface TeacherAttendanceFilterState {
  activeTab: TeacherAttendanceTab
  date: string
  academicYearId: string | null
  classId: string | null
  sectionId: string | null
  periodId: string | null
}

export type AttendanceStatus = typeof attendanceStatus[keyof typeof attendanceStatus]

/** A timetable slot as returned from GET /time-table/teacher/:teacherId */
export interface TimetableSlot {
  id: string
  dayOfWeek: string
  period: {
    id: string
    name: string
    periodNumber: number
    startTime?: string
    endTime?: string
  }
  class: {
    id: string
    name: string
  }
  section: {
    id: string
    name: string
  }
  subject: {
    id: string
    name: string
  }
}
