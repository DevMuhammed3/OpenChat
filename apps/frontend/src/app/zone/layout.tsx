// app/zone/layout.tsx  (Server Component)

import { getCurrentUser } from '@/lib/getCurrentUser'
import ZoneSidebar from './_components/ZoneSidebar'
import { RealtimeProvider } from '../providers/realtime-provider'
import { redirect } from 'next/navigation'
import ZonesList from './_components/zones/ZonesList'
import { MobileNav } from './_components/MobileNav'

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
    <div className="flex h-[100svh] overflow-hidden">
      <div className="hidden md:flex">
        <ZonesList />
        <ZoneSidebar user={user} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav user={user} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
