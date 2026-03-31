// app/zone/layout.tsx  (Server Component)
import { getCurrentUser } from '@/lib/getCurrentUser'
import ZoneSidebar from './_components/ZoneSidebar'
import { redirect } from 'next/navigation'
import ZonesList from './_components/zones/ZonesList'
import MobileLayout from './_components/MobileLayout'

export default async function ZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop: Discord-like Sidebar */}
      <div className="hidden md:flex">
        <ZonesList />
        <ZoneSidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Content with Mobile Layout for mobile screens */}
        <MobileLayout user={user}>
          {children}
        </MobileLayout>
      </div>
    </div>
  )
}
