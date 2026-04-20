import { baseApi } from './baseApi'

export const feeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Fee Category ────────────────────────────────────────────────────────
    createFeeCategory: builder.mutation({
      query: (body) => ({
        url: '/fee-management/category',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeeCategory'],
    }),
    getFeeCategories: builder.query({
      query: () => ({
        url: '/fee-management/category',
        method: 'GET',
      }),
      providesTags: ['FeeCategory'],
    }),
    getFeeCategoryById: builder.query({
      query: (id: string) => ({
        url: `/fee-management/category/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'FeeCategory', id }],
    }),
    updateFeeCategory: builder.mutation({
      query: ({ id, body }) => ({
        url: `/fee-management/category/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'FeeCategory', id }, 'FeeCategory'],
    }),
    deleteFeeCategory: builder.mutation({
      query: (id: string) => ({
        url: `/fee-management/category/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeeCategory'],
    }),

    // ─── Fee Structure ───────────────────────────────────────────────────────
    createFeeStructure: builder.mutation({
      query: (body) => ({
        url: '/fee-management/structure',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeeStructure'],
    }),
    getFeeStructures: builder.query({
      query: (params) => ({
        url: '/fee-management/structure',
        method: 'GET',
        params,
      }),
      providesTags: ['FeeStructure'],
    }),
    getFeeStructureById: builder.query({
      query: (id: string) => ({
        url: `/fee-management/structure/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'FeeStructure', id }],
    }),
    updateFeeStructure: builder.mutation({
      query: ({ id, body }) => ({
        url: `/fee-management/structure/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'FeeStructure', id }, 'FeeStructure'],
    }),
    deleteFeeStructure: builder.mutation({
      query: (id: string) => ({
        url: `/fee-management/structure/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeeStructure'],
    }),

    // ─── Fee Setting ─────────────────────────────────────────────────────────
    upsertFeeSetting: builder.mutation({
      query: (body) => ({
        url: '/fee-management/setting',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['FeeSetting'],
    }),
    getFeeSetting: builder.query({
      query: () => ({
        url: '/fee-management/setting',
        method: 'GET',
      }),
      providesTags: ['FeeSetting'],
    }),

    // ─── Assign Student Fee ──────────────────────────────────────────────────
    assignStudentFee: builder.mutation({
      query: (body) => ({
        url: '/fee-management/student',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StudentFee', 'FeeRecord'],
    }),
    bulkAssignStudentFees: builder.mutation({
      query: (body) => ({
        url: '/fee-management/student/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StudentFee', 'FeeRecord'],
    }),

    // ─── Fee Records & Payments ──────────────────────────────────────────────
    listFeeRecords: builder.query({
      query: (params) => ({
        url: '/fee-management/records',
        method: 'GET',
        params,
      }),
      providesTags: ['FeeRecord'],
    }),
    listPayments: builder.query({
      query: (params) => ({
        url: '/fee-management/payments',
        method: 'GET',
        params,
      }),
      providesTags: ['FeePayment'],
    }),

    // ─── Extend Fee Due Date ─────────────────────────────────────────────────
    extendFee: builder.mutation({
      query: ({ id, body }) => ({
        url: `/fee-management/student-fee/${id}/extend`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'StudentFee', id }, 'StudentFee', 'FeeRecord'],
    }),

    // ─── Update / Delete Student Fee ─────────────────────────────────────────
    updateStudentFee: builder.mutation({
      query: ({ id, body }) => ({
        url: `/fee-management/student-fee/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'StudentFee', id }, 'StudentFee', 'FeeRecord'],
    }),
    deleteStudentFee: builder.mutation({
      query: (id: string) => ({
        url: `/fee-management/student-fee/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StudentFee', 'FeeRecord'],
    }),

    // ─── Student & Parent Fees ───────────────────────────────────────────────
    getStudentFees: builder.query({
      query: ({ studentId, params }) => ({
        url: `/fee-management/student/${studentId}`,
        method: 'GET',
        params,
      }),
      providesTags: (_result, _error, { studentId }) => [{ type: 'StudentFee', id: studentId }],
    }),
    getParentFees: builder.query({
      query: ({ parentId, params }) => ({
        url: `/fee-management/parent/${parentId}`,
        method: 'GET',
        params,
      }),
      providesTags: (_result, _error, { parentId }) => [{ type: 'StudentFee', id: parentId }],
    }),

    // ─── Scholarship ─────────────────────────────────────────────────────────
    upsertScholarship: builder.mutation({
      query: (body) => ({
        url: '/fee-management/scholarship',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scholarship', 'FeeRecord'],
    }),

    // ─── Record Offline Payment ──────────────────────────────────────────────
    recordFeePayment: builder.mutation({
      query: (body) => ({
        url: '/fee-management/payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeePayment', 'FeeRecord'],
    }),

    // ─── Overdue Fees ────────────────────────────────────────────────────────
    getOverdueFees: builder.query({
      query: (params) => ({
        url: '/fee-management/overdue',
        method: 'GET',
        params,
      }),
      providesTags: ['FeeRecord'],
    }),

    // ─── Reminders ───────────────────────────────────────────────────────────
    scheduleReminder: builder.mutation({
      query: (body) => ({
        url: '/fee-management/reminder',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reminder'],
    }),
    getPendingReminders: builder.query({
      query: () => ({
        url: '/fee-management/reminder/pending',
        method: 'GET',
      }),
      providesTags: ['Reminder'],
    }),

    // ─── Audit Logs ──────────────────────────────────────────────────────────
    getFeeAuditLogs: builder.query({
      query: (params) => ({
        url: '/fee-management/audit-logs',
        method: 'GET',
        params,
      }),
      providesTags: ['FeeAuditLog'],
    }),

    // ─── Scholarship History ─────────────────────────────────────────────────
    getScholarshipHistory: builder.query({
      query: (studentId: string) => ({
        url: `/fee-management/scholarship/history/${studentId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, studentId) => [{ type: 'Scholarship', id: studentId }],
    }),
    getActiveScholarships: builder.query({
      query: (studentId: string) => ({
        url: `/fee-management/scholarship/active/${studentId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, studentId) => [{ type: 'Scholarship', id: studentId }],
    }),
    deleteScholarship: builder.mutation({
      query: (id: string) => ({
        url: `/fee-management/scholarship/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Scholarship'],
    }),
  }),
  overrideExisting: false,
})

export const {
  // Category
  useCreateFeeCategoryMutation,
  useGetFeeCategoriesQuery,
  useGetFeeCategoryByIdQuery,
  useUpdateFeeCategoryMutation,
  useDeleteFeeCategoryMutation,
  // Structure
  useCreateFeeStructureMutation,
  useGetFeeStructuresQuery,
  useGetFeeStructureByIdQuery,
  useUpdateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  // Setting
  useUpsertFeeSettingMutation,
  useGetFeeSettingQuery,
  // Assign Student Fee
  useAssignStudentFeeMutation,
  useBulkAssignStudentFeesMutation,
  // Records & Payments
  useListFeeRecordsQuery,
  useListPaymentsQuery,
  // Extend/Update/Delete Student Fee
  useExtendFeeMutation,
  useUpdateStudentFeeMutation,
  useDeleteStudentFeeMutation,
  // Student/Parent Fees
  useGetStudentFeesQuery,
  useGetParentFeesQuery,
  // Scholarship
  useUpsertScholarshipMutation,
  useGetScholarshipHistoryQuery,
  useGetActiveScholarshipsQuery,
  useDeleteScholarshipMutation,
  // Payment
  useRecordFeePaymentMutation,
  // Overdue
  useGetOverdueFeesQuery,
  // Reminders
  useScheduleReminderMutation,
  useGetPendingRemindersQuery,
  // Audit Logs
  useGetFeeAuditLogsQuery,
} = feeApi
