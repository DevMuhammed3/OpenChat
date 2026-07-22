// root layout (server)
import { getCurrentUser } from '@/lib/getCurrentUser'
import '../globals.css'
import ClientProviders from './providers/ClientProviders'
import { Metadata } from 'next'


export const metadata: Metadata = {
  title: {
    default: 'OpenChat — Open Source Real-Time Chat & Voice',
    template: '%s | OpenChat',
  },
  description:
    'OpenChat is a self-hosted, open-source platform for real-time chat, voice calls, and community building. Privacy-first, no ads, no tracking.',
  keywords: ['chat', 'voice calls', 'open source', 'self-hosted', 'real-time', 'community', 'privacy'],
  openGraph: {
    title: 'OpenChat — Open Source Real-Time Chat & Voice',
    description:
      'Self-hosted, open-source platform for real-time chat, voice calls, and community building. Privacy-first with no ads or tracking.',
    type: 'website',
    siteName: 'OpenChat',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenChat — Open Source Real-Time Chat & Voice',
    description:
      'Self-hosted, open-source platform for real-time chat, voice calls, and community building. Privacy-first with no ads or tracking.',
  },
  icons: {
    icon: '/icon.webp',
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
