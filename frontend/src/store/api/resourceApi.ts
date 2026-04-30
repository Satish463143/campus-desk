import { baseApi } from './baseApi'

export const resourceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listResources: builder.query<any, any>({
      query: (params) => ({
        url: '/resources',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSResource'],
    }),

    listResourcesByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/resources/students/me/resources',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSResource'],
    }),

    listResourcesByParent: builder.query<any, { studentId: string; [key: string]: any }>({
      query: ({ studentId, ...params }) => ({
        url: `/resources/parents/me/children/${studentId}/resources`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSResource'],
    }),

    getResourceById: builder.query<any, string>({
      query: (id) => `/resources/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSResource', id }],
    }),

    createResource: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/resources',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['LMSResource'],
    }),

    updateResource: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/resources/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSResource', id }, 'LMSResource'],
    }),

    deleteResource: builder.mutation<any, string>({
      query: (id) => ({
        url: `/resources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSResource'],
    }),

    getPresignedUrl: builder.query<any, { id: string; fileIndex?: number }>({
      query: ({ id, fileIndex }) => ({
        url: `/resources/${id}/url`,
        method: 'GET',
        params: fileIndex !== undefined ? { fileIndex } : undefined,
      }),
    }),
  }),
})

export const {
  useListResourcesQuery,
  useListResourcesByStudentQuery,
  useListResourcesByParentQuery,
  useGetResourceByIdQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useGetPresignedUrlQuery,
} = resourceApi
