import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Chat = {
  chatPublicId: string
  participants: any[]
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
  unread: Record<string, number>

  setActiveChat: (id: string | null) => void
  markChatAsRead: (id: string) => void
  incrementUnread: (id: string) => void
  clearUnread: (id: string) => void
  onIncomingMessage: (chatPublicId: string) => void

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
      unread: {},


      setActiveChat: (id) =>
        set({
          activeChatPublicId: id,
        }),

      markChatAsRead: (id: string) =>
        set((state) => {
          const unread = { ...state.unread }
          delete unread[id]
          return { unread }
        }),

      incrementUnread: (id) =>
        set((state) => {
          if (state.activeChatPublicId === id) {
            return state
          }

          return {
            unread: {
              ...state.unread,
              [id]: (state.unread[id] || 0) + 1,
            },
          }
        }),

      clearUnread: (id) =>
        set((state) => {
          const unread = { ...state.unread }
          delete unread[id]
          return { unread }
        }),


      onIncomingMessage: (chatPublicId: string) =>
        set((state) => {
          if (state.activeChatPublicId === chatPublicId) {
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
          unread: {},
        }),
    }),
    {
      name: 'openchat-chats',
      partialize: (state) => ({
        hiddenChats: state.hiddenChats,
      }),
    }
  )
)

