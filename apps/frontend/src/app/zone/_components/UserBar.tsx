'use client'

import { Avatar, AvatarFallback, Button } from 'packages/ui'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default function UserBar({ user }: { user: any }) {
  const router = useRouter()

  if (!user) return null

  return (
    <div className="border-t p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>
            {user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={() => {
            navigator.clipboard.writeText(user.username)
            toast.success('Copied', {
              description: `@${user.username}`,
              duration: 1500,
            })
          }}
          className="text-sm font-medium hover:underline"
        >
          @{user.username}
        </button>
      </div>

      <Button
        size="icon"
        variant="destructive"
        onClick={async () => {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          })
          router.replace('/auth')
        }}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}

