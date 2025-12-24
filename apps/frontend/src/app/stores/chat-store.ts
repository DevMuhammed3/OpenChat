// stores/chats-store.ts
import { create } from 'zustand'

type Chat = any

export const useChatsStore = create<{
  chats: Chat[]
  hiddenChats: string[]

  setChats: (c: Chat[]) => void
  addChat: (c: Chat) => void

  hideChat: (id: string) => void
  showChat: (id: string) => void
}>(set => ({
  chats: [],
  hiddenChats: [],

  setChats: chats => set({ chats }),

  addChat: chat =>
    set(state => ({
      chats: [
        chat,
        ...state.chats.filter(c => c.chatPublicId !== chat.chatPublicId),
      ],
      hiddenChats: state.hiddenChats.filter(id => id !== chat.chatPublicId),
    })),

  hideChat: id =>
    set(state => ({
      hiddenChats: [...state.hiddenChats, id],
    })),

  showChat: id =>
    set(state => ({
      hiddenChats: state.hiddenChats.filter(c => c !== id),
    })),
}))

