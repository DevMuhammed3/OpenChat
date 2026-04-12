'use client'

import { cn } from '@openchat/lib'
import {
    type ChannelVoiceParticipant,
    useCallStore,
} from '@/app/stores/call-store'
import { MicOff, HeadphoneOff } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'

export default function VoiceParticipants({
    participants,
}: {
    participants: ChannelVoiceParticipant[]
}) {
    const speakingUsers = useCallStore((s) => s.speakingUsers)
    if (participants.length === 0) return null

    return (
        <div className="ml-9 mt-0.5 space-y-0.5 pb-2">
            {participants.map((participant) => {
                const isSpeaking = speakingUsers.has(participant.userId)

                return (
                    <div
                        key={participant.userId}
                        className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <div className="relative">
                            <UserAvatar
                                name={participant.username}
                                avatar={participant.avatar}
                                className={cn(
                                    'h-6 w-6 transition-all duration-200 ring-offset-2 ring-offset-background',
                                    isSpeaking
                                        ? 'ring-2 ring-emerald-500'
                                        : 'ring-0'
                                )}
                                fallbackText={participant.username}
                                fallbackClassName="bg-white/10 text-[10px] font-bold text-zinc-300"
                            />
                            {isSpeaking && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1e1f22] animate-pulse" />
                            )}
                        </div>
                        <span
                            className={cn(
                                'truncate text-[13px] font-medium transition-colors',
                                isSpeaking
                                    ? 'text-white'
                                    : 'text-zinc-400 group-hover:text-zinc-200'
                            )}
                        >
                            {participant.username}
                        </span>
                        <div className="ml-auto flex items-center gap-1 text-zinc-500">
                            {participant.isMuted && (
                                <MicOff className="h-3.5 w-3.5 text-red-400" />
                            )}
                            {participant.isSpeaker === false && (
                                <HeadphoneOff className="h-3.5 w-3.5 text-red-400" />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
