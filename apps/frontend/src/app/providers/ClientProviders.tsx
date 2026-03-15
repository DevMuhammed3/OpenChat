"use client"

import { Toaster } from 'packages/ui'
import { useUserStore } from '@/app/stores/user-store'
import UserProvider from './user-provider'
import GlobalCallProvider from './global-call-provider'
import { useEffect } from "react"
import { AppThemeProvider } from './theme-provider'
import { RealtimeProvider } from './realtime-provider'
import { NotificationsProvider } from './notifications-provider'
// import { GlobalCallSystem } from '../zone/_components/global/call-system'
import { GoogleOAuthProvider } from "@react-oauth/google"
import ChannelCallManager from '../zone/_components/ChannelCallManager'

export default function ClientProviders({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: any
}) {

  const setUser = useUserStore((s) => s.setUser)

  useEffect(() => {
    console.log("INITIAL USER:", initialUser)
    setUser(initialUser ?? null)
  }, [initialUser])

  return (
    <AppThemeProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
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
      </GoogleOAuthProvider>
      <Toaster richColors position="top-center" />
    </AppThemeProvider>
  )
}
