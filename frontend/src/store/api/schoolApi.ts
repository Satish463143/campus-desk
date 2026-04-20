import { schoolStatus } from '@/src/config/constant'
import { baseApi } from './baseApi'

export interface SchoolQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: keyof typeof schoolStatus
}

export const schoolApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerSchool: builder.mutation({
      query: (body) => ({
        url: '/school',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['School'],
    }),

    listSchools: builder.query({
      query: (params: SchoolQueryParams) => ({
        url: '/school',
        method: 'GET',
        params,
      }),
      providesTags: ['School'],
    }),

    getSchool: builder.query({
      query: (id: string) => `/school/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'School', id }],
    }),

    updateSchoolProfile: builder.mutation({
      query: ({ id, body }) => ({
        url: `/school/${id}`,
        method: 'PUT',
        body, // This may be FormData for logo/coverImage uploads
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'School', id }, 'School'],
    }),

    deleteSchool: builder.mutation({
      query: (id: string) => ({
        url: `/school/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['School'],
    }),

    updateSchoolStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/school/status/${id}`,
        method: 'PUT',
        body: { schoolStatus: status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'School', id }, 'School'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useRegisterSchoolMutation,
  useListSchoolsQuery,
  useGetSchoolQuery,
  useUpdateSchoolProfileMutation,
  useDeleteSchoolMutation,
  useUpdateSchoolStatusMutation,
} = schoolApi
