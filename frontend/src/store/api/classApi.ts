import { baseApi } from './baseApi'

export const classApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /classes
    createClass: builder.mutation({
      query: (body) => ({ url: '/classes', method: 'POST', body }),
      invalidatesTags: ['Class'],
    }),

    // GET /classes?page&limit&academicYearId
    listClasses: builder.query({
      query: (params?: { page?: number; limit?: number; academicYearId?: string }) => ({
        url: '/classes',
        method: 'GET',
        params,
      }),
      providesTags: ['Class'],
    }),

    // GET /classes/:id
    getClassById: builder.query({
      query: (id: string) => ({ url: `/classes/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Class', id }],
    }),

    // PUT /classes/:id
    updateClass: builder.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/classes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Class', id }, 'Class'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateClassMutation,
  useListClassesQuery,
  useGetClassByIdQuery,
  useUpdateClassMutation,
} = classApi
