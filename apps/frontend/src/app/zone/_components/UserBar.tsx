'use client'

import { Avatar, AvatarFallback } from 'packages/ui'
import { Settings, LogOut, Mic, MicOff, Headphones } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getApiBaseUrl, getAvatarUrl, cn } from '@openchat/lib'
import { useUserStore } from '@/app/stores/user-store'
import { useState, useRef, useEffect } from 'react'
import { useCallStore } from '@/app/stores/call-store'
import { applyGlobalMuteToggle, toggleSpeakerOutput } from '@/app/lib/session-runtime'

type SidebarUser = {
  username: string
  name?: string | null
  avatar?: string | null
}

export default function UserBar({ user: serverUser }: { user: SidebarUser | null }) {
  const router = useRouter()
  const storeUser = useUserStore(s => s.user)
  const user = storeUser ?? serverUser
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isMuted = useCallStore(s => s.isMuted)
  const isSpeaker = useCallStore(s => s.isSpeaker)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      const apiUrl = getApiBaseUrl()
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      window.location.href = '/auth'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (!user) return null

  const avatarUrl = getAvatarUrl(user.avatar)

  return (
    <div className="relative border-t border-white/5 bg-background">
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 flex-1 min-w-0 p-1.5 rounded-md hover:bg-white/5 transition-colors group"
        >
          <div className="relative shrink-0">
            <Avatar className="w-8 h-8 rounded-full">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-white/10 text-white text-xs font-bold uppercase">
                  {user.username?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user.name || user.username}
            </p>
            <p className="text-[11px] text-zinc-500 truncate">
              Online
            </p>
          </div>
        </button>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => void applyGlobalMuteToggle()}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all",
              isMuted ? "text-red-400 hover:bg-red-400/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleSpeakerOutput}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all",
              !isSpeaker ? "text-red-400 hover:bg-red-400/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            title={!isSpeaker ? "Undeafen" : "Deafen"}
          >
            {!isSpeaker ? (
              <div className="relative">
                <Headphones className="w-4 h-4 text-red-400" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[2px] bg-red-400 rotate-45 rounded-full" />
              </div>
            ) : (
              <Headphones className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => router.push('/settings/profile')}
            className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-[#111214] rounded-lg border border-white/5 shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
        >
          <button
            onClick={() => {
              setShowMenu(false)
              router.push('/settings/profile')
            }}
            className="w-full px-3 py-2 text-left text-[13px] text-zinc-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Profile Settings
          </button>
          <div className="border-t border-white/5" />
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-[13px] text-red-400 hover:bg-white/5 flex items-center gap-3 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
