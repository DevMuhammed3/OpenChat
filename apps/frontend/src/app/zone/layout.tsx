'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ZoneSidebar from './_components/ZoneSidebar'
import { api } from '@openchat/lib'
import { RealtimeProvider } from '../providers/realtime-provider'

export default function ZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    api('/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) {
          router.replace('/auth')
        } else {
          setUser(data.user)
        }
      })
  }, [router])

  return (
    <RealtimeProvider>
      <div
        className="
    flex
    h-[100svh]
  "
      >
        {/* Sidebar */}
        <div
          className="
      hidden md:flex
    "
        >
          <ZoneSidebar user={user} />
        </div>

        {/* Content (Chat panel) */}
        <div
          className="
      flex-1 flex flex-col
    "
        >
          {/* Mobile Header */}

          {/* Chat / Page */}
          <main
            className="
        flex-1 overflow-hidden
      "
          >
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
