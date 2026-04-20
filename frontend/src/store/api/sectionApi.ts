import { baseApi } from './baseApi'

export const sectionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /sections
    createSection: builder.mutation({
      query: (body) => ({ url: '/sections', method: 'POST', body }),
      invalidatesTags: ['Section'],
    }),

    // GET /sections?page&limit&classId&academicYearId
    listSections: builder.query({
      query: (params?: {
        page?: number
        limit?: number
        classId?: string
        academicYearId?: string
      }) => ({
        url: '/sections',
        method: 'GET',
        params,
      }),
      providesTags: ['Section'],
    }),

    // GET /sections/:id
    getSectionById: builder.query({
      query: (id: string) => ({ url: `/sections/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Section', id }],
    }),

    // PUT /sections/:id
    updateSection: builder.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/sections/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Section', id }, 'Section'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateSectionMutation,
  useListSectionsQuery,
  useGetSectionByIdQuery,
  useUpdateSectionMutation,
} = sectionApi
