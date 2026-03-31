'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user-store'
import { useUser } from '@/features/user/queries'

export default function UserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const setUser = useUserStore((s) => s.setUser)
  const setLoaded = useUserStore((s) => s.setLoaded)
  const { data: user, isFetched } = useUser()

  useEffect(() => {
    if (!isFetched) {
      return
    }

    setUser(user ?? null)
    setLoaded(true)
  }, [isFetched, setLoaded, setUser, user])

  return <>{children}</>
}
