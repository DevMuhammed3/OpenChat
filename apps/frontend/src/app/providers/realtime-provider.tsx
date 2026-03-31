'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from '@openchat/lib'
import {
  type BlockedUser,
  type Friend,
  type FriendRequest,
  type PendingFriendRequest,
  useFriendsStore,
} from '@/app/stores/friends-store'
import { useChatsStore } from '@/app/stores/chat-store'
import { mergeMessage, messageKeys } from '@/features/chat/queries'
import type { ChannelMessage } from '@/features/chat/types'
import { channelKeys } from '@/features/channels/queries'
import { useUser } from '@/features/user/queries'
import { zoneKeys } from '@/features/zones/queries'
import type { ZoneMember, ZoneSummary } from '@/features/zones/types'
import { apiClient } from '@/lib/api/client'

type BootstrapIncomingRequest = {
  id: number
  createdAt?: string
  from?: FriendRequest["from"]
  sender?: FriendRequest["from"]
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user } = useUser()

  const addRequest = useFriendsStore(s => s.addRequest)
  const addFriend = useFriendsStore(s => s.addFriend)
  const removeFriend = useFriendsStore(s => s.removeFriend)
  const setFriends = useFriendsStore(s => s.setFriends)
  const addBlockedUser = useFriendsStore(s => s.addBlockedUser)
  const removeBlockedUser = useFriendsStore(s => s.removeBlockedUser)
  const removeRequest = useFriendsStore(s => s.removeRequest)
  const removePendingRequestForUser = useFriendsStore(s => s.removePendingRequestForUser)
  const setOnline = useFriendsStore(s => s.setOnline)
  const setOffline = useFriendsStore(s => s.setOffline)
  const setBulkOnline = useFriendsStore(s => s.setBulkOnline)
  const setRequests = useFriendsStore(s => s.setRequests)
  const setPendingRequests = useFriendsStore(s => s.setPendingRequests)
  const setBlockedUsers = useFriendsStore(s => s.setBlockedUsers)
  const reset = useFriendsStore(s => s.reset)

  useEffect(() => {
    const handleFriendRequest = ({ request }: { request: FriendRequest }) => {
      addRequest(request)
    }

    const handleFriendAccepted = ({ friend }: { friend: Friend }) => {
      addFriend(friend)
      removePendingRequestForUser(friend.id)
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

    const handleFriendRequestsList = ({ requests }: { requests: FriendRequest[] }) => {
      setRequests(requests)
    }

    const handleFriendPendingList = ({ requests }: { requests: PendingFriendRequest[] }) => {
      setPendingRequests(requests)
    }

    const handleFriendBlockedList = ({ blocked }: { blocked: BlockedUser[] }) => {
      setBlockedUsers(blocked)
    }

    const handlePrivateMessage = (msg: ChannelMessage & {
      chatPublicId: string
      channelPublicId?: string
      text?: string | null
      fileUrl?: string | null
      createdAt?: string
    }) => {
      const chatStore = useChatsStore.getState()

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

      if (msg.channelPublicId) {
        queryClient.setQueryData<ChannelMessage[]>(
          messageKeys.list(msg.chatPublicId, msg.channelPublicId),
          (current = []) => mergeMessage(current, msg),
        )
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

    const handleZoneUpdated = ({ zone }: { zone: ZoneSummary }) => {
      queryClient.setQueryData<ZoneSummary[]>(zoneKeys.list(), (current = []) => {
        const hasZone = current.some((item) => item.publicId === zone.publicId)

        if (!hasZone) {
          return current
        }

        return current.map((item) => (item.publicId === zone.publicId ? { ...item, ...zone } : item))
      })
    }

    const handleZoneMembersUpdated = ({
      chatPublicId,
      members,
    }: {
      chatPublicId: string
      members: ZoneMember[]
    }) => {
      queryClient.setQueryData(zoneKeys.members(chatPublicId), members)
    }

    const handleZoneChannelsUpdated = ({ chatPublicId }: { chatPublicId: string }) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.list(chatPublicId) })
    }

    socket.on('friend:request', handleFriendRequest)
    socket.on('friend:accepted', handleFriendAccepted)
    socket.on('friend:rejected', handleFriendRejected)
    socket.on('friend:removed', handleFriendRemoved)
    socket.on('friends:list', handleFriendsList)
    socket.on('friend:blocked', handleFriendBlocked)
    socket.on('friend:unblocked', handleFriendUnblocked)
    socket.on('friend:requests:list', handleFriendRequestsList)
    socket.on('friend:pending:list', handleFriendPendingList)
    socket.on('friend:blocked:list', handleFriendBlockedList)
    socket.on('private-message', handlePrivateMessage)
    socket.on('chat-notification', handleChatNotification)
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)
    socket.on('friends:online', handleFriendsOnline)
    socket.on('zone:updated', handleZoneUpdated)
    socket.on('zone:members-updated', handleZoneMembersUpdated)
    socket.on('zone:channels-updated', handleZoneChannelsUpdated)

    return () => {
      socket.off('friend:request', handleFriendRequest)
      socket.off('friend:accepted', handleFriendAccepted)
      socket.off('friend:rejected', handleFriendRejected)
      socket.off('friend:removed', handleFriendRemoved)
      socket.off('friends:list', handleFriendsList)
      socket.off('friend:blocked', handleFriendBlocked)
      socket.off('friend:unblocked', handleFriendUnblocked)
      socket.off('friend:requests:list', handleFriendRequestsList)
      socket.off('friend:pending:list', handleFriendPendingList)
      socket.off('friend:blocked:list', handleFriendBlockedList)
      socket.off('private-message', handlePrivateMessage)
      socket.off('chat-notification', handleChatNotification)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
      socket.off('friends:online', handleFriendsOnline)
      socket.off('zone:updated', handleZoneUpdated)
      socket.off('zone:members-updated', handleZoneMembersUpdated)
      socket.off('zone:channels-updated', handleZoneChannelsUpdated)
    }
  }, [
    addBlockedUser,
    addFriend,
    addRequest,
    removeBlockedUser,
    removeFriend,
    removePendingRequestForUser,
    removeRequest,
    setBlockedUsers,
    setBulkOnline,
    setFriends,
    setOffline,
    setOnline,
    setPendingRequests,
    setRequests,
    queryClient,
  ])

  useEffect(() => {
    if (user && !socket.connected) {
      socket.connect()
    }

    if (!user && socket.connected) {
      socket.disconnect()
      reset()
    }
  }, [reset, user])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const bootstrap = async () => {
      try {
        const [friendsRes, requestsRes, pendingRes, blockedRes] = await Promise.all([
          apiClient.get<{ friends: Friend[] }>('/friends/list'),
          apiClient.get<{ requests: FriendRequest[] }>('/friends/requests'),
          apiClient.get<{ requests: PendingFriendRequest[] }>('/friends/pending'),
          apiClient.get<{ blocked: BlockedUser[] }>('/friends/blocked'),
        ])

        const friendsData = friendsRes ?? { friends: [] }
        const requestsData = requestsRes ?? { requests: [] }
        const pendingData = pendingRes ?? { requests: [] }
        const blockedData = blockedRes ?? { blocked: [] }

        if (cancelled) return

        setFriends(friendsData.friends ?? [])
        setRequests(
          (requestsData.requests ?? []).flatMap((request: BootstrapIncomingRequest) => {
            const from = request.from ?? request.sender

            if (!from) {
              return []
            }

            return [{
              id: request.id,
              from,
              createdAt: request.createdAt,
            }]
          }),
        )
        setPendingRequests(pendingData.requests ?? [])
        setBlockedUsers(blockedData.blocked ?? [])
      } catch {
        // Socket events will resync when available.
      }
    }

    bootstrap()

    const heartbeat = window.setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:heartbeat')
      }
    }, 20000)

    return () => {
      cancelled = true
      window.clearInterval(heartbeat)
    }
  }, [setBlockedUsers, setFriends, setPendingRequests, setRequests, user])

  return <>{children}</>
}
