import { Toaster } from "packages/ui"
import "../globals.css"
import type { Metadata } from "next"
import { AppThemeProvider } from "./providers/theme-provider"
import { RealtimeProvider } from "./providers/realtime-provider"

export const metadata: Metadata = {
  title: "OpenChat",
  description: "Chat App",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
   <html lang="en" suppressHydrationWarning>
      <body>
      <AppThemeProvider>
          <RealtimeProvider>
            {children}
            </RealtimeProvider>

        <Toaster richColors position="top-center" />
      </ AppThemeProvider>
      </body>
    </html>
  )
}
