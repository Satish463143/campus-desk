// app/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function RootPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('_at')?.value
  const role = cookieStore.get('_role')?.value

  // already logged in → go to dashboard
  if (token && role) {
    redirect('/dashboard')
  }
  // not logged in → go to login
  redirect('/login')
}