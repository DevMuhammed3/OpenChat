'use client'

import { Avatar, AvatarFallback, AvatarImage } from 'packages/ui'
import { getAvatarUrl } from '@openchat/lib'
import { type ChannelVoiceParticipant } from '@/app/stores/call-store'

export default function VoiceParticipants({
  participants,
  compact = false,
}: {
  participants: ChannelVoiceParticipant[]
  compact?: boolean
}) {
  if (participants.length === 0) {
    return (
      <div className="ml-8 pb-2 text-xs text-zinc-500 italic">
        No one is in voice yet
      </div>
    )
  }

  return (
    <div className="ml-8 space-y-1 pb-2">
      {participants.map((participant) => (
        <div
          key={participant.userId}
          className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1.5"
        >
          <Avatar className={compact ? "h-6 w-6" : "h-7 w-7"}>
            <AvatarImage src={getAvatarUrl(participant.avatar)} />
            <AvatarFallback className="bg-white/10 text-[10px] text-zinc-100">
              {participant.username[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-zinc-300">
            {participant.username}
          </span>
        </div>
      ))}
    </div>
  )
}
