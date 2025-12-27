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

  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  hideChat: (id: string) => void
  showChat: (id: string) => void
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set) => ({
      chats: [],
      hiddenChats: [],
      chatsLoaded: false,

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
    }),
    {
      name: 'openchat-chats',
      partialize: (state) => ({
        hiddenChats: state.hiddenChats,
      }),
    }
  )
)

