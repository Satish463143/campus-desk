import { baseApi } from './baseApi'

export const timetableApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Creation ────────────────────────────────────────────────────────────────

    // POST /time-table/bulk  (array of entries)
    bulkCreateTimetable: builder.mutation({
      query: (body: unknown[]) => ({ url: '/time-table/bulk', method: 'POST', body }),
      invalidatesTags: ['Timetable'],
    }),

    // POST /time-table  (single entry)
    createTimetable: builder.mutation({
      query: (body) => ({ url: '/time-table', method: 'POST', body }),
      invalidatesTags: ['Timetable'],
    }),

    // ── Listing / Filtering ─────────────────────────────────────────────────────

    // GET /time-table?sectionId&classId&dayOfWeek&page&limit
    getTimetables: builder.query({
      query: (params?: {
        sectionId?: string
        classId?: string
        dayOfWeek?: string
        page?: number
        limit?: number
      }) => ({
        url: '/time-table',
        method: 'GET',
        params,
      }),
      providesTags: ['Timetable'],
    }),

    // GET /time-table/section/:sectionId
    getSectionTimetable: builder.query({
      query: (sectionId: string) => ({
        url: `/time-table/section/${sectionId}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, sectionId) => [{ type: 'Timetable', id: `section-${sectionId}` }],
    }),

    // GET /time-table/teacher/:teacherId
    getTeacherTimetable: builder.query({
      query: (teacherId: string) => ({
        url: `/time-table/teacher/${teacherId}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, teacherId) => [{ type: 'Timetable', id: `teacher-${teacherId}` }],
    }),

    // GET /time-table/day/:dayOfWeek
    getDaySchedule: builder.query({
      query: (dayOfWeek: string) => ({
        url: `/time-table/day/${dayOfWeek}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, day) => [{ type: 'Timetable', id: `day-${day}` }],
    }),

    // ── Individual Entry ────────────────────────────────────────────────────────

    // GET /time-table/:id
    getTimetableById: builder.query({
      query: (id: string) => ({ url: `/time-table/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Timetable', id }],
    }),

    // PUT /time-table/:id
    updateTimetable: builder.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/time-table/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Timetable', id }, 'Timetable'],
    }),

    // DELETE /time-table/:id
    deleteTimetable: builder.mutation({
      query: (id: string) => ({ url: `/time-table/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Timetable'],
    }),
  }),
  overrideExisting: false,
})

export const {
  // Creation
  useBulkCreateTimetableMutation,
  useCreateTimetableMutation,
  // Queries
  useGetTimetablesQuery,
  useGetSectionTimetableQuery,
  useGetTeacherTimetableQuery,
  useGetDayScheduleQuery,
  useGetTimetableByIdQuery,
  // Mutations
  useUpdateTimetableMutation,
  useDeleteTimetableMutation,
} = timetableApi
