import { create } from "zustand"

export type User = {
  id: number
  name?: string | null
  username: string
  email: string
  emailVerified: boolean
  avatar?: string | null
  bio?: string | null
}

type UserStore = {
  user: User | null
  isLoaded: boolean

  setUser: (user: User | null) => void
  setLoaded: (value: boolean) => void
  updateUser: (data: Partial<User>) => void
  clearUser: () => void
  reset: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoaded: false,

  setUser: (user) =>
    set({
      user,
      isLoaded: true,
    }),

  setLoaded: (value) =>
    set((state) => ({
      ...state,
      isLoaded: value,
    })),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  clearUser: () =>
    set({
      user: null,
      isLoaded: true,
    }),

  reset: () =>
    set({
      user: null,
      isLoaded: false,
    }),
}))
