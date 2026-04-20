import { baseApi } from './baseApi'

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Gateway Management ───────────────────────────────────────────────────
    createGateway: builder.mutation({
      query: (body) => ({
        url: '/payment/gateways',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentGateway'],
    }),
    listGateways: builder.query({
      query: () => ({
        url: '/payment/gateways',
        method: 'GET',
      }),
      providesTags: ['PaymentGateway'],
    }),
    getGatewayById: builder.query({
      query: (id: string) => ({
        url: `/payment/gateways/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'PaymentGateway', id }],
    }),
    updateGateway: builder.mutation({
      query: ({ id, body }) => ({
        url: `/payment/gateways/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'PaymentGateway', id }, 'PaymentGateway'],
    }),
    deleteGateway: builder.mutation({
      query: (id: string) => ({
        url: `/payment/gateways/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentGateway'],
    }),

    // ─── Available Payment Methods ────────────────────────────────────────────
    getPaymentMethods: builder.query({
      query: () => ({
        url: '/payment/methods',
        method: 'GET',
      }),
      providesTags: ['PaymentGateway'],
    }),

    // ─── Student Fee Summary ──────────────────────────────────────────────────
    getStudentFeeSummary: builder.query({
      query: (studentId: string) => ({
        url: `/payment/student/${studentId}/fees`,
        method: 'GET',
      }),
      providesTags: (_result, _error, studentId) => [{ type: 'FeePayment', id: studentId }],
    }),

    // ─── Online Payment ───────────────────────────────────────────────────────
    initiatePayment: builder.mutation({
      query: (body) => ({
        url: '/payment/initiate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeePayment'],
    }),
    verifyPayment: builder.mutation({
      query: (body) => ({
        url: '/payment/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeePayment', 'FeeRecord'],
    }),

    // ─── Manual / Offline Payment ─────────────────────────────────────────────
    recordManualPayment: builder.mutation({
      query: (body) => ({
        url: '/payment/manual',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeePayment', 'FeeRecord'],
    }),
    listManualPayments: builder.query({
      query: (params) => ({
        url: '/payment/manual',
        method: 'GET',
        params,
      }),
      providesTags: ['FeePayment'],
    }),
    getManualPaymentById: builder.query({
      query: (paymentId: string) => ({
        url: `/payment/manual/${paymentId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, paymentId) => [{ type: 'FeePayment', id: paymentId }],
    }),

    // ─── Payment History ──────────────────────────────────────────────────────
    getPaymentHistory: builder.query({
      query: (params) => ({
        url: '/payment/history',
        method: 'GET',
        params,
      }),
      providesTags: ['FeePayment'],
    }),

    // ─── Payment Detail / Status / Receipt / Allocations ─────────────────────
    getPaymentById: builder.query({
      query: (paymentId: string) => ({
        url: `/payment/${paymentId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, paymentId) => [{ type: 'FeePayment', id: paymentId }],
    }),
    getPaymentStatus: builder.query({
      query: (paymentId: string) => ({
        url: `/payment/${paymentId}/status`,
        method: 'GET',
      }),
      providesTags: (_result, _error, paymentId) => [{ type: 'FeePayment', id: paymentId }],
    }),
    getPaymentReceipt: builder.query({
      query: (paymentId: string) => ({
        url: `/payment/${paymentId}/receipt`,
        method: 'GET',
      }),
      providesTags: (_result, _error, paymentId) => [{ type: 'FeePayment', id: paymentId }],
    }),
    getPaymentAllocations: builder.query({
      query: (paymentId: string) => ({
        url: `/payment/${paymentId}/allocations`,
        method: 'GET',
      }),
      providesTags: (_result, _error, paymentId) => [{ type: 'FeePayment', id: paymentId }],
    }),
  }),
  overrideExisting: false,
})

export const {
  // Gateway
  useCreateGatewayMutation,
  useListGatewaysQuery,
  useGetGatewayByIdQuery,
  useUpdateGatewayMutation,
  useDeleteGatewayMutation,
  // Methods
  useGetPaymentMethodsQuery,
  // Student Fee Summary
  useGetStudentFeeSummaryQuery,
  // Online
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  // Manual
  useRecordManualPaymentMutation,
  useListManualPaymentsQuery,
  useGetManualPaymentByIdQuery,
  // History & Detail
  useGetPaymentHistoryQuery,
  useGetPaymentByIdQuery,
  useGetPaymentStatusQuery,
  useGetPaymentReceiptQuery,
  useGetPaymentAllocationsQuery,
} = paymentApi
