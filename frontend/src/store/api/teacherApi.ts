import { baseApi } from './baseApi'

const TAG = 'Teacher' as const

// ── Types ──────────────────────────────────────────────────────────────────

export interface TeacherAddress {
  country?: string
  province: string
  district: string
  fullAddress: string
}

export interface CreateTeacherBody {
  name: string
  email: string
  phone: string
  password: string
  joiningDate: string          // ISO date string "YYYY-MM-DD"
  employeeId?: string
  qualification?: string
  experienceYears?: number
  salary?: number
  department?: string
  designation?: string
  address: TeacherAddress
  profileImage?: File          // file upload — caller must use FormData
}

export interface UpdateTeacherBody {
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  password?: string
  joiningDate?: string
  employeeId?: string
  qualification?: string
  experienceYears?: number
  salary?: number
  department?: string
  designation?: string
  address?: Partial<TeacherAddress>
  profileImage?: File
}

export interface UpdateTeacherSelfBody {
  phone?: string
  qualification?: string
  experienceYears?: number
  address?: Partial<TeacherAddress>
  profileImage?: File
}

export interface ListTeachersParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
}

// ── API slice ──────────────────────────────────────────────────────────────

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── POST /teacher ────────────────────────────────────────────────────
    // Multipart/form-data — caller should build FormData and pass it as body
    createTeacher: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/teacher',
        method: 'POST',
        body: formData,
        // Don't set Content-Type — browser sets multipart boundary automatically
        formData: true,
      }),
      invalidatesTags: [TAG],
    }),

    // ── GET /teacher ─────────────────────────────────────────────────────
    listTeachers: builder.query<any, ListTeachersParams | void>({
      query: (params) => ({
        url: '/teacher',
        method: 'GET',
        params: params ?? {},
      }),
      providesTags: [TAG],
    }),

    // ── GET /teacher/:id ─────────────────────────────────────────────────
    getTeacherById: builder.query<any, string>({
      query: (id) => ({ url: `/teacher/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: TAG, id }],
    }),

    // ── PUT /teacher/:id ─────────────────────────────────────────────────
    // Admin / Principal update — multipart (may include profileImage)
    updateTeacher: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/teacher/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: TAG, id }, TAG],
    }),

    // ── DELETE /teacher/:id ──────────────────────────────────────────────
    deleteTeacher: builder.mutation<any, string>({
      query: (id) => ({ url: `/teacher/${id}`, method: 'DELETE' }),
      invalidatesTags: [TAG],
    }),

    // ── PUT /teacher/teacher-self-update/:id ─────────────────────────────
    // Teacher updates own profile — limited fields (multipart)
    updateTeacherSelf: builder.mutation<any, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/teacher/teacher-self-update/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: TAG, id }],
    }),

  }),
  overrideExisting: false,
})

export const {
  useCreateTeacherMutation,
  useListTeachersQuery,
  useGetTeacherByIdQuery,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useUpdateTeacherSelfMutation,
} = teacherApi
