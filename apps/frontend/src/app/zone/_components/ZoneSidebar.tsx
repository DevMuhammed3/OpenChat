'use client'

import { Home } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@openchat/lib'
import AddFriend from '../friends/AddFriend'
import FriendRequests from '../friends/FriendRequests'
import FriendList from '../friends/FriendList'
import UserBar from './UserBar'

export default function ZoneSidebar({
  user,
  onSelectFriend,
}: {
  user: any
  onSelectFriend?: (f: any) => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isHome = pathname === '/zone'

  return (
    <div className="w-80 h-full border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b font-bold">OpenChat</div>

      {/* Home button */}
      <div className="p-3 border-b">
        <button
          onClick={() => router.push('/zone')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isHome
              ? 'bg-muted text-foreground'
              : 'hover:bg-muted/50 text-muted-foreground'
          )}
        >
          <Home className="h-4 w-4" />
          Home
        </button>
      </div>

      {/* Friends */}
      <div className="flex-1 overflow-y-auto">
        <AddFriend />
        <FriendRequests />
        <FriendList onSelectFriend={onSelectFriend} />
      </div>

      {/* User */}
      <UserBar user={user} />
    </div>
  )
}

