'use client'

import { useEffect } from 'react'
import { socket } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'
import { useUserStore } from '@/app/stores/user-store'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore(s => s.user)

  const addRequest = useFriendsStore(s => s.addRequest)
  const addFriend = useFriendsStore(s => s.addFriend)
  const removeRequest = useFriendsStore(s => s.removeRequest)

  useEffect(() => {
    socket.on('friend:request', ({ request }) => {
      addRequest(request)
    })

    socket.on('friend:accepted', ({ friend }) => {
      addFriend(friend)
    })

    socket.on('friend:rejected', ({ requestId }) => {
      removeRequest(requestId)
    })

    return () => {
      socket.off('friend:request')
      socket.off('friend:accepted')
      socket.off('friend:rejected')
    }
  }, [addRequest, addFriend, removeRequest])

  useEffect(() => {
    if (user && !socket.connected) {
      socket.connect()
    }

    if (!user && socket.connected) {
      socket.disconnect()
    }
  }, [user])

  return <>{children}</>
}
