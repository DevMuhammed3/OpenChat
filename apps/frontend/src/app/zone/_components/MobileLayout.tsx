'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@openchat/lib'
import Link from 'next/link'

interface MobileLayoutProps {
  user: any
  children: React.ReactNode
}

export default function MobileLayout({ user, children }: MobileLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    if (pathname.includes('/chat')) setActiveTab('messages')
    else if (pathname.includes('/explore')) setActiveTab('explore')
    else if (pathname.includes('/profile')) setActiveTab('profile')
    else setActiveTab('home')
  }, [pathname])

  const tabs = [
    { id: 'home', label: 'Home', path: '/zone' },
    { id: 'messages', label: 'Messages', path: '/zone/chat' },
    { id: 'explore', label: 'Explore', path: '/zone/explore' },
    { id: 'profile', label: 'Profile', path: '/zone/profile' },
  ]

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId)
    router.push(path)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-[#0b1220] border-b border-white/5 z-40 shrink-0">
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

      <main className="flex-1 overflow-y-auto overflow-x-hidden md:pb-0 pb-16">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b1220]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
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
    </div>
  )
}

function TabIcon({ tabId, isActive, user }: { tabId: string; isActive: boolean; user: any }) {
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
    case 'explore':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    case 'profile':
      return user?.avatar ? (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`}
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
