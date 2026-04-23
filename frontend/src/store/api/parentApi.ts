import { baseApi } from './baseApi';

export const parentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listParents: builder.query({
      query: (params?: { page?: number; limit?: number; search?: string }) => ({
        url: '/parent',
        method: 'GET',
        params,
      }),
      providesTags: ['Parent'],
    }),
    getParentById: builder.query({
      query: (id: string) => ({
        url: `/parent/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'Parent', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListParentsQuery,
  useLazyListParentsQuery,
  useGetParentByIdQuery,
} = parentApi;
