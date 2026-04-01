"use client"

import { Toaster } from 'packages/ui'
import UserProvider from './user-provider'
import GlobalCallProvider from './global-call-provider'
import { AppThemeProvider } from './theme-provider'
import { RealtimeProvider } from './realtime-provider'
import { NotificationsProvider } from './notifications-provider'
// import { GlobalCallSystem } from '../zone/_components/global/call-system'
import { GoogleOAuthProvider } from "@react-oauth/google"
import ChannelCallManager from '../zone/_components/ChannelCallManager'
import { AppQueryProvider } from '@/lib/query/provider'
import type { AppUser } from '@/features/user/types'

export default function ClientProviders({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AppUser | null
}) {

  return (
    <AppThemeProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <AppQueryProvider initialUser={initialUser}>
          <UserProvider>
            <RealtimeProvider>
              <NotificationsProvider>
                {/*<GlobalCallSystem />*/}
                {children}
                <GlobalCallProvider />
                <ChannelCallManager />
              </NotificationsProvider>
            </RealtimeProvider>
          </UserProvider>
        </AppQueryProvider>
      </GoogleOAuthProvider>
      <Toaster richColors position="top-center" />
    </AppThemeProvider>
  )
}
