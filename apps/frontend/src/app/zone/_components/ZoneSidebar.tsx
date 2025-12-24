'use client'

import { Home } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@openchat/lib'
import { api } from '@openchat/lib'
import ChatList from '../chat/ChatList'
import UserBar from './UserBar'
import FriendList from '../friends/FriendList'
import AddFriend from '../friends/AddFriend'
import FriendRequests from '../friends/FriendRequests'


export default function ZoneSidebar({
  user,
}: {
  user: any
  // onSelectChat: (chatPublicId: string) => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isHome = pathname === '/zone'

  return (
    <div className="w-80 h-full border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b font-bold">OpenChat</div>
      <AddFriend />

      {/* Home */}
      <div className="p-3 border-b">
        <button
          onClick={() => router.replace('/zone')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
            isHome ? 'bg-muted' : 'hover:bg-muted/50'
          )}
        >
          <Home className="h-4 w-4" />
          Home
        </button>
      </div>
      
      <FriendRequests />
      
      {/* Chats */}
      <div className="flex-1 overflow-y-auto">
        <ChatList />
      </div>

      {/* User */}
      <UserBar user={user} />
    </div>
  )
}

