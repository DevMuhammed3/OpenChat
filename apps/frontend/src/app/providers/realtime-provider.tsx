'use client'

import { useEffect } from 'react'
import { socket } from '@openchat/lib'
import { type BlockedUser, type Friend, type FriendRequest, useFriendsStore } from '@/app/stores/friends-store'
import { useUserStore } from '@/app/stores/user-store'
import { useChatsStore } from '@/app/stores/chat-store'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore(s => s.user)

  const addRequest = useFriendsStore(s => s.addRequest)
  const addFriend = useFriendsStore(s => s.addFriend)
  const removeFriend = useFriendsStore(s => s.removeFriend)
  const setFriends = useFriendsStore(s => s.setFriends)
  const addBlockedUser = useFriendsStore(s => s.addBlockedUser)
  const removeBlockedUser = useFriendsStore(s => s.removeBlockedUser)
  const removeRequest = useFriendsStore(s => s.removeRequest)
  const setOnline = useFriendsStore(s => s.setOnline)
  const setOffline = useFriendsStore(s => s.setOffline)
  const setBulkOnline = useFriendsStore(s => s.setBulkOnline)

  useEffect(() => {
    const handleFriendRequest = ({ request }: { request: FriendRequest }) => {
      addRequest(request)
    }

    const handleFriendAccepted = ({ friend }: { friend: Friend }) => {
      addFriend(friend)
    }

    const handleFriendRejected = ({ requestId }: { requestId: number }) => {
      removeRequest(requestId)
    }

    const handleFriendRemoved = ({ userId }: { userId: number }) => {
      removeFriend(userId)
    }

    const handleFriendsList = ({ friends }: { friends: Friend[] }) => {
      setFriends(friends)
    }

    const handleFriendBlocked = ({ user }: { user: BlockedUser }) => {
      addBlockedUser(user)
    }

    const handleFriendUnblocked = ({ userId }: { userId: number }) => {
      removeBlockedUser(userId)
    }

    const handlePrivateMessage = (msg: {
      chatPublicId: string
      channelPublicId?: string
      text?: string | null
      fileUrl?: string | null
      createdAt?: string
    }) => {
      const chatStore = useChatsStore.getState()
      chatStore.onIncomingMessage(msg.chatPublicId, msg.channelPublicId)

      const existingChat = chatStore.chats.find(c => c.chatPublicId === msg.chatPublicId)
      if (existingChat) {
        chatStore.addChat({
          ...existingChat,
          lastMessage: {
            text: msg.text || (msg.fileUrl ? 'Sent a file' : ''),
            createdAt: msg.createdAt || new Date().toISOString()
          }
        })
      }
    }

    const handleChatNotification = ({ chatPublicId, channelPublicId }: { chatPublicId: string; channelPublicId?: string }) => {
      useChatsStore.getState().onIncomingMessage(chatPublicId, channelPublicId)
    }

    const handleUserOnline = ({ userId }: { userId: number }) => {
      setOnline(userId)
    }

    const handleUserOffline = ({ userId }: { userId: number }) => {
      setOffline(userId)
    }

    const handleFriendsOnline = (userIds: number[]) => {
      setBulkOnline(userIds)
    }

    socket.on('friend:request', handleFriendRequest)
    socket.on('friend:accepted', handleFriendAccepted)
    socket.on('friend:rejected', handleFriendRejected)
    socket.on('friend:removed', handleFriendRemoved)
    socket.on('friends:list', handleFriendsList)
    socket.on('friend:blocked', handleFriendBlocked)
    socket.on('friend:unblocked', handleFriendUnblocked)
    socket.on('private-message', handlePrivateMessage)
    socket.on('chat-notification', handleChatNotification)
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)
    socket.on('friends:online', handleFriendsOnline)

    return () => {
      socket.off('friend:request', handleFriendRequest)
      socket.off('friend:accepted', handleFriendAccepted)
      socket.off('friend:rejected', handleFriendRejected)
      socket.off('friend:removed', handleFriendRemoved)
      socket.off('friends:list', handleFriendsList)
      socket.off('friend:blocked', handleFriendBlocked)
      socket.off('friend:unblocked', handleFriendUnblocked)
      socket.off('private-message', handlePrivateMessage)
      socket.off('chat-notification', handleChatNotification)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
      socket.off('friends:online', handleFriendsOnline)
    }
  }, [addBlockedUser, addFriend, addRequest, removeBlockedUser, removeFriend, removeRequest, setBulkOnline, setFriends, setOffline, setOnline])

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
