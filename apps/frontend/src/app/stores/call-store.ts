import { create } from "zustand"

export type Status = "idle" | "calling" | "incoming" | "connecting" | "connected"

export interface CallUser {
  id: number
  name: string
  image?: string | null
}

interface CallStore {
  status: Status
  chatPublicId: string | null
  channelPublicId: string | null
  user: CallUser | null
  isCaller: boolean
  isMuted: boolean
  isSpeaker: boolean

  setCalling: (chatPublicId: string, user: CallUser) => void
  setIncoming: (chatPublicId: string, user: CallUser) => void
  setConnecting: () => void
  setConnected: () => void
  setChannelCall: (channelPublicId: string | null) => void
  toggleMuted: () => void
  toggleSpeaker: () => void
  clear: () => void
}

export const useCallStore = create<CallStore>((set) => ({
  status: "idle",
  chatPublicId: null,
  channelPublicId: null,
  user: null,
  isCaller: false,
  isMuted: false,
  isSpeaker: false,

  setCalling: (chatPublicId, user) =>
    set({ status: "calling", chatPublicId, user, isCaller: true }),

  setIncoming: (chatPublicId, user) =>
    set({ status: "incoming", chatPublicId, user, isCaller: false }),

  setConnecting: () => set({ status: "connecting" }),

  setConnected: () => set({ status: "connected" }),

  setChannelCall: (channelId) => set({ channelPublicId: channelId }),

  toggleMuted: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleSpeaker: () => set((state) => ({ isSpeaker: !state.isSpeaker })),

  clear: () =>
    set({
      status: "idle",
      chatPublicId: null,
      channelPublicId: null,
      user: null,
      isCaller: false,
      isMuted: false,
      isSpeaker: false,
    }),
}))
