'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user-store'
import { api } from '@openchat/lib'

export default function UserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const setUser = useUserStore((s) => s.setUser)
  const setLoaded = useUserStore((s) => s.setLoaded)
  const clearUser = useUserStore((s) => s.clearUser)

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        const res = await api('/auth/me')

        if (!res.ok) throw new Error()

        const data = await res.json()

        if (mounted) setUser(data.user)
      } catch {
        if (mounted) clearUser()
      } finally {
        if (mounted) setLoaded(true)
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [setUser, clearUser, setLoaded])

  return <>{children}</>
}
