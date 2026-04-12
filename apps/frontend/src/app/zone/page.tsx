'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatsStore } from '@/app/stores/chat-store'
import { useAudioUnlock } from '@/hooks/useAudioUnlock'
import { MailWarning, Search, Users, UserPlus, ShieldBan, Loader } from 'lucide-react'
import { cn } from '@openchat/lib'
import FriendList from './friends/FriendList'
import FriendRequests from './friends/FriendRequests'
import PendingRequests from './friends/PendingRequests'
import BlockedUsers from './friends/BlockedUsers'
import AddFriend from './friends/AddFriend'
import { useFriendsStore } from '@/app/stores/friends-store'
import { useStartDirectMessageMutation } from '@/features/chat/mutations'
import { useUser } from '@/features/user/queries'
import { VerifyEmailDialog } from '@/components/verify-email/VerifyEmailDialog'

export default function ZoneHome() {
  const router = useRouter()
  const { data: user, isLoading } = useUser()
  const startDirectMessageMutation = useStartDirectMessageMutation()
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'pending' | 'blocked' | 'add'>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [verifyEmailOpen, setVerifyEmailOpen] = useState(false)

  const requests = useFriendsStore(s => s.requests)
  const friends = useFriendsStore(s => s.friends)
  const pendingRequests = useFriendsStore(s => s.pendingRequests)
  const blockedUsers = useFriendsStore(s => s.blockedUsers)

  useAudioUnlock()

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* Email verification banner */}
      {user && !user.emailVerified && (
        <div className="bg-amber-500/10 text-amber-500 px-4 py-3 text-sm flex items-center justify-between border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-2">
            <MailWarning className="w-4 h-4" />
            <span>Please verify your email</span>
          </div>
          <button
            onClick={() => setVerifyEmailOpen(true)}
            className="font-medium hover:underline"
          >
            Verify now
          </button>
        </div>
      )}

      {/* Search */}
      <div className="p-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-4 shrink-0">
        <TabButton
          active={activeTab === 'friends'}
          onClick={() => setActiveTab('friends')}
          icon={<Users className="w-4 h-4" />}
          label="Friends"
          badge={friends.length}
        />
        <TabButton
          active={activeTab === 'requests'}
          onClick={() => setActiveTab('requests')}
          icon={<UserPlus className="w-4 h-4" />}
          label="Requests"
          badge={requests.length}
        />
        <TabButton
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          icon={<Loader className="w-4 h-4" />}
          label="Pending"
          badge={pendingRequests.length}
        />
        <TabButton
          active={activeTab === 'add'}
          onClick={() => setActiveTab('add')}
          icon={<UserPlus className="w-4 h-4" />}
          label="Add Friend"
        />
        <TabButton
          active={activeTab === 'blocked'}
          onClick={() => setActiveTab('blocked')}
          icon={<ShieldBan className="w-4 h-4" />}
          label="Blocked"
          badge={blockedUsers.length}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 md:pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <FriendList
                onSelectFriend={async (friend) => {
                  const chatPublicId = await startDirectMessageMutation.mutateAsync(friend.id)
                  useChatsStore.getState().upsertChat({
                    chatPublicId,
                    participants: [friend],
                    lastMessage: null,
                  }, { bump: true })
                  router.push(`/zone/chat/${chatPublicId}`)
                }}
              />
            )}
            {activeTab === 'requests' && <FriendRequests />}
            {activeTab === 'pending' && <PendingRequests />}
            {activeTab === 'add' && <AddFriend />}
            {activeTab === 'blocked' && <BlockedUsers />}
          </>
        )}
      </div>

      <VerifyEmailDialog open={verifyEmailOpen} onOpenChange={setVerifyEmailOpen} />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-xl text-[14px] font-semibold transition-all duration-200 relative',
        active
          ? 'bg-primary/20 text-white border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
          : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border border-transparent'
      )}
    >
      <span className={cn(
        "transition-transform duration-200",
        active ? "scale-110 text-primary" : "group-hover:scale-110 text-zinc-500"
      )}>
        {icon}
      </span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
           "px-2 py-0.5 rounded-md text-[10px] font-black transition-colors",
           active ? "bg-primary text-white" : "bg-white/10 text-zinc-400 group-hover:bg-white/20 group-hover:text-zinc-200"
        )}>
          {badge}
        </span>
      )}
    </button>
  )
}
