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
  isMuted?: boolean
  isSpeaker?: boolean
}

export type Session =
  | null
  | {
      type: "call" | "voice"
      id: string
      participants: string[]
    }

interface CallStore {
  session: Session
  status: Status
  chatPublicId: string | null
  channelPublicId: string | null
  user: CallUser | null
  startedAt: number | null
  channelParticipants: ChannelVoiceParticipant[]
  isCaller: boolean
  isMuted: boolean
  isSpeaker: boolean

  setCalling: (chatPublicId: string, user: CallUser) => void
  setIncoming: (chatPublicId: string, user: CallUser) => void
  setConnecting: () => void
  setConnected: (startedAt?: number | null) => void
  setChannelCall: (channelPublicId: string | null) => void
  setSessionParticipants: (participants: string[]) => void
  setChannelParticipants: (participants: ChannelVoiceParticipant[]) => void
  upsertChannelParticipant: (participant: ChannelVoiceParticipant) => void
  removeChannelParticipant: (userId: number) => void
  toggleMuted: () => void
  setMuted: (muted: boolean) => void
  toggleSpeaker: () => void
  setSpeaker: (speakerEnabled: boolean) => void
  speakingUsers: Set<number>
  setSpeaking: (userId: number, isSpeaking: boolean) => void
  clearVoiceSession: () => void
  clear: () => void
}

export const useCallStore = create<CallStore>()(
  persist(
    (set) => ({
      session: null,
      status: "idle",
      chatPublicId: null,
      channelPublicId: null,
      user: null,
      startedAt: null,
      channelParticipants: [],
      isCaller: false,
      isMuted: false,
      isSpeaker: true,
      speakingUsers: new Set(),

      setCalling: (chatPublicId, user) =>
        set({ status: "calling", chatPublicId, user, isCaller: true, startedAt: null }),

      setIncoming: (chatPublicId, user) =>
        set({ status: "incoming", chatPublicId, user, isCaller: false, startedAt: null }),

      setConnecting: () => set({ status: "connecting" }),

      setConnected: (startedAt) =>
        set((state) => ({
          session: state.chatPublicId
            ? {
                type: "call",
                id: state.chatPublicId,
                participants: state.user?.name ? [state.user.name] : [],
              }
            : state.session,
          status: "connected",
          startedAt: startedAt ?? state.startedAt ?? Date.now(),
        })),

      setChannelCall: (channelId) =>
        set((state) => ({
          session: channelId
            ? {
                type: "voice",
                id: channelId,
                participants: state.channelParticipants.map((participant) => participant.username),
              }
            : state.session?.type === "voice"
              ? null
              : state.session,
          channelPublicId: channelId,
          channelParticipants: [],
        })),

      setSessionParticipants: (participants) =>
        set((state) => ({
          session: state.session ? { ...state.session, participants } : null,
        })),

      setChannelParticipants: (participants) =>
        set((state) => ({
          channelParticipants: participants,
          session: state.session?.type === "voice"
            ? {
                ...state.session,
                participants: participants.map((participant) => participant.username),
              }
            : state.session,
        })),

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
      setMuted: (muted) => set({ isMuted: muted }),

      toggleSpeaker: () => set((state) => ({ isSpeaker: !state.isSpeaker })),
      setSpeaker: (speakerEnabled) => set({ isSpeaker: speakerEnabled }),

      setSpeaking: (userId, isSpeaking) => set((state) => {
        const next = new Set(state.speakingUsers)
        if (isSpeaking) next.add(userId)
        else next.delete(userId)
        return { speakingUsers: next }
      }),

      clearVoiceSession: () =>
        set((state) => ({
          session: state.session?.type === "voice" ? null : state.session,
          channelPublicId: null,
          channelParticipants: [],
          speakingUsers: new Set(),
        })),

      clear: () =>
        set({
          session: null,
          status: "idle",
          chatPublicId: null,
          channelPublicId: null,
          user: null,
          startedAt: null,
          channelParticipants: [],
          isCaller: false,
          isMuted: false,
          isSpeaker: true,
          speakingUsers: new Set(),
        }),
    }),
    {
      name: "openchat-call-state",
      partialize: (state) => ({
        isMuted: state.isMuted,
        isSpeaker: state.isSpeaker,
        channelPublicId: state.channelPublicId,
      }),
    },
  ),
)
