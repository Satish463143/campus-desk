import { baseApi } from './baseApi'

export const announcementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAnnouncements: builder.query<any, any>({
      query: (params) => ({
        url: '/announcements',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAnnouncement'],
    }),

    listAnnouncementsByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/announcements/students/me/announcements',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAnnouncement'],
    }),

    listAnnouncementsByParent: builder.query<any, { studentId: string; [key: string]: any }>({
      query: ({ studentId, ...params }) => ({
        url: `/announcements/parents/me/children/${studentId}/announcements`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAnnouncement'],
    }),

    getAnnouncementById: builder.query<any, string>({
      query: (id) => `/announcements/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSAnnouncement', id }],
    }),

    createAnnouncement: builder.mutation<any, any>({
      query: (body) => ({
        url: '/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LMSAnnouncement'],
    }),

    updateAnnouncement: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/announcements/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LMSAnnouncement', id },
        'LMSAnnouncement',
      ],
    }),

    deleteAnnouncement: builder.mutation<any, string>({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSAnnouncement'],
    }),
  }),
})

export const {
  useListAnnouncementsQuery,
  useListAnnouncementsByStudentQuery,
  useListAnnouncementsByParentQuery,
  useGetAnnouncementByIdQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = announcementApi
