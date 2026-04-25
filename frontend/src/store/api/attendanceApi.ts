import { baseApi } from './baseApi'

export interface MarkPeriodAttendanceReq {
  sectionId: string
  classId: string
  academicYearId: string
  date: string
  periodId: string
  teacherId: string
  teacherLatitude?: number | null
  teacherLongitude?: number | null
  attendance: {
    studentId: string
    status: 'ABSENT' | 'LATE' | 'LEAVE'
    remark?: string | null
  }[]
}

export interface UpdatePeriodAttendanceReq {
  id: string
  data: {
    status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
    remark?: string | null
  }
}

export interface MarkTeacherAttendanceReq {
  teacherId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  remark?: string | null
  checkInTime?: string | null
  checkOutTime?: string | null
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ------------------------------------------------------------------
    // STUDENT PERIOD ATTENDANCE ROUTES
    // ------------------------------------------------------------------
    markPeriodAttendance: builder.mutation<any, MarkPeriodAttendanceReq>({
      query: (data) => ({
        url: '/attendance/student/period',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    getPeriodAttendances: builder.query<any, Record<string, any>>({
      query: (params) => ({
        url: '/attendance/student/period',
        method: 'GET',
        params,
      }),
      providesTags: ['Attendance'],
    }),

    getSectionDailySummary: builder.query<any, { sectionId: string; date: string }>({
      query: ({ sectionId, date }) => ({
        url: `/attendance/student/section/${sectionId}/daily-summary`,
        method: 'GET',
        params: { date },
      }),
      providesTags: ['Attendance'],
    }),

    getStudentDailySummary: builder.query<any, { studentId: string; from?: string; to?: string; page?: number; limit?: number }>({
      query: ({ studentId, ...params }) => ({
        url: `/attendance/student/${studentId}/daily-summary`,
        method: 'GET',
        params,
      }),
      providesTags: ['Attendance'],
    }),

    getPeriodAttendanceById: builder.query<any, string>({
      query: (id) => ({
        url: `/attendance/student/period/${id}`,
        method: 'GET',
      }),
      providesTags: ['Attendance'],
    }),

    updatePeriodAttendance: builder.mutation<any, UpdatePeriodAttendanceReq>({
      query: ({ id, data }) => ({
        url: `/attendance/student/period/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    deletePeriodAttendance: builder.mutation<any, string>({
      query: (id) => ({
        url: `/attendance/student/period/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Attendance'],
    }),

    // ------------------------------------------------------------------
    // TEACHER DAILY SELF ATTENDANCE ROUTES
    // ------------------------------------------------------------------
    markTeacherAttendance: builder.mutation<any, MarkTeacherAttendanceReq>({
      query: (data) => ({
        url: '/attendance/teacher/self',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    getTeacherAttendance: builder.query<any, Record<string, any>>({
      query: (params) => ({
        url: '/attendance/teacher',
        method: 'GET',
        params,
      }),
      providesTags: ['Attendance'],
    }),
  }),
})

export const {
  useMarkPeriodAttendanceMutation,
  useGetPeriodAttendancesQuery,
  useLazyGetPeriodAttendancesQuery,
  useGetSectionDailySummaryQuery,
  useLazyGetSectionDailySummaryQuery,
  useGetStudentDailySummaryQuery,
  useLazyGetStudentDailySummaryQuery,
  useGetPeriodAttendanceByIdQuery,
  useLazyGetPeriodAttendanceByIdQuery,
  useUpdatePeriodAttendanceMutation,
  useDeletePeriodAttendanceMutation,
  useMarkTeacherAttendanceMutation,
  useGetTeacherAttendanceQuery,
  useLazyGetTeacherAttendanceQuery,
} = attendanceApi
