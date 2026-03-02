'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { api, cn } from '@openchat/lib'
import { User, Shield, Lock, Bell, Trash2, LogOut, ArrowLeft } from 'lucide-react'
import { useUserStore } from '@/app/stores/user-store'
import { useChatsStore } from '@/app/stores/chat-store'
import { useFriendsStore } from '@/app/stores/friends-store'

const tabs = [
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Security', href: '/settings/security', icon: Shield },
  { name: 'Privacy', href: '/settings/privacy', icon: Lock },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Account', href: '/settings/account', icon: Trash2 },
]

export default function SettingsSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await api(`/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    useUserStore.getState().clearUser()
    useChatsStore.getState().reset()
    useFriendsStore.getState().reset()

    router.replace('/auth')
    router.refresh()
  }

  return (
    <div className="w-64 bg-[#0a101c] border-r border-white/5 p-6 flex flex-col">
      <div className="mb-6">
        <button
          onClick={() => router.push('/zone')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
      {/* Tabs */}
      <div className="space-y-2 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                active
                  ? 'bg-primary/15 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={16} />
              {tab.name}
            </Link>
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-4" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
      >
        <LogOut size={16} />
        Logout
      </button>

    </div>
  )
}
