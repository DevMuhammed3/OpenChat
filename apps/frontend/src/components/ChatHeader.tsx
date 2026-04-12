'use client'

import { memo, useMemo, type ReactNode } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { PhoneCall, Video, MoreVertical } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'packages/ui'
import { cn } from '@openchat/lib'
import { UserAvatar } from '@/components/UserAvatar'

export type ChatHeaderUser = {
  id: string | number
  name: string
  avatar?: string | null
  isOnline?: boolean
  lastSeen?: string // ISO date
}

export type ChatHeaderProps = {
  user: ChatHeaderUser
  leading?: ReactNode
  center?: ReactNode
  trailing?: ReactNode
  moreMenu?: ReactNode

  onCall?: () => void
  onVideo?: () => void

  callDisabled?: boolean
  videoDisabled?: boolean
  moreDisabled?: boolean

  className?: string
}

function formatLastSeen(lastSeen?: string) {
  if (!lastSeen) return null
  const date = new Date(lastSeen)
  if (Number.isNaN(date.getTime())) return null
  return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`
}

function ChatHeaderImpl({
  user,
  leading,
  center,
  trailing,
  moreMenu,
  onCall,
  onVideo,
  callDisabled,
  videoDisabled,
  moreDisabled,
  className,
}: ChatHeaderProps) {
  const name = user.name?.trim() || 'User'

  const status = useMemo(() => {
    if (user.isOnline === true) return { type: 'online' as const, text: 'Online' }
    const lastSeen = formatLastSeen(user.lastSeen)
    if (lastSeen) return { type: 'lastSeen' as const, text: lastSeen }
    return null
  }, [user.isOnline, user.lastSeen])

  return (
    <div
      className={cn(
        'sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background gap-3',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {leading}

        <UserAvatar
          name={name}
          avatar={user.avatar}
          className="w-10 h-10"
          fallbackClassName="bg-primary/20 text-primary font-bold"
        />

        <div className="flex flex-col min-w-0">
          <span className="font-semibold truncate max-w-[220px] sm:max-w-[320px]">
            {name}
          </span>

          {status?.type === 'online' ? (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
              {status.text}
            </span>
          ) : status?.type === 'lastSeen' ? (
            <span className="text-xs text-muted-foreground">{status.text}</span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-center">{center}</div>

      <div className="flex items-center gap-2 shrink-0">
        {trailing}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label="Call"
          onClick={onCall}
          disabled={callDisabled || !onCall}
        >
          <PhoneCall className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label="Video call"
          onClick={onVideo}
          disabled={videoDisabled || !onVideo}
        >
          <Video className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              aria-label="More options"
              disabled={moreDisabled || !moreMenu}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          {moreMenu ? <DropdownMenuContent align="end" className="w-44">{moreMenu}</DropdownMenuContent> : null}
        </DropdownMenu>
      </div>
    </div>
  )
}

export const ChatHeader = memo(ChatHeaderImpl)
