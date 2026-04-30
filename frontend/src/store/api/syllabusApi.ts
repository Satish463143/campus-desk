import { baseApi } from './baseApi'

export const syllabusApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSyllabus: builder.query<any, any>({
      query: (params) => ({
        url: '/syllabuses',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSSyllabus'],
    }),

    listSyllabusByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/syllabuses/students/me/syllabuses',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSSyllabus'],
    }),

    listSyllabusByParent: builder.query<any, { studentId: string; [key: string]: any }>({
      query: ({ studentId, ...params }) => ({
        url: `/syllabuses/parents/me/children/${studentId}/syllabuses`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSSyllabus'],
    }),

    getSyllabusById: builder.query<any, string>({
      query: (id) => `/syllabuses/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSSyllabus', id }],
    }),

    createSyllabus: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/syllabuses',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['LMSSyllabus'],
    }),

    updateSyllabus: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/syllabuses/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSSyllabus', id }, 'LMSSyllabus'],
    }),

    deleteSyllabus: builder.mutation<any, string>({
      query: (id) => ({
        url: `/syllabuses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSSyllabus'],
    }),
  }),
})

export const {
  useListSyllabusQuery,
  useListSyllabusByStudentQuery,
  useListSyllabusByParentQuery,
  useGetSyllabusByIdQuery,
  useCreateSyllabusMutation,
  useUpdateSyllabusMutation,
  useDeleteSyllabusMutation,
} = syllabusApi
