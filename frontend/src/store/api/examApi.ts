import { baseApi } from './baseApi'

export const examApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listExams: builder.query<any, any>({
      query: (params) => ({
        url: '/exams',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSExam'],
    }),

    listExamsByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/exams/students/me/exams',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSExam'],
    }),

    listExamsByParent: builder.query<any, { studentId: string; [key: string]: any }>({
      query: ({ studentId, ...params }) => ({
        url: `/exams/parents/me/children/${studentId}/exams`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSExam'],
    }),

    listExamsByTeacher: builder.query<any, any>({
      query: (params) => ({
        url: '/exams/teachers/me/exams',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSExam'],
    }),

    listExamsByClassAndSection: builder.query<any, { classId: string; sectionId: string; [key: string]: any }>({
      query: ({ classId, sectionId, ...params }) => ({
        url: `/exams/classes/${classId}/sections/${sectionId}/exams`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSExam'],
    }),

    getExamById: builder.query<any, string>({
      query: (id) => `/exams/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSExam', id }],
    }),

    createExam: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/exams',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['LMSExam'],
    }),

    updateExam: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/exams/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSExam', id }, 'LMSExam'],
    }),

    deleteExam: builder.mutation<any, string>({
      query: (id) => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSExam'],
    }),

    // Submissions
    submitExam: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/exams/${id}/submit`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LMSExamSubmission', id: `exam-${id}` },
        { type: 'LMSExam', id }
      ],
    }),

    listExamSubmissions: builder.query<any, { id: string; [key: string]: any }>({
      query: ({ id, ...params }) => ({
        url: `/exams/${id}/submissions`,
        method: 'GET',
        params,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'LMSExamSubmission', id: `exam-${id}` }],
    }),

    getMyExamSubmission: builder.query<any, string>({
      query: (id) => `/exams/${id}/submissions/me`,
      providesTags: (_result, _error, id) => [{ type: 'LMSExamSubmission', id: `my-exam-${id}` }],
    }),

    reviewExamSubmission: builder.mutation<any, { examId: string; submissionId: string; data: any }>({
      query: ({ examId, submissionId, data }) => ({
        url: `/exams/${examId}/submissions/${submissionId}/review`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { examId }) => [
        { type: 'LMSExamSubmission', id: `exam-${examId}` },
        { type: 'LMSExamSubmission', id: `my-exam-${examId}` }
      ],
    }),
  }),
})

export const {
  useListExamsQuery,
  useListExamsByStudentQuery,
  useListExamsByParentQuery,
  useListExamsByTeacherQuery,
  useListExamsByClassAndSectionQuery,
  useGetExamByIdQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useSubmitExamMutation,
  useListExamSubmissionsQuery,
  useGetMyExamSubmissionQuery,
  useReviewExamSubmissionMutation,
} = examApi
