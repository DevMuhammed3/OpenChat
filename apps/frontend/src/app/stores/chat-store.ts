import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Chat = {
  chatPublicId: string
  participants: Array<{
    id: number
    username: string
    avatar?: string | null
    name?: string | null
  }>
  type?: 'DM' | 'ZONE'
  name?: string | null
  avatar?: string | null
  channels?: {
    publicId: string
    name: string
    type: 'TEXT' | 'VOICE'
  }[]
  lastMessage?: {
    text: string
    createdAt: string
  } | null
}

type ChatsState = {
  chats: Chat[]
  hiddenChats: string[]
  chatsLoaded: boolean

  activeChatPublicId: string | null
  activeChannelPublicId: string | null
  unread: Record<string, number>
  channelUnread: Record<string, number>

  setActiveChat: (id: string | null) => void
  setActiveChannel: (id: string | null) => void
  markChatAsRead: (id: string) => void
  incrementUnread: (id: string, channelId?: string) => void
  clearUnread: (id: string, channelId?: string) => void
  onIncomingMessage: (chatPublicId: string, channelPublicId?: string) => void

  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  hideChat: (id: string) => void
  showChat: (id: string) => void

  reset: () => void
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set) => ({
      chats: [],
      hiddenChats: [],
      chatsLoaded: false,

      activeChatPublicId: null,
      activeChannelPublicId: null,
      unread: {},
      channelUnread: {},


      setActiveChat: (id) =>
        set({
          activeChatPublicId: id,
        }),

      setActiveChannel: (id) =>
        set({
          activeChannelPublicId: id,
        }),

      markChatAsRead: (id: string) =>
        set((state) => {
          const unread = { ...state.unread }
          delete unread[id]
          return { unread }
        }),

      incrementUnread: (id, channelId) =>
        set((state) => {
          if (state.activeChatPublicId === id && (!channelId || state.activeChannelPublicId === channelId)) {
            return state
          }

          if (channelId) {
            return {
              channelUnread: {
                ...state.channelUnread,
                [channelId]: (state.channelUnread[channelId] || 0) + 1,
              },
            }
          }

          return {
            unread: {
              ...state.unread,
              [id]: (state.unread[id] || 0) + 1,
            },
          }
        }),

      clearUnread: (id, channelId) =>
        set((state) => {
          if (channelId) {
            const channelUnread = { ...state.channelUnread }
            delete channelUnread[channelId]
            return { channelUnread }
          }
          const unread = { ...state.unread }
          delete unread[id]
          return { unread }
        }),


      onIncomingMessage: (chatPublicId: string, channelPublicId?: string) =>
        set((state) => {
          if (state.activeChatPublicId === chatPublicId) {
            if (channelPublicId && state.activeChannelPublicId !== channelPublicId) {
               return {
                  channelUnread: {
                    ...state.channelUnread,
                    [channelPublicId]: (state.channelUnread[channelPublicId] || 0) + 1,
                  },
               }
            }
            return state
          }

          return {
            unread: {
              ...state.unread,
              [chatPublicId]: (state.unread[chatPublicId] || 0) + 1,
            },
          }
        }),

      setChats: (chats) =>
        set({ chats, chatsLoaded: true }),

      addChat: (chat) =>
        set((state) => ({
          chats: [
            chat,
            ...state.chats.filter(
              (c) => c.chatPublicId !== chat.chatPublicId
            ),
          ],
          hiddenChats: state.hiddenChats.filter(
            (id) => id !== chat.chatPublicId
          ),
        })),

      hideChat: (id) =>
        set((state) =>
          state.hiddenChats.includes(id)
            ? state
            : { hiddenChats: [...state.hiddenChats, id] }
        ),

      showChat: (id) =>
        set((state) => ({
          hiddenChats: state.hiddenChats.filter((c) => c !== id),
        })),

      reset: () =>
        set({
          chats: [],
          hiddenChats: [],
          chatsLoaded: false,
          activeChatPublicId: null,
          activeChannelPublicId: null,
          unread: {},
          channelUnread: {},
        }),
    }),
    {
      name: 'openchat-chats',
      partialize: (state) => ({
        hiddenChats: state.hiddenChats,
        unread: state.unread,
        channelUnread: state.channelUnread,
      }),
    }
  )
)
