'use client'

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "packages/ui"

import FriendList from "./FriendList"
import AddFriend from "./AddFriend"
import FriendRequests from "./FriendRequests"
import BlockedUsers from "./BlockedUsers"

import { api } from "@openchat/lib"
import { useRouter } from "next/navigation"
import { useChatsStore } from "@/app/stores/chat-store"
import PendingRequests from "./PendingRequests"

export default function FriendsView() {

  const router = useRouter()

  return (

    <Tabs defaultValue="friends" className="flex flex-col h-full">

      {/* Top Tabs */}

      <div className="border-b border-white/5 px-4 py-3">

        <TabsList>

          <TabsTrigger value="friends">
            Friends
          </TabsTrigger>

          <TabsTrigger value="requests">
            Requests
          </TabsTrigger>

          <TabsTrigger value="pending">
            Pending
          </TabsTrigger>

          <TabsTrigger value="add">
            Add Friend
          </TabsTrigger>

          <TabsTrigger value="blocked">
            Blocked
          </TabsTrigger>


        </TabsList>

      </div>

      {/* Friends */}

      <TabsContent value="friends" className="flex-1 overflow-hidden">

        <FriendList
          onSelectFriend={async (friend) => {

            const res = await api('/chats/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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

      </TabsContent>

      {/* Incoming Requests */}

      <TabsContent value="requests" className="p-4">
        <FriendRequests />
      </TabsContent>

      {/* Sent Requests */}

      <TabsContent value="pending" className="p-4">
        <PendingRequests />
      </TabsContent>

      {/* Add Friend */}

      <TabsContent value="add" className="p-4">
        <AddFriend />
      </TabsContent>

      <TabsContent value="blocked" className="p-4">
        <BlockedUsers />
      </TabsContent>


    </Tabs>

  )
}
