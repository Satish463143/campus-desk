import { baseApi } from './baseApi'

// Period tag not in baseApi tagTypes — use 'Timetable' as the closest parent
// (Period is a dependency of Timetable entries)
const PERIOD_TAG = 'Timetable' as const

export const periodApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /periods
    createPeriod: builder.mutation({
      query: (body) => ({ url: '/periods', method: 'POST', body }),
      invalidatesTags: [PERIOD_TAG],
    }),

    // GET /periods?academicYearId&page&limit
    getPeriods: builder.query({
      query: (params?: { academicYearId?: string; page?: number; limit?: number }) => ({
        url: '/periods',
        method: 'GET',
        params,
      }),
      providesTags: [PERIOD_TAG],
    }),

    // GET /periods/:id
    getPeriodById: builder.query({
      query: (id: string) => ({ url: `/periods/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: PERIOD_TAG, id }],
    }),

    // PUT /periods/:id
    updatePeriod: builder.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/periods/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: PERIOD_TAG, id }, PERIOD_TAG],
    }),

    // DELETE /periods/:id
    deletePeriod: builder.mutation({
      query: (id: string) => ({ url: `/periods/${id}`, method: 'DELETE' }),
      invalidatesTags: [PERIOD_TAG],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreatePeriodMutation,
  useGetPeriodsQuery,
  useGetPeriodByIdQuery,
  useUpdatePeriodMutation,
  useDeletePeriodMutation,
} = periodApi
