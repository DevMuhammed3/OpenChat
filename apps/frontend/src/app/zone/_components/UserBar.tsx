'use client'

import { Avatar, AvatarFallback, Button } from 'packages/ui'
import { LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { api, getAvatarUrl } from '@openchat/lib'
import { useChatsStore } from '@/app/stores/chat-store'
import { useFriendsStore } from '@/app/stores/friends-store'
import { useUserStore } from '@/app/stores/user-store'
import { useState } from 'react'

export default function UserBar({ user: serverUser }: { user: any }) {
  const storeUser = useUserStore(s => s.user)

  const user = storeUser ?? serverUser

  if (!user) return null
  const router = useRouter()


  // const { user, isLoaded } = useUserStore()

  // if (!isLoaded) {
  //   return (
  //     <div className="border-t p-4 flex items-center gap-3">
  //       <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
  //       <div className="h-4 w-24 bg-muted rounded animate-pulse" />
  //     </div>
  //   )
  // }
  //
  // if (!user) return null

  const avatarUrl = getAvatarUrl(user.avatar)
  return (
    <div className="border-t p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.username}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <button
          onClick={() => {
            navigator.clipboard.writeText(user.username)
            toast.success('Copied', {
              description: `@${user.username}`,
              duration: 1500,
            })
          }}
          className="text-sm font-medium hover:underline"
        >
          @{user.username}
        </button>
      </div>
      <div className='flex justify-center'>

        <Button
          size="icon"
          variant="destructive"
          onClick={() => router.push("/settings/profile")}
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="destructive"
          onClick={async () => {
            await api(`/auth/logout`, {
              method: 'POST',
              credentials: 'include',
            })
            useUserStore.getState().reset()
            useChatsStore.getState().reset()
            useFriendsStore.getState().reset()
            router.replace('/auth')
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

