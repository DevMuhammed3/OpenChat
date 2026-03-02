// app/zone/layout.tsx  (Server Component)

import { getCurrentUser } from '@/lib/getCurrentUser'
import ZoneSidebar from './_components/ZoneSidebar'
import { RealtimeProvider } from '../providers/realtime-provider'
import { redirect } from 'next/navigation'

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
    <RealtimeProvider>
      <div className="flex h-[100svh]">
        <div className="hidden md:flex">
          <ZoneSidebar user={user} />
        </div>

        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
