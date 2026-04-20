import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { RootState } from '../store'
import { setLoggedInUser } from '../slices/authSlice'
import Cookies from 'js-cookie'

// ── 1. Base query with token attached to every request ────────
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,

  // attach token to every request automatically
  prepareHeaders: (headers, { getState }) => {
    const token =
      ((getState() as RootState).user.loggedInUser as any)?.token ??
      localStorage.getItem('_at')

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    headers.set('Content-Type', 'application/json')
    return headers
  },
})

// ── 2. Wrapper that handles 401 → refresh token → retry ───────
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {

  // first attempt
  let result = await rawBaseQuery(args, api, extraOptions)

  // if 401 → token expired → try refresh
  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('_rt')

    if (refreshToken) {
      // call your refresh endpoint
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult.data) {
        const refreshPayload = (refreshResult.data as any).result
        const data = {
          token:        refreshPayload.token.token        as string,
          refreshToken: refreshPayload.token.refreshToken as string,
        }

        // save new tokens
        localStorage.setItem('_at', data.token)
        localStorage.setItem('_rt', data.refreshToken)
        Cookies.set('_at', data.token, { expires: 7 })

        // update Redux state with new token
        api.dispatch(
          setLoggedInUser({
            ...((api.getState() as RootState).user.loggedInUser as any),
            token: data.token,
          })
        )

        // retry original request with new token
        result = await rawBaseQuery(args, api, extraOptions)

      } else {
        // refresh failed → logout user
        localStorage.removeItem('_at')
        localStorage.removeItem('_rt')
        Cookies.remove('_at')
        Cookies.remove('_role')
        api.dispatch(setLoggedInUser(null))
        window.location.href = '/login'
      }
    } else {
      // no refresh token → logout
      localStorage.removeItem('_at')
      Cookies.remove('_at')
      Cookies.remove('_role')
      api.dispatch(setLoggedInUser(null))
      window.location.href = '/login'
    }
  }

  return result
}

// ── 3. Create the base API ─────────────────────────────────────
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  
  // global cache time — how long data stays fresh
  keepUnusedDataFor: 60, // seconds

  // tag types for cache invalidation
  // when you create/update/delete something,
  // RTK Query knows which cached data to refresh
  tagTypes: [
    'User',
    'School',
    'Student',
    'Teacher',
    'Parent',
    'AcademicYear',
    'Class',
    'Section',
    'Subject',
    'Timetable',
    'Attendance',
    'FeeCategory',
    'FeeStructure',
    'FeeSetting',
    'StudentFee',
    'FeeRecord',
    'FeePayment',
    'Reminder',
    'FeeAuditLog',
    'Invoice',
    'PaymentGateway',
    'Scholarship',
    'LMSSyllabus',
    'LMSChapter',
    'LMSResource',
    'LMSAssignment',
    'LMSSubmission',
    'LMSLiveClass',
    'LMSExam',
    'LMSExamSubmission',
    'Notification',
    'ProgressReport',
    'Admission',
    'GradeScale',
  ],

  // empty endpoints — each api file adds its own
  endpoints: () => ({}),
})