import { baseApi } from './baseApi'

export const liveClassApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLiveClasses: builder.query<any, any>({
      query: (params) => ({
        url: '/live-classes',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSLiveClass'],
    }),

    listLiveClassesByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/live-classes/students/me/live-classes',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSLiveClass'],
    }),

    listLiveClassesByTeacher: builder.query<any, any>({
      query: (params) => ({
        url: '/live-classes/teachers/me/live-classes',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSLiveClass'],
    }),

    listLiveClassesByClassAndSection: builder.query<any, { classId: string; sectionId: string; [key: string]: any }>({
      query: ({ classId, sectionId, ...params }) => ({
        url: `/live-classes/classes/${classId}/sections/${sectionId}/live-classes`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSLiveClass'],
    }),

    getLiveClassById: builder.query<any, string>({
      query: (id) => `/live-classes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSLiveClass', id }],
    }),

    createLiveClass: builder.mutation<any, any>({
      query: (body) => ({
        url: '/live-classes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LMSLiveClass'],
    }),

    updateLiveClass: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/live-classes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSLiveClass', id }, 'LMSLiveClass'],
    }),

    deleteLiveClass: builder.mutation<any, string>({
      query: (id) => ({
        url: `/live-classes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSLiveClass'],
    }),
  }),
})

export const {
  useListLiveClassesQuery,
  useListLiveClassesByStudentQuery,
  useListLiveClassesByTeacherQuery,
  useListLiveClassesByClassAndSectionQuery,
  useGetLiveClassByIdQuery,
  useCreateLiveClassMutation,
  useUpdateLiveClassMutation,
  useDeleteLiveClassMutation,
} = liveClassApi
