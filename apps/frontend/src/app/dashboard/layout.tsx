import { getCurrentUser } from '@/lib/getCurrentUser'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-sidebar text-foreground">
      {children}
    </div>
  )
}
