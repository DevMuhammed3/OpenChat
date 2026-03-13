'use client'

import { useEffect } from 'react'
import { socket } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'
import { useUserStore } from '@/app/stores/user-store'
import { useChatsStore } from '@/app/stores/chat-store'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore(s => s.user)

  const addRequest = useFriendsStore(s => s.addRequest)
  const addFriend = useFriendsStore(s => s.addFriend)
  const removeRequest = useFriendsStore(s => s.removeRequest)
  const setOnline = useFriendsStore(s => s.setOnline)
  const setOffline = useFriendsStore(s => s.setOffline)
  const setBulkOnline = useFriendsStore(s => s.setBulkOnline)

  const onIncomingMessage = useChatsStore(s => s.onIncomingMessage)
  const addChat = useChatsStore(s => s.addChat)
  const chats = useChatsStore(s => s.chats)

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

    socket.on('private-message', (msg) => {
      onIncomingMessage(msg.chatPublicId, msg.channelPublicId)
      
      // Update chat list to move this chat to top and update last message preview
      const existingChat = chats.find(c => c.chatPublicId === msg.chatPublicId)
      if (existingChat) {
        addChat({
          ...existingChat,
          lastMessage: {
            text: msg.text || (msg.fileUrl ? 'Sent a file' : ''),
            createdAt: msg.createdAt || new Date().toISOString()
          }
        })
      }
    })

    socket.on('chat-notification', ({ chatPublicId, channelPublicId }) => {
      onIncomingMessage(chatPublicId, channelPublicId)
    })

    socket.on('user:online', ({ userId }) => {
      setOnline(userId)
    })

    socket.on('user:offline', ({ userId }) => {
      setOffline(userId)
    })

    socket.on('friends:online', (userIds) => {
      setBulkOnline(userIds)
    })

    return () => {
      socket.off('friend:request')
      socket.off('friend:accepted')
      socket.off('friend:rejected')
      socket.off('private-message')
      socket.off('chat-notification')
      socket.off('user:online')
      socket.off('user:offline')
      socket.off('friends:online')
    }
  }, [addRequest, addFriend, removeRequest, onIncomingMessage, addChat, chats, setOnline, setOffline, setBulkOnline])

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
