// stores/chats-store.ts
import { create } from 'zustand'

export const useChatsStore = create<{
  chats: any[]
  setChats: (c: any[]) => void
  addChat: (c: any) => void
}>(set => ({
  chats: [],
  setChats: chats => set({ chats }),
  addChat: chat =>
    set(state => ({
      chats: [chat, ...state.chats.filter(c => c.chatPublicId !== chat.chatPublicId)]
    })),
}))

