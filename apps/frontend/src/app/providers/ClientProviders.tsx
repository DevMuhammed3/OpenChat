"use client"

import dynamic from 'next/dynamic'
import { Toaster } from 'packages/ui'
import UserProvider from './user-provider'
import { AppThemeProvider } from './theme-provider'
import { RealtimeProvider } from './realtime-provider'
import { NotificationsProvider } from './notifications-provider'
import { AppQueryProvider } from '@/lib/query/provider'
import type { AppUser } from '@/features/user/types'

const DynamicGoogleOAuthProvider = dynamic(
  () => import('@react-oauth/google').then(m => m.GoogleOAuthProvider),
  { ssr: false }
)
const DynamicGlobalCallProvider = dynamic(() => import('./global-call-provider'), { ssr: false })
const DynamicChannelCallManager = dynamic(() => import('../zone/_components/ChannelCallManager'), { ssr: false })
const DynamicKeyboardShortcuts = dynamic(
  () => import('@/components/KeyboardShortcutsListener').then(m => m.KeyboardShortcutsListener),
  { ssr: false }
)

export default function ClientProviders({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AppUser | null
}) {

  return (
    <AppThemeProvider>
      <DynamicGoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <AppQueryProvider initialUser={initialUser}>
          <UserProvider>
            <RealtimeProvider>
              <NotificationsProvider>
                <DynamicKeyboardShortcuts />
                {children}
                <DynamicGlobalCallProvider />
                <DynamicChannelCallManager />
              </NotificationsProvider>
            </RealtimeProvider>
          </UserProvider>
        </AppQueryProvider>
      </DynamicGoogleOAuthProvider>
      <Toaster richColors position="top-center" />
    </AppThemeProvider>
  )
}
