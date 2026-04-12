'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, cn } from '@openchat/lib'
import { User, Shield, Lock, Bell, Trash2, LogOut, ArrowLeft, Keyboard, Menu, X } from 'lucide-react'
import { useUserStore } from '@/app/stores/user-store'
import { useChatsStore } from '@/app/stores/chat-store'
import { useFriendsStore } from '@/app/stores/friends-store'
import { Button } from 'packages/ui'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from 'packages/ui'

const tabs = [
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Security', href: '/settings/security', icon: Shield },
  { name: 'Privacy', href: '/settings/privacy', icon: Lock },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Keyboard', href: '/settings/keyboard', icon: Keyboard },
  { name: 'Account', href: '/settings/account', icon: Trash2 },
]

function SettingsNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api(`/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }

    useUserStore.getState().clearUser()
    useChatsStore.getState().reset()
    useFriendsStore.getState().reset()

    window.location.href = '/auth'
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/zone')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>
      <div className="space-y-2 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href

          return (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                active
                  ? 'bg-primary/15 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon size={16} />
              {tab.name}
            </Link>
          )
        })}
      </div>
      <div className="h-px bg-border my-4" />
      <Button
        variant="destructive"
        onClick={handleLogout}
        className="flex justify-start gap-3 px-3 py-2 rounded-lg text-sm text-red-500 transition-all duration-200 hover:bg-red-500/10"
      >
        <LogOut size={16} />
        Logout
      </Button>
    </div>
  )
}

export default function SettingsSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="hidden md:flex fixed min-h-[100vh] w-64 bg-sidebar border-r">
        <SettingsNav />
      </div>

      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] bg-sidebar border-r">
            <SettingsNav onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}