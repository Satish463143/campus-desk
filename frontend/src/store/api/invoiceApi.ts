import { baseApi } from './baseApi'

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── List Pending Invoices ────────────────────────────────────────────────
    listPendingInvoices: builder.query({
      query: (params) => ({
        url: '/invoice',
        method: 'GET',
        params,
      }),
      providesTags: ['Invoice'],
    }),

    // ─── Generate Invoice for Student ────────────────────────────────────────
    generateInvoiceForStudent: builder.mutation({
      query: (body) => ({
        url: '/invoice/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // ─── Generate Bulk Invoices ───────────────────────────────────────────────
    generateBulkInvoices: builder.mutation({
      query: (body) => ({
        url: '/invoice/generate-bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // ─── Approve Invoice ──────────────────────────────────────────────────────
    approveInvoice: builder.mutation({
      query: (id: string) => ({
        url: `/invoice/${id}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Invoice', id }, 'Invoice'],
    }),

    // ─── Send Invoice ─────────────────────────────────────────────────────────
    sendInvoice: builder.mutation({
      query: (id: string) => ({
        url: `/invoice/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Invoice', id }, 'Invoice'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useListPendingInvoicesQuery,
  useGenerateInvoiceForStudentMutation,
  useGenerateBulkInvoicesMutation,
  useApproveInvoiceMutation,
  useSendInvoiceMutation,
} = invoiceApi
