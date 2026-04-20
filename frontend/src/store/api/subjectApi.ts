import { baseApi } from './baseApi'

export const subjectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Subject CRUD ────────────────────────────────────────────────────────────

    // POST /subjects
    createSubject: builder.mutation({
      query: (body) => ({ url: '/subjects', method: 'POST', body }),
      invalidatesTags: ['Subject'],
    }),

    // GET /subjects?page&limit
    listSubjects: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: '/subjects',
        method: 'GET',
        params,
      }),
      providesTags: ['Subject'],
    }),

    // GET /subjects/:id
    getSubjectById: builder.query({
      query: (id: string) => ({ url: `/subjects/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Subject', id }],
    }),

    // PUT /subjects/:id
    updateSubject: builder.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/subjects/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Subject', id }, 'Subject'],
    }),

    // ── Subject ↔ Class Assignment ──────────────────────────────────────────────

    // GET /subjects/class/:classId
    getSubjectsByClass: builder.query({
      query: (classId: string) => ({ url: `/subjects/class/${classId}`, method: 'GET' }),
      providesTags: (_r, _e, classId) => [{ type: 'Subject', id: `class-${classId}` }],
    }),

    // POST /subjects/class/assign  { classId, subjectId }
    assignSubjectToClass: builder.mutation({
      query: (body: { classId: string; subjectId: string }) => ({
        url: '/subjects/class/assign',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subject'],
    }),

    // DELETE /subjects/class/remove  { classId, subjectId }
    removeSubjectFromClass: builder.mutation({
      query: (body: { classId: string; subjectId: string }) => ({
        url: '/subjects/class/remove',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['Subject'],
    }),

    // ── Section ↔ Subject ↔ Teacher Assignment ──────────────────────────────────

    // GET /subjects/section/:sectionId/teachers
    getTeachersBySectionSubjects: builder.query({
      query: (sectionId: string) => ({
        url: `/subjects/section/${sectionId}/teachers`,
        method: 'GET',
      }),
      providesTags: (_r, _e, sectionId) => [{ type: 'Subject', id: `section-${sectionId}` }],
    }),

    // POST /subjects/section/:sectionId/assign  { subjectId, teacherId }
    assignTeacherToSection: builder.mutation({
      query: ({ sectionId, body }: { sectionId: string; body: { subjectId: string; teacherId: string } }) => ({
        url: `/subjects/section/${sectionId}/assign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subject', 'Timetable'],
    }),

    // DELETE /subjects/section/:sectionId/remove  { subjectId }
    removeTeacherFromSection: builder.mutation({
      query: ({ sectionId, body }: { sectionId: string; body: { subjectId: string } }) => ({
        url: `/subjects/section/${sectionId}/remove`,
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['Subject', 'Timetable'],
    }),
  }),
  overrideExisting: false,
})

export const {
  // CRUD
  useCreateSubjectMutation,
  useListSubjectsQuery,
  useGetSubjectByIdQuery,
  useUpdateSubjectMutation,
  // Class assignment
  useGetSubjectsByClassQuery,
  useAssignSubjectToClassMutation,
  useRemoveSubjectFromClassMutation,
  // Section-teacher assignment
  useGetTeachersBySectionSubjectsQuery,
  useAssignTeacherToSectionMutation,
  useRemoveTeacherFromSectionMutation,
} = subjectApi
