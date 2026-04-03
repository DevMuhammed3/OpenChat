'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn, getAvatarUrl } from '@openchat/lib'
import Link from 'next/link'
import { Radiation } from 'lucide-react'

type MobileUser = {
  avatar?: string | null
}

interface MobileLayoutProps {
  user: MobileUser | null
  children: React.ReactNode
}

const MOBILE_TABS = [
  { id: 'home', label: 'Home', path: '/zone' },
  { id: 'messages', label: 'Messages', path: '/zone/chat' },
  { id: 'zones', label: 'Zones', path: '/zone/zones' },
  { id: 'profile', label: 'Profile', path: '/zone/profile' },
] as const

export default function MobileLayout({ user, children }: MobileLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const touchStartRef = useRef<{ x: number; y: number; interactive: boolean } | null>(null)

  const immersiveRoute = useMemo(
    () => /^\/zone\/chat\/[^/]+$/.test(pathname) || /^\/zone\/zones\/[^/]+\/channels\/[^/]+$/.test(pathname),
    [pathname]
  )

  const activeTab = useMemo(() => {
    if (pathname.includes('/chat')) return 'messages'
    if (pathname.includes('/zones')) return 'zones'
    if (pathname.includes('/profile')) return 'profile'
    return 'home'
  }, [pathname])

  useEffect(() => {
    MOBILE_TABS.forEach((tab) => {
      if (tab.path !== pathname) {
        router.prefetch(tab.path)
      }
    })
  }, [pathname, router])

  const handleTabClick = (_tabId: string, path: string) => {
    router.prefetch(path)
    router.push(path)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (immersiveRoute) return

    const target = event.target as HTMLElement | null
    const interactive = !!target?.closest('button, a, input, textarea, [role="button"], [data-no-swipe="true"]')
    const touch = event.touches[0]

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      interactive,
    }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (immersiveRoute || !touchStartRef.current || touchStartRef.current.interactive) {
      touchStartRef.current = null
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    touchStartRef.current = null

    if (Math.abs(deltaX) < 72 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      return
    }

    const currentIndex = MOBILE_TABS.findIndex((tab) => tab.id === activeTab)
    if (currentIndex === -1) return

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
    const nextTab = MOBILE_TABS[nextIndex]
    if (!nextTab) return

    handleTabClick(nextTab.id, nextTab.path)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background md:min-h-full">
      {/* Mobile Header */}
      {!immersiveRoute && (
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-[#0b1220] border-b border-white/5 z-40 shrink-0 safe-top">
        <Link href="/zone" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </div>
          <span className="font-bold text-white">OpenChat</span>
        </Link>
        <button 
          className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </header>
      )}

      <main
        className={cn(
          'flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain',
          immersiveRoute ? 'pb-0' : 'pb-[calc(5.25rem+env(safe-area-inset-bottom))]'
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </main>
      
      {/* Bottom Navigation */}
      {!immersiveRoute && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b1220]/95 backdrop-blur-xl border-t border-white/10 safe-bottom-nav">
        <div className="flex items-center justify-around h-16 px-2">
          {MOBILE_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 min-w-[64px] relative',
                  isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <TabIcon tabId={tab.id} isActive={isActive} user={user} />
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'font-semibold'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
      )}
    </div>
  )
}

function TabIcon({ tabId, isActive, user }: { tabId: string; isActive: boolean; user: MobileUser | null }) {
  switch (tabId) {
    case 'home':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'messages':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'zones':
      return <Radiation className="w-6 h-6" />
    case 'profile':
      return user?.avatar ? (
        <img
          src={getAvatarUrl(user.avatar)}
          alt="Profile"
          className={cn(
            'w-6 h-6 rounded-full object-cover',
            isActive && 'ring-2 ring-primary ring-offset-1 ring-offset-[#0b1220]'
          )}
        />
      ) : (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    default:
      return null
  }
}
