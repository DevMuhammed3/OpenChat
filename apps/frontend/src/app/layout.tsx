import "../globals.css"
import type { Metadata } from "next"

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
    <html lang="ar" dir="rtl" className="dark">
      <body>{children}</body>
    </html>
  )
}
