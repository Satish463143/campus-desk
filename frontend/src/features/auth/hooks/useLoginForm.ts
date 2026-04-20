// features/auth/hooks/useLoginForm.ts
'use client'

import { useRouter } from 'next/navigation'
import { useAppDispatch } from '../../../store/hooks'
import { useLoginMutation } from '../../../store/api/authApi'
import { addToast } from '../../../store/slices/uiSlice'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// role → where to go after login
const ROLE_REDIRECT: Record<string, string> = {
  super_admin: '/dashboard',
  principal:   '/dashboard',
  admin_staff: '/dashboard',
  accountant:  '/dashboard',
  teacher:     '/dashboard',
  student:     '/dashboard',
  parent:      '/dashboard',
}

const loginSchema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

type LoginFormInputs = yup.InferType<typeof loginSchema>

export function useLoginForm() {
  const router   = useRouter()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (form: LoginFormInputs) => {
    try {
      const data = await login(form).unwrap()

      // Backend shape: { result: { userDetails: {...}, token: {...} } }
      const user = data.result.userDetails

      dispatch(addToast({
        type:    'success',
        message: `Welcome back, ${user.name}!`,
      }))

      // redirect based on role
      const redirect = ROLE_REDIRECT[user.role] ?? '/dashboard'
      router.push(redirect)

    } catch (err: any) {
      dispatch(addToast({
        type:    'error',
        message: err?.data?.message ?? 'Invalid email or password',
      }))
    }
  }

  const handleSubmit = hookFormSubmit(onSubmit)

  return {
    register,
    errors,
    isLoading,
    handleSubmit,
  }
}