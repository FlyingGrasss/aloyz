import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LoginForm } from './LoginForm'
import { Suspense } from 'react'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
