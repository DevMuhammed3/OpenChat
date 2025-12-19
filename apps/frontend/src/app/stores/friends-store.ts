import { create } from 'zustand'

export type User = {
  id: number
  username: string
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

  setFriends: (friends: Friend[]) => void
  setRequests: (requests: FriendRequest[]) => void

  addFriend: (friend: Friend) => void
  addRequest: (request: FriendRequest) => void
  removeRequest: (requestId: number) => void
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  requests: [],

  setFriends: (friends) => set({ friends }),
  setRequests: (requests) => set({ requests }),

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
}))

