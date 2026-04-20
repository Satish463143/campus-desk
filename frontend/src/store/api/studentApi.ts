import { baseApi } from './baseApi'

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── List Students ────────────────────────────────────────────────────────
    listStudents: builder.query({
      query: (params) => ({
        url: '/student',
        method: 'GET',
        params,
      }),
      providesTags: ['Student'],
    }),

    // ─── Get Student By ID ────────────────────────────────────────────────────
    getStudentById: builder.query({
      query: (id: string) => ({
        url: `/student/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),

    // ─── Update Student Profile (Admin/Principal) ─────────────────────────────
    updateStudentProfile: builder.mutation({
      query: ({ id, body }) => ({
        url: `/student/${id}`,
        method: 'PUT',
        body, // FormData (may include profileImage)
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Student', id }, 'Student'],
    }),

    // ─── Delete Student Profile ───────────────────────────────────────────────
    deleteStudentProfile: builder.mutation({
      query: (id: string) => ({
        url: `/student/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Student'],
    }),

    // ─── Student Self Update ──────────────────────────────────────────────────
    updateStudentSelfProfile: builder.mutation({
      query: ({ id, body }) => ({
        url: `/student/student-self-update/${id}`,
        method: 'PUT',
        body, // FormData (may include profileImage)
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Student', id }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useListStudentsQuery,
  useGetStudentByIdQuery,
  useUpdateStudentProfileMutation,
  useDeleteStudentProfileMutation,
  useUpdateStudentSelfProfileMutation,
} = studentApi
