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

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default function ZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // get user
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data?.user) {
          router.replace('/auth')
        } else {
          setUser(data.user)
        }
      })
  }, [])

// if (!user) {
//   return (
//     <div className="flex h-[100svh] items-center justify-center">
//       <div className="flex items-center gap-2 text-muted-foreground">
//         <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
//         Loading...
//       </div>
//     </div>
//   )
// }

  return (
    <div className="h-[100svh] flex">
      {/* ===== Desktop ===== */}
      <div className="hidden md:flex">
        <ZoneSidebar
          user={user}
          onSelectFriend={(f) =>
            router.push(`/zone/chat/${f.username}`)
          }
        />
      </div>

      {/* ===== Mobile ===== */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Mobile Header */}
        <div className="border-b p-3 flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-md hover:bg-muted">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-80">

              {/* accessibility fix */}
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

      {/* ===== Desktop content ===== */}
      <main className="hidden md:block flex-1">
        {children}
      </main>
    </div>
  )
}

