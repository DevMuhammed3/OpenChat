import { Toaster } from "packages/ui"
import "../globals.css"
import type { Metadata } from "next"
import { AppThemeProvider } from "./theme-provider"

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
        {children}
        <Toaster richColors position="top-center" />
      </ AppThemeProvider>
      </body>
    </html>
  )
}
