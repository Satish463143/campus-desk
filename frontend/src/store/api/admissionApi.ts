import { baseApi } from './baseApi'

export const admissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /admission  (multipart: profileImage + documents[])
    createAdmission: builder.mutation({
      query: (formData: FormData) => ({
        url: '/admission',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Student'],
    }),

    // POST /admission/bulk-upload  (multipart: single file CSV/Excel)
    bulkUploadAdmissions: builder.mutation({
      query: (formData: FormData) => ({
        url: '/admission/bulk-upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Student'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateAdmissionMutation,
  useBulkUploadAdmissionsMutation,
} = admissionApi
