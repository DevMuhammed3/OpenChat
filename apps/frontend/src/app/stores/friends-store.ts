import { create } from 'zustand'

export type User = {
  id: number
  username: string
  name?: string | null
  avatar?: string | null
}

export type Friend = User

export type FriendRequest = {
  id: number
  from: User
  createdAt?: string
}

type FriendsState = {
  friends: Friend[]
  requests: FriendRequest[]

  friendsLoaded: boolean
  requestsLoaded: boolean

  setFriends: (friends: Friend[]) => void
  setRequests: (requests: FriendRequest[]) => void

  addFriend: (friend: Friend) => void
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
  requests: [],

  friendsLoaded: false,
  requestsLoaded: false,

  setFriends: (newFriends) =>
    set((state) => {
      const map = new Map(state.friends.map((f) => [f.id, f]))

      newFriends.forEach((f) => {
        map.set(f.id, f)
      })

      return {
        friends: Array.from(map.values()),
        friendsLoaded: true,
      }
    }),

  setRequests: (requests) =>
    set({ requests, requestsLoaded: true }),

  addFriend: (friend) =>
    set((state) =>
      state.friends.some((f) => f.id === friend.id)
        ? state
        : { friends: [...state.friends, friend] }
    ),

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
      requests: [],
      friendsLoaded: false,
      requestsLoaded: false,
      onlineUsers: new Set<number>(),
    }),
}))
