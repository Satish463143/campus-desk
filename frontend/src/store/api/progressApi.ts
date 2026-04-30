import { baseApi } from './baseApi'

export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDynamicStudentProgress: builder.query<any, { academicYearId: string; studentId?: string }>({
      query: (params) => ({
        url: '/progress/dynamic/student',
        method: 'GET',
        params,
      }),
      providesTags: ['ProgressReport'],
    }),

    getDynamicSectionProgress: builder.query<any, { academicYearId: string; sectionId: string }>({
      query: (params) => ({
        url: '/progress/dynamic/section',
        method: 'GET',
        params,
      }),
      providesTags: ['ProgressReport'],
    }),

    listSavedReports: builder.query<any, any>({
      query: (params) => ({
        url: '/progress/reports',
        method: 'GET',
        params,
      }),
      providesTags: ['ProgressReport'],
    }),

    generateProgressReport: builder.mutation<any, any>({
      query: (body) => ({
        url: '/progress/reports/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProgressReport'],
    }),
  }),
})

export const {
  useGetDynamicStudentProgressQuery,
  useGetDynamicSectionProgressQuery,
  useListSavedReportsQuery,
  useGenerateProgressReportMutation,
} = progressApi
