'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage, ScrollArea } from 'packages/ui'
import { useZoneMembers } from '@/features/zones/queries'
import { useFriendsStore } from '@/app/stores/friends-store'
import { cn } from '@openchat/lib'

export function MembersSidebar() {
  const params = useParams<{ zonePublicId?: string }>()
  const { data: members = [], isLoading } = useZoneMembers(params.zonePublicId)
  const onlineUsers = useFriendsStore((s) => s.onlineUsers)

  const { onlineMembers, offlineMembers } = useMemo(() => {
    const online = members.filter((m) => onlineUsers.has(m.id))
    const offline = members.filter((m) => !onlineUsers.has(m.id))
    return { onlineMembers: online, offlineMembers: offline }
  }, [members, onlineUsers])

  if (!params.zonePublicId) return null

  return (
    <div className="w-60 h-full bg-background border-l border-white/5 flex flex-col shrink-0">
      <div className="h-12 px-4 border-b border-white/5 flex items-center">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
          Members — {members.length}
        </h3>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {onlineMembers.length > 0 && (
              <div>
                <p className="px-2 mb-2 text-[11px] font-bold text-green-400 uppercase tracking-wide">
                  Online — {onlineMembers.length}
                </p>
                <div className="space-y-[2px]">
                  {onlineMembers.map((member) => (
                    <MemberItem
                      key={member.id}
                      member={member}
                      isOnline={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {offlineMembers.length > 0 && (
              <div>
                <p className="px-2 mb-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  Offline — {offlineMembers.length}
                </p>
                <div className="space-y-[2px]">
                  {offlineMembers.map((member) => (
                    <MemberItem
                      key={member.id}
                      member={member}
                      isOnline={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

interface MemberItemProps {
  member: {
    id: number
    username: string
    avatar?: string | null
    role: string
  }
  isOnline: boolean
}

function MemberItem({ member, isOnline }: MemberItemProps) {
  return (
    <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5 transition-colors group">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar ?? undefined} />
          <AvatarFallback className="bg-[hsl(var(--primary))] text-white text-xs">
            {member.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0f0f13]" />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={cn(
          "text-[15px] font-medium truncate",
          isOnline ? "text-white" : "text-white/50"
        )}>
          {member.username}
        </p>
      </div>
      {member.role === 'OWNER' && (
        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
          OWNER
        </span>
      )}
      {member.role === 'ADMIN' && (
        <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
          ADMIN
        </span>
      )}
    </button>
  )
}