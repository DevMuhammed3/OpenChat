// app/settings/layout.tsx (Server Component)

import { getCurrentUser } from '@/lib/getCurrentUser'
import { redirect } from 'next/navigation'
import SettingsSidebar from './_components/SettingsSidebar'
import SettingsClientWrapper from './SettingsClientWrapper'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <SettingsClientWrapper>
      <div className="flex min-h-screen bg-main">
        <SettingsSidebar />

        <div className="flex-1 flex justify-center md:pl-64">
          <div className="w-full max-w-4xl p-4 md:p-12">
            {children}
          </div>
        </div>
      </div>
    </SettingsClientWrapper>
  )
}
