import { baseApi } from './baseApi'

export const assignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAssignments: builder.query<any, any>({
      query: (params) => ({
        url: '/assignments',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAssignment'],
    }),

    listAssignmentsByStudent: builder.query<any, any>({
      query: (params) => ({
        url: '/assignments/students/me/assignments',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAssignment'],
    }),

    listAssignmentsByParent: builder.query<any, { studentId: string; [key: string]: any }>({
      query: ({ studentId, ...params }) => ({
        url: `/assignments/parents/me/children/${studentId}/assignments`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAssignment'],
    }),

    listAssignmentsByTeacher: builder.query<any, any>({
      query: (params) => ({
        url: '/assignments/teachers/me/assignments',
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAssignment'],
    }),

    listAssignmentsByClassAndSubject: builder.query<any, { classId: string; subjectId: string; [key: string]: any }>({
      query: ({ classId, subjectId, ...params }) => ({
        url: `/assignments/classes/${classId}/subjects/${subjectId}/assignments`,
        method: 'GET',
        params,
      }),
      providesTags: ['LMSAssignment'],
    }),

    getAssignmentById: builder.query<any, string>({
      query: (id) => `/assignments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSAssignment', id }],
    }),

    createAssignment: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/assignments',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['LMSAssignment'],
    }),

    updateAssignment: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/assignments/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSAssignment', id }, 'LMSAssignment'],
    }),

    deleteAssignment: builder.mutation<any, string>({
      query: (id) => ({
        url: `/assignments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LMSAssignment'],
    }),

    // Submissions
    getAssignmentSubmissions: builder.query<any, { assignmentId: string; [key: string]: any }>({
      query: ({ assignmentId, ...params }) => ({
        url: `/assignments/${assignmentId}/submissions`,
        method: 'GET',
        params,
      }),
      providesTags: (_result, _error, { assignmentId }) => [{ type: 'LMSSubmission', id: `assignment-${assignmentId}` }],
    }),

    getAssignmentSubmissionById: builder.query<any, string>({
      query: (id) => `/assignments/submissions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LMSSubmission', id }],
    }),

    submitAssignment: builder.mutation<any, { assignmentId: string; formData: FormData }>({
      query: ({ assignmentId, formData }) => ({
        url: `/assignments/${assignmentId}/submissions`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: 'LMSSubmission', id: `assignment-${assignmentId}` },
        { type: 'LMSAssignment', id: assignmentId }
      ],
    }),

    updateAssignmentSubmission: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/assignments/submissions/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'LMSSubmission', id }],
    }),

    deleteAssignmentSubmission: builder.mutation<any, string>({
      query: (id) => ({
        url: `/assignments/submissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'LMSSubmission', id }],
    }),
  }),
})

export const {
  useListAssignmentsQuery,
  useListAssignmentsByStudentQuery,
  useListAssignmentsByParentQuery,
  useListAssignmentsByTeacherQuery,
  useListAssignmentsByClassAndSubjectQuery,
  useGetAssignmentByIdQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetAssignmentSubmissionsQuery,
  useGetAssignmentSubmissionByIdQuery,
  useSubmitAssignmentMutation,
  useUpdateAssignmentSubmissionMutation,
  useDeleteAssignmentSubmissionMutation,
} = assignmentApi
