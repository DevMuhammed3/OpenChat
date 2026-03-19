import { create } from 'zustand'

export type User = {
  id: number
  username: string
  name?: string | null
  avatar?: string | null
}

export type Friend = User
export type BlockedUser = User & {
  blockedAt?: string
}

export type FriendRequest = {
  id: number
  from: User
  createdAt?: string
}

type FriendsState = {
  friends: Friend[]
  blockedUsers: BlockedUser[]
  requests: FriendRequest[]

  friendsLoaded: boolean
  blockedUsersLoaded: boolean
  requestsLoaded: boolean

  setFriends: (friends: Friend[]) => void
  setBlockedUsers: (users: BlockedUser[]) => void
  setRequests: (requests: FriendRequest[]) => void

  addFriend: (friend: Friend) => void
  removeFriend: (userId: number) => void
  addBlockedUser: (user: BlockedUser) => void
  removeBlockedUser: (userId: number) => void
  addRequest: (request: FriendRequest) => void
  removeRequest: (requestId: number) => void

  onlineUsers: Set<number>
  setOnline: (userId: number) => void
  setOffline: (userId: number) => void
  setBulkOnline: (userIds: number[]) => void

  reset: () => void
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  blockedUsers: [],
  requests: [],

  friendsLoaded: false,
  blockedUsersLoaded: false,
  requestsLoaded: false,

  setFriends: (friends) =>
    set({ friends, friendsLoaded: true }),

  setBlockedUsers: (blockedUsers) =>
    set({ blockedUsers, blockedUsersLoaded: true }),

  setRequests: (requests) =>
    set({ requests, requestsLoaded: true }),

  addFriend: (friend) =>
    set((state) =>
      state.friends.some((f) => f.id === friend.id)
        ? state
        : { friends: [...state.friends, friend] }
    ),

  removeFriend: (userId) =>
    set((state) => ({
      friends: state.friends.filter((friend) => friend.id !== userId),
      onlineUsers: (() => {
        const next = new Set(state.onlineUsers)
        next.delete(userId)
        return next
      })(),
    })),

  addBlockedUser: (user) =>
    set((state) => ({
      blockedUsers: state.blockedUsers.some((item) => item.id === user.id)
        ? state.blockedUsers.map((item) => (item.id === user.id ? user : item))
        : [user, ...state.blockedUsers],
      blockedUsersLoaded: true,
      friends: state.friends.filter((friend) => friend.id !== user.id),
      onlineUsers: (() => {
        const next = new Set(state.onlineUsers)
        next.delete(user.id)
        return next
      })(),
    })),

  removeBlockedUser: (userId) =>
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((user) => user.id !== userId),
    })),

  addRequest: (request) =>
    set((state) =>
      state.requests.some((r) => r.id === request.id)
        ? state
        : { requests: [...state.requests, request] }
    ),

  removeRequest: (requestId) =>
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== requestId),
    })),

  onlineUsers: new Set<number>(),
  setOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.add(userId)
      return { onlineUsers: next }
    }),
  setOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.delete(userId)
      return { onlineUsers: next }
    }),
  setBulkOnline: (userIds) =>
    set(() => ({ onlineUsers: new Set(userIds) })),

  reset: () =>
    set({
      friends: [],
      blockedUsers: [],
      requests: [],
      friendsLoaded: false,
      blockedUsersLoaded: false,
      requestsLoaded: false,
      onlineUsers: new Set<number>(),
    }),
}))
