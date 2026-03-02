import { create } from "zustand"

type Status = "idle" | "calling" | "incoming" | "connected"

interface CallUser {
  id: number
  name: string
  image?: string
}

interface CallStore {
  status: Status
  chatPublicId: string | null
  user: CallUser | null

  setCalling: (chatPublicId: string, user: CallUser) => void
  setIncoming: (chatPublicId: string, user: CallUser) => void
  setConnected: () => void
  clear: () => void
}

export const useCallStore = create<CallStore>((set) => ({
  status: "idle",
  chatPublicId: null,
  user: null,

  setCalling: (chatPublicId, user) =>
    set({
      status: "calling",
      chatPublicId,
      user,
    }),

  setIncoming: (chatPublicId, user) =>
    set({
      status: "incoming",
      chatPublicId,
      user,
    }),

  setConnected: () =>
    set({ status: "connected" }),

  clear: () =>
    set({
      status: "idle",
      chatPublicId: null,
      user: null,
    }),
}))
