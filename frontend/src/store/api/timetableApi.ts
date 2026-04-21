import { baseApi } from './baseApi'

export const timetableApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Creation ────────────────────────────────────────────────────────────────

    // POST /time-table/bulk  (array of entries)
    bulkCreateTimetable: builder.mutation({
      query: ({ entries, academicYearId }: { entries: unknown[]; academicYearId: string }) => ({
        // Embed academicYearId in the URL — body must be a plain array for the Joi DTO
        url: `/time-table/bulk?academicYearId=${encodeURIComponent(academicYearId)}`,
        method: 'POST',
        body: entries,
      }),
      invalidatesTags: ['Timetable'],
    }),

    // POST /time-table  (single entry)
    createTimetable: builder.mutation({
      query: (body) => ({ url: '/time-table', method: 'POST', body }),
      invalidatesTags: ['Timetable'],
    }),

    // ── Listing / Filtering ─────────────────────────────────────────────────────

    // GET /time-table?academicYearId&sectionId&classId&dayOfWeek&page&limit
    getTimetables: builder.query({
      query: (params?: {
        academicYearId?: string
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

    // GET /time-table/section/:sectionId?academicYearId=...
    getSectionTimetable: builder.query({
      query: ({ sectionId, academicYearId }: { sectionId: string; academicYearId: string }) => ({
        url: `/time-table/section/${sectionId}?academicYearId=${encodeURIComponent(academicYearId)}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, { sectionId }) => [{ type: 'Timetable', id: `section-${sectionId}` }],
    }),

    // GET /time-table/teacher/:teacherId?academicYearId=...
    getTeacherTimetable: builder.query({
      query: ({ teacherId, academicYearId }: { teacherId: string; academicYearId: string }) => ({
        url: `/time-table/teacher/${teacherId}?academicYearId=${encodeURIComponent(academicYearId)}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, { teacherId }) => [{ type: 'Timetable', id: `teacher-${teacherId}` }],
    }),

    // GET /time-table/day/:dayOfWeek?academicYearId=...
    getDaySchedule: builder.query({
      query: ({ dayOfWeek, academicYearId }: { dayOfWeek: string; academicYearId: string }) => ({
        url: `/time-table/day/${dayOfWeek}?academicYearId=${encodeURIComponent(academicYearId)}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, { dayOfWeek }) => [{ type: 'Timetable', id: `day-${dayOfWeek}` }],
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
