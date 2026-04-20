import { baseApi } from './baseApi'

export const academicYearApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /academic-years
    createAcademicYear: builder.mutation({
      query: (body) => ({ url: '/academic-years', method: 'POST', body }),
      invalidatesTags: ['AcademicYear'],
    }),

    // GET /academic-years?page&limit
    listAcademicYears: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: '/academic-years',
        method: 'GET',
        params,
      }),
      providesTags: ['AcademicYear'],
    }),

    // GET /academic-years/:id
    getAcademicYearById: builder.query({
      query: (id: string) => ({ url: `/academic-years/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'AcademicYear', id }],
    }),

    // PUT /academic-years/:id
    updateAcademicYear: builder.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/academic-years/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AcademicYear', id }, 'AcademicYear'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateAcademicYearMutation,
  useListAcademicYearsQuery,
  useGetAcademicYearByIdQuery,
  useUpdateAcademicYearMutation,
} = academicYearApi
