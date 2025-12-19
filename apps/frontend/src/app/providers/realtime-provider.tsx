'use client'

import { useEffect } from 'react'
import { socket, api } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const addRequest = useFriendsStore(s => s.addRequest)
  const addFriend = useFriendsStore(s => s.addFriend)

  useEffect(() => {
    console.log('RealtimeProvider mounted')

    if (!socket.connected) {
      socket.connect()
    }

    socket.on('connect', () => {
      console.log('socket connected', socket.id)
    })

    socket.on('friend-request-received', async ({ request }) => {
      addRequest(request)
    })

    socket.on('friend-added', async ({ friend }) => {
      addFriend(friend)
    })

    return () => {
      socket.off('connect')
      socket.off('friend-request-received')
      socket.off('friend-added')
    }
  }, [addRequest, addFriend])

  return <>{children}</>
}

