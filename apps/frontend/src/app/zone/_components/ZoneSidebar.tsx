'use client'

import { Users } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@openchat/lib'
import ChatList from '../chat/ChatList'
import UserBar from './UserBar'
import { Button } from 'packages/ui'


export default function ZoneSidebar({
  user,
}: {
  user: any
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isHome = pathname === '/zone'


  return (
    <div className="w-80 h-full border-r bg-card flex flex-col">

      {/* Home */}
      <div className="p-3 border-b">
        <Button
          variant="outline"
          onClick={() => router.replace('/zone')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
            isHome ? 'bg-muted' : 'hover:bg-muted/50'
          )}
        >
          <Users className="h-4 w-4" />
          Friends
        </Button>
      </div>

      {/* Chats */}
      <div className="flex-1 overflow-y-auto">
        <ChatList />
      </div>

      {/* User */}
      <UserBar user={user} />
    </div>
  )
}

