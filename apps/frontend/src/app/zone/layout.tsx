'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ZoneSidebar from './_components/ZoneSidebar'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from 'packages/ui'
import { Menu } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { api } from '@openchat/lib'
import { RealtimeProvider } from '../providers/realtime-provider'
import { useFriendsStore } from '@/app/stores/friends-store'


export default function ZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const setFriends = useFriendsStore(s => s.setFriends)


  useEffect(() => {
    api('/auth/me', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data?.user) {
          router.replace('/auth')
        } else {
          setUser(data.user)
        }
      })
  }, [router])


  useEffect(() => {
  api('/friends/list')
    .then(res => res.json())
    .then(data => setFriends(data.friends))
}, [])

  return (
    <RealtimeProvider>
<div className="h-[100svh] flex">
  {/* Sidebar */}
  <div className="hidden md:flex">
    <ZoneSidebar user={user} />
  </div>

  {/* Content (Chat panel) */}
  <div className="flex-1 flex flex-col">
    {/* Mobile Header */}
    <div className="md:hidden border-b p-3 flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <button className="p-2 rounded-md hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="p-0 w-80">
          <VisuallyHidden>
            <SheetTitle>Sidebar</SheetTitle>
          </VisuallyHidden>

          <ZoneSidebar user={user} />
        </SheetContent>
      </Sheet>

      <span className="font-semibold text-sm">OpenChat</span>
    </div>

    {/* Chat / Page */}
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  </div>
</div>

    </RealtimeProvider>
  )
}

