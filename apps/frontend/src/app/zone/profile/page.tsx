'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Shield, Bell, Lock, LogOut, ChevronRight, User, LogOut as LogOutIcon, Heart, UserPlus, Users, MessageCircle } from 'lucide-react'
import { cn, getApiBaseUrl, getAvatarUrl } from '@openchat/lib'

interface UserProfile {
  id: string
  name: string
  username: string
  email: string
  avatar?: string | null
  emailVerified: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ friends: 0, zones: 0, messages: 0 })

  useEffect(() => {
    const apiUrl = getApiBaseUrl()
    const fetchUser = async () => {
      try {
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          
          // Fetch additional stats
          const [friendsRes, chatsRes] = await Promise.all([
            fetch(`${apiUrl}/friends`, { credentials: 'include' }),
            fetch(`${apiUrl}/chats`, { credentials: 'include' }),
          ])
          
          const friendsData = await friendsRes.json()
          const chatsData = await chatsRes.json()
          
          setStats({
            friends: (friendsData.friends || []).length,
            zones: 0, // Add zone count when API is available
            messages: (chatsData.chats || []).length,
          })
        }
      } catch (err) {
        console.error('Failed to fetch user', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const apiUrl = getApiBaseUrl()
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/auth')
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  const menuItems = [
    { icon: User, label: 'Edit Profile', href: '/settings/profile', color: 'text-blue-400' },
    { icon: Bell, label: 'Notifications', href: '/settings/notifications', color: 'text-yellow-400' },
    { icon: Lock, label: 'Privacy & Security', href: '/settings/privacy', color: 'text-green-400' },
    { icon: Shield, label: 'Account Safety', href: '/settings/security', color: 'text-purple-400' },
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0b1220]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0b1220] pb-4">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-24 bg-gradient-to-br from-primary/50 to-cyan-500/30" />
        <div className="px-4 pb-4">
          <div className="relative -mt-12 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-[#0b1220] overflow-hidden">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.[0]?.toUpperCase()
              )}
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{user?.name || user?.username}</h1>
              <p className="text-zinc-500">@{user?.username}</p>
              {!user?.emailVerified && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-amber-500/20 text-amber-500 text-xs font-medium rounded-full">
                  Email not verified
                </span>
              )}
            </div>
            <button 
              onClick={() => router.push('/settings/profile')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 px-4 py-4 border-y border-white/5">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-white">{stats.friends}</p>
          <p className="text-xs text-zinc-500">Friends</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-white">{stats.zones}</p>
          <p className="text-xs text-zinc-500">Zones</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-white">{stats.messages}</p>
          <p className="text-xs text-zinc-500">Messages</p>
        </div>
      </div>

      {/* Menu */}
      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center justify-between p-4 bg-[#1a1d23] rounded-xl hover:bg-[#22252b] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className={cn('w-5 h-5', item.color)} />
                </div>
                <span className="font-medium text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </button>
          )
        })}
      </div>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-xl transition-colors"
        >
          <LogOutIcon className="w-5 h-5" />
          Log Out
        </button>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-zinc-600">
        <p>OpenChat v1.0.0</p>
        <p className="flex items-center justify-center gap-1 mt-1">
          Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by the community
        </p>
      </div>
    </div>
  )
}
