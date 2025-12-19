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

export default function ZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

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

  return (
    <RealtimeProvider>
      <div className="h-[100svh] flex">
        {/* Desktop */}
        <div className="hidden md:flex">
          <ZoneSidebar
            user={user}
            onSelectFriend={(f) =>
              router.push(`/zone/chat/${f.username}`)
            }
          />
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col flex-1">
          <div className="border-b p-3 flex items-center gap-2">
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

                <ZoneSidebar
                  user={user}
                  onSelectFriend={(f) =>
                    router.replace(`/zone/chat/${f.username}`)
                  }
                />
              </SheetContent>
            </Sheet>

            <span className="font-semibold text-sm">OpenChat</span>
          </div>

          <main className="flex-1">{children}</main>
        </div>

        {/* Desktop Content */}
        <main className="hidden md:block flex-1">
          {children}
        </main>
      </div>
    </RealtimeProvider>
  )
}

