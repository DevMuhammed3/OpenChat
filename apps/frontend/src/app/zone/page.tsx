'use client'

import { api } from '@openchat/lib'
import { useRouter } from 'next/navigation'
import { useChatsStore } from '../stores/chat-store'
// import FriendRequests from './friends/FriendRequests'
import FriendList from './friends/FriendList'
import { MailWarning } from 'lucide-react'
// import { Sheet, SheetContent, SheetTrigger, SheetTitle } from 'packages/ui'
import ZoneSidebar from './_components/ZoneSidebar'
// import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useEffect, useState } from 'react'
import { useAudioUnlock } from '@/hooks/useAudioUnlock'
import FriendsView from './friends/FriendsView'

export default function ZoneHome() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useAudioUnlock()

  useEffect(() => {
    let mounted = true

    api(`/auth/me?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        if (!data?.user) throw new Error()
        setUser(data.user)
      })
      .catch(() => {
        if (mounted) router.replace('/auth')
      })

    return () => {
      mounted = false
    }
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col h-full">

      {/* Email verification banner */}
      {!user.emailVerified && (
        <div className="
    bg-yellow-100 text-yellow-900
    px-4 py-3
    text-sm
    flex items-center justify-between
    border-b border-yellow-200
  ">
          <div className="flex items-center gap-2">
            <MailWarning className="w-4 h-4" />
            <span>
              Please verify your email to unlock all features
            </span>
          </div>

          <button
            onClick={() => router.push('/verify-email')}
            className="
        text-yellow-900
        font-medium
        underline underline-offset-2
        hover:text-yellow-700
      "
          >
            Verify now
          </button>
        </div>
      )}

      <FriendsView />

      <div className="flex-1 overflow-hidden">
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
      </div>

      <div className="p-4 text-center text-muted-foreground text-sm">
        Select a friend to start chatting
      </div>
    </div>
  )
}
