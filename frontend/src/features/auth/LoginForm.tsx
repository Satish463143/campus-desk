'use client'
import { useLoginForm } from './hooks/useLoginForm'

export function LoginForm() {
  const { register, errors, isLoading, handleSubmit } = useLoginForm()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          placeholder="you@school.edu"
          className="erp-input"
          disabled={isLoading}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
          className="erp-input"
          disabled={isLoading}
        />
        {errors.password && (
          <span className="text-xs text-red-500">{errors.password.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full mt-2"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

    </form>
  )
}