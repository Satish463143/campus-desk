import { userStatus } from '@/src/config/constant'
import { baseApi } from './baseApi'

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: keyof typeof userStatus
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAdminStaff: builder.mutation({
      query: (body) => ({
        url: '/user/admin-team',
        method: 'POST',
        body, // This could be FormData for profileImage
      }),
      invalidatesTags: ['User'],
    }),

    createAccountant: builder.mutation({
      query: (body) => ({
        url: '/user/accountant',
        method: 'POST',
        body, // This could be FormData for profileImage
      }),
      invalidatesTags: ['User'],
    }),
    updateSelf: builder.mutation({
      query: (body) => ({
        url: '/user/me',
        method: 'PUT',
        body, // This could be FormData
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'User', id: 'ME' }, 'User'],
    }),

    listUsers: builder.query({
      query: (params: UserQueryParams) => ({
        url: '/user',
        method: 'GET',
        params,
      }),
      providesTags: ['User'],
    }),

    getUserById: builder.query({
      query: (id: string) => `/user/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    updateUser: builder.mutation({
      query: ({ id, body }) => ({
        url: `/user/${id}`,
        method: 'PUT',
        body, // This could be FormData
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),

    deleteUser: builder.mutation({
      query: (id: string) => ({
        url: `/user/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    updatePrincipalStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/user/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['User', 'School'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateAdminStaffMutation,
  useCreateAccountantMutation,
  useUpdateSelfMutation,
  useListUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdatePrincipalStatusMutation,
} = userApi
