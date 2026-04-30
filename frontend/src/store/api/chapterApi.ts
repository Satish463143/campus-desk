import { baseApi } from './baseApi'

export const chapterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listChapters: builder.query<any, any>({
      query: (params) => ({
        url: '/chapters',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSChapter'],
    }),

    listChaptersByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/chapters/students/me/chapters',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSChapter'],
    }),

    listChaptersByParent: builder.query<any, { studentId: string; [key: string]: any }>({
      query: ({ studentId, ...params }) => ({
        url: `/chapters/parents/me/children/${studentId}/chapters`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSChapter'],
    }),

    getChapterById: builder.query<any, string>({
      query: (id) => `/chapters/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSChapter', id }],
    }),

    createChapter: builder.mutation<any, any>({
      query: (body) => ({
        url: '/chapters',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LMSChapter'],
    }),

    updateChapter: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/chapters/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSChapter', id }, 'LMSChapter'],
    }),

    deleteChapter: builder.mutation<any, string>({
      query: (id) => ({
        url: `/chapters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSChapter'],
    }),

    // Progress
    getChapterProgress: builder.query<any, { id: string; studentId?: string }>({
      query: ({ id, studentId }) => ({
        url: `/chapters/${id}/progress`,
        method: 'GET',
        params: studentId ? { studentId } : undefined,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'LMSChapter', id: `${id}-progress` }],
    }),

    createChapterProgress: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/chapters/${id}/progress`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSChapter', id: `${id}-progress` }],
    }),

    updateChapterProgress: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/chapters/${id}/progress`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSChapter', id: `${id}-progress` }],
    }),
  }),
})

export const {
  useListChaptersQuery,
  useListChaptersByStudentQuery,
  useListChaptersByParentQuery,
  useGetChapterByIdQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useGetChapterProgressQuery,
  useCreateChapterProgressMutation,
  useUpdateChapterProgressMutation,
} = chapterApi
