// root layout (server)
import { getCurrentUser } from '@/lib/getCurrentUser'
import '../globals.css'
import ClientProviders from './providers/ClientProviders'
import { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'OpenChat',
  description: 'OpenChat real-time chat application',
  icons: {
    icon: '/icon.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-main">
        < ClientProviders initialUser={user} >
          {children}
        </ClientProviders >
      </body >
    </html >
  )
}
