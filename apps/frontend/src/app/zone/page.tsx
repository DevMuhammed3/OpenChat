'use client'

import { api } from "@openchat/lib"
import FriendList from "./friends/FriendList"
import { useRouter } from "next/navigation"
import { useChatsStore } from "../stores/chat-store"

export default function ZoneHome() {
  const router = useRouter()

  return (
    <div className="w-full h-full border-b">
       <FriendList
onSelectFriend={async (friend) => {
  const res = await api('/chats/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ friendId: friend.id }),
  })

  const data = await res.json()

  useChatsStore.getState().addChat({
    chatPublicId: data.chatPublicId,
    participants: [friend],
    lastMessage: null,
  })

  router.push(`/zone/chat/${data.chatPublicId}`)
}}
  />

    <div className="flex items-center justify-center text-muted-foreground">
      Select a chat or start a new conversation
    </div>
   </div>
  )
}

