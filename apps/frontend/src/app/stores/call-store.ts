import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Status = "idle" | "calling" | "incoming" | "connecting" | "connected"

export interface CallUser {
  id: number
  name: string
  image?: string | null
}

export interface ChannelVoiceParticipant {
  userId: number
  socketId: string
  username: string
  avatar?: string | null
}

interface CallStore {
  status: Status
  chatPublicId: string | null
  channelPublicId: string | null
  user: CallUser | null
  channelParticipants: ChannelVoiceParticipant[]
  isCaller: boolean
  isMuted: boolean
  isSpeaker: boolean

  setCalling: (chatPublicId: string, user: CallUser) => void
  setIncoming: (chatPublicId: string, user: CallUser) => void
  setConnecting: () => void
  setConnected: () => void
  setChannelCall: (channelPublicId: string | null) => void
  setChannelParticipants: (participants: ChannelVoiceParticipant[]) => void
  upsertChannelParticipant: (participant: ChannelVoiceParticipant) => void
  removeChannelParticipant: (userId: number) => void
  toggleMuted: () => void
  toggleSpeaker: () => void
  clear: () => void
}

export const useCallStore = create<CallStore>()(
  persist(
    (set) => ({
      status: "idle",
      chatPublicId: null,
      channelPublicId: null,
      user: null,
      channelParticipants: [],
      isCaller: false,
      isMuted: false,
      isSpeaker: false,

      setCalling: (chatPublicId, user) =>
        set({ status: "calling", chatPublicId, user, isCaller: true }),

      setIncoming: (chatPublicId, user) =>
        set({ status: "incoming", chatPublicId, user, isCaller: false }),

      setConnecting: () => set({ status: "connecting" }),

      setConnected: () => set({ status: "connected" }),

      setChannelCall: (channelId) => set({
        channelPublicId: channelId,
        channelParticipants: [],
      }),

      setChannelParticipants: (participants) => set({ channelParticipants: participants }),

      upsertChannelParticipant: (participant) =>
        set((state) => ({
          channelParticipants: state.channelParticipants.some((entry) => entry.userId === participant.userId)
            ? state.channelParticipants.map((entry) => entry.userId === participant.userId ? participant : entry)
            : [...state.channelParticipants, participant],
        })),

      removeChannelParticipant: (userId) =>
        set((state) => ({
          channelParticipants: state.channelParticipants.filter((entry) => entry.userId !== userId),
        })),

      toggleMuted: () => set((state) => ({ isMuted: !state.isMuted })),

      toggleSpeaker: () => set((state) => ({ isSpeaker: !state.isSpeaker })),

      clear: () =>
        set({
          status: "idle",
          chatPublicId: null,
          user: null,
          channelParticipants: [],
          isCaller: false,
          isMuted: false,
          isSpeaker: false,
        }),
    }),
    {
      name: "openchat-call-state",
      partialize: (state) => ({
        channelPublicId: state.channelPublicId,
        isMuted: state.isMuted,
      }),
    },
  ),
)
