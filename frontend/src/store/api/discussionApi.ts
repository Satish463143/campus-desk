import { baseApi } from './baseApi'

export const discussionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDiscussions: builder.query<any, any>({
      query: (params) => ({
        url: '/discussions',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSDiscussion'],
    }),

    getDiscussionById: builder.query<any, string>({
      query: (id) => `/discussions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSDiscussion', id }],
    }),

    createDiscussion: builder.mutation<any, any>({
      query: (body) => ({
        url: '/discussions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LMSDiscussion'],
    }),

    updateDiscussion: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/discussions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSDiscussion', id }, 'LMSDiscussion'],
    }),

    deleteDiscussion: builder.mutation<any, string>({
      query: (id) => ({
        url: `/discussions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSDiscussion'],
    }),

    // Replies
    createReply: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/discussions/${id}/replies`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSDiscussion', id }],
    }),

    updateReply: builder.mutation<any, { id: string; replyId: string; data: any }>({
      query: ({ id, replyId, data }) => ({
        url: `/discussions/${id}/replies/${replyId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSDiscussion', id }],
    }),

    deleteReply: builder.mutation<any, { id: string; replyId: string }>({
      query: ({ id, replyId }) => ({
        url: `/discussions/${id}/replies/${replyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSDiscussion', id }],
    }),
  }),
})

export const {
  useListDiscussionsQuery,
  useGetDiscussionByIdQuery,
  useCreateDiscussionMutation,
  useUpdateDiscussionMutation,
  useDeleteDiscussionMutation,
  useCreateReplyMutation,
  useUpdateReplyMutation,
  useDeleteReplyMutation,
} = discussionApi
