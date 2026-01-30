import { Toaster } from 'packages/ui'
import '../globals.css'
import type { Metadata } from 'next'
import { AppThemeProvider } from './providers/theme-provider'
import { RealtimeProvider } from './providers/realtime-provider'
import StarsBackground from './providers/StarsBackground'
import { NotificationsProvider } from './providers/notifications-provider'
import IncomingCallOverlay from './zone/_components/IncomingCallOverlay'

export const metadata: Metadata = {
  title: 'OpenChat',
  description: 'Chat App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="
          min-h-screen
          bg-gradient-to-br from-background via-background to-muted
        "
      >
        <AppThemeProvider>
          <RealtimeProvider>
            <NotificationsProvider>
              <IncomingCallOverlay />
              {children}
            </NotificationsProvider>
          </RealtimeProvider>


          <StarsBackground className='hidden md:block' />

          <Toaster richColors position="top-center" />
        </AppThemeProvider>
      </body>
    </html>
  )
}
