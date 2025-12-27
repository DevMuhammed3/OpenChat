'use client'

import { useEffect } from 'react'
import { socket } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const addRequest = useFriendsStore(s => s.addRequest)
  const addFriend = useFriendsStore(s => s.addFriend)
  const removeRequest = useFriendsStore(s => s.removeRequest)

  useEffect(() => {
    if (!socket.connected) socket.connect()

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

  return <>{children}</>
}

