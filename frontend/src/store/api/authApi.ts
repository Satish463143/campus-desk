import { baseApi } from './baseApi'
import { setLoggedInUser } from '../slices/authSlice'
import { setSchool, setActiveAcademicYear } from '../slices/schoolSlice'
import Cookies from 'js-cookie'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation({
      query: (body: { email: string; password: string }) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),

      // onQueryStarted runs after API responds
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled

          // Backend shape:
          // { result: { userDetails: {...}, token: { token, refreshToken } }, message, meta }
          const user         = data.result.userDetails
          const accessToken  = data.result.token.token
          const refreshToken = data.result.token.refreshToken

          // 1. save tokens
          localStorage.setItem('_at', accessToken)
          localStorage.setItem('_rt', refreshToken)
          Cookies.set('_at',   accessToken,  { expires: 7 })
          Cookies.set('_role', user.role,    { expires: 7 })

          // 2. save user to Redux
          dispatch(setLoggedInUser({ ...user, token: accessToken }))

          // 3. save school context (super_admin has no schoolId — skip gracefully)
          if (data.result.school) {
            dispatch(setSchool({
              schoolId:   data.result.school.id,
              schoolName: data.result.school.schoolName,
              schoolLogo: data.result.school.logo,
            }))
          }

          // 4. save active academic year
          if (data.result.activeAcademicYear) {
            dispatch(setActiveAcademicYear(data.result.activeAcademicYear))
          }

        } catch (err) {
          // error handled in the component via unwrap()
        }
      },
    }),
    me: builder.query({
      query: () => '/auth/me',
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

  }),
  overrideExisting: false,
})

export const { useLoginMutation, useLogoutMutation, useMeQuery } = authApi