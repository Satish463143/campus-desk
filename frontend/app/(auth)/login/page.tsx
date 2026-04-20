// app/(auth)/login/page.tsx
import { LoginForm } from '@/src/features/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — School ERP',
}

export default function LoginPage() {
  return (
    <div className="erp-card w-full max-w-md flex flex-col gap-6">

      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          School ERP
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Sign in to your account
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-[var(--foreground-muted)]">
        <a href="/forgot-password" className="text-[var(--primary)] hover:underline">
          Forgot password?
        </a>
      </p>

    </div>
  )
}