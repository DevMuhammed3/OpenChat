'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@openchat/lib'
import { Avatar, AvatarFallback, AvatarImage, Button, Skeleton } from 'packages/ui'

type InviteData = {
  code: string
  expiresAt?: string | null
  isMember: boolean
  zone: {
    publicId: string
    name: string
    avatar?: string | null
    memberCount: number
  }
}

export default function ZoneInvitePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const loadInvite = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api(`/zones/invites/${code}`)
        const data = await res.json()

        if (!res.ok || !data?.invite) {
          throw new Error(data?.message || 'Invite not found')
        }

        setInvite(data.invite)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite')
      } finally {
        setLoading(false)
      }
    }

    loadInvite()
  }, [code])

  const joinInvite = async () => {
    if (!code) return

    try {
      setJoining(true)
      const res = await api(`/zones/invites/${code}/join`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok || !data?.zone?.publicId) {
        throw new Error(data?.message || 'Failed to join invite')
      }

      window.location.assign(`/zone/zones/${data.zone.publicId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join invite')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111827] p-6 text-center shadow-2xl">
          <p className="text-lg font-semibold text-white">Invite not available</p>
          <p className="mt-2 text-sm text-zinc-400">{error || 'This invite is invalid or expired.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
          OpenChat Invite
        </p>

        <div className="mt-5 flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-1 ring-white/10">
            <AvatarImage src={invite.zone.avatar ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {invite.zone.name[0]?.toUpperCase() ?? 'Z'}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-white">{invite.zone.name}</h1>
            <p className="text-sm text-zinc-400">{invite.zone.memberCount} members</p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1 rounded-xl"
            onClick={() => {
              if (invite.isMember) {
                window.location.assign(`/zone/zones/${invite.zone.publicId}`)
                return
              }

              joinInvite()
            }}
            disabled={joining}
          >
            {invite.isMember ? 'Open Zone' : joining ? 'Joining...' : 'Join Zone'}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => router.push('/zone')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
