'use client'

import { api } from '@openchat/lib'
import { useRouter } from 'next/navigation'
import { useChatsStore } from '../stores/chat-store'

import AddFriend from './friends/AddFriend'
import FriendRequests from './friends/FriendRequests'
import FriendList from './friends/FriendList'
import { Menu } from 'lucide-react'
import {  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from 'packages/ui'
import ZoneSidebar from './_components/ZoneSidebar'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useEffect, useState } from 'react'

export default function ZoneHome() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

useEffect(() => {
  api('/auth/me', { credentials: 'include' })
    .then(res => res.json())
    .then(data => setUser(data.user))
}, [])

  return (
    <div className="h-full flex flex-col">
<div className="md:hidden p-3 space-y-3">

  {/* Menu + AddFriend */}
  <div className="flex items-center gap-1">
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-md hover:bg-muted shrink-0">
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

    <div className="flex-1">
      <AddFriend />
    </div>
  </div>

  <FriendRequests />
</div>


      {/* Friends */}
      <div className="flex-1 overflow-hidden">
        <FriendList
          onSelectFriend={async (friend) => {
            const res = await api('/chats/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ friendId: friend.id }),
            })

            const data = await res.json()

            useChatsStore.getState().addChat({
              chatPublicId: data.chatPublicId,
              participants: [friend],
              lastMessage: null,
            })

            router.push(`/zone/chat/${data.chatPublicId}`)
          }}
        />
      </div>

      {/* Empty hint */}
      <div className="p-4 text-center text-muted-foreground text-sm">
        Select a friend to start chatting
      </div>
    </div>
  )
}

