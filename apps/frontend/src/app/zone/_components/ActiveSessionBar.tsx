'use client'

import { Button } from 'packages/ui'
import { Mic, MicOff, PhoneOff, Users } from 'lucide-react'
import { cn } from '@openchat/lib'
import { useCallStore } from '@/app/stores/call-store'
import { applyGlobalMuteToggle, endCallSession, endVoiceSession } from '@/app/lib/session-runtime'

export default function ActiveSessionBar({
  activeVoiceLabel,
  participantCount,
}: {
  activeVoiceLabel?: string
  participantCount?: number
}) {
  const session = useCallStore((s) => s.session)
  const user = useCallStore((s) => s.user)
  const isMuted = useCallStore((s) => s.isMuted)
  const participants = useCallStore((s) => s.channelParticipants)

  if (!session) return null

  const isCall = session.type === 'call'
  const title = isCall
    ? `In call with ${user?.name ?? 'Unknown'}`
    : activeVoiceLabel ?? 'Voice channel'

  const subtitle = isCall
    ? 'Private voice session'
    : `${participantCount ?? participants.length} ${(participantCount ?? participants.length) === 1 ? 'person' : 'people'} here`

  return (
    <div className="mx-2 mb-2 rounded-xl border border-emerald-500/10 bg-[#232428] p-2 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-500">
              {isCall ? 'Voice Call Active' : 'Voice Connected'}
            </span>
          </div>

          <span className="block truncate pl-3.5 text-[12px] font-bold text-white">
            {title}
          </span>

          <div className="flex items-center gap-1 pl-3.5 text-[10px] text-zinc-500">
            <Users size={10} />
            {subtitle}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void applyGlobalMuteToggle()}
            className={cn(
              'h-8 w-8 transition-all hover:bg-white/5',
              isMuted ? 'text-red-400 hover:text-red-300' : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => void (isCall ? endCallSession({ notifyServer: true }) : endVoiceSession())}
            className="h-8 w-8 text-red-500 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <PhoneOff size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
