"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { userKeys } from "@/features/user/queries"
import type { AppUser } from "@/features/user/types"
import { createQueryClient } from "@/lib/query/client"

export function AppQueryProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: AppUser | null
}) {
  const [queryClient] = useState(() => {
    const client = createQueryClient()

    if (initialUser !== undefined) {
      client.setQueryData(userKeys.current(), initialUser)
    }

    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
