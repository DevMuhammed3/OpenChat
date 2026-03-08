'use client'

import { useEffect, useState } from 'react'
import { Input, Button, Card, Skeleton } from 'packages/ui'
import { UserPlus, Loader2 } from 'lucide-react'
import { api } from '@openchat/lib'

export default function AddFriend() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string | null }>({
    type: null,
    message: null
  })

  const sendRequest = async () => {
    const value = username.trim()
    if (!value || loading) return

    setLoading(true)
    setStatus({ type: null, message: null })

    try {
      const res = await api('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus({ type: 'error', message: data.message || 'Failed to send friend request' })
        return
      }

      setStatus({ type: 'success', message: `Friend request sent to @${value}` })
      setUsername('')
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong, try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status.type === 'success') {
      const timer = setTimeout(() => setStatus({ type: null, message: null }), 3000)
      return () => clearTimeout(timer)
    }
  }, [status.type])

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          <h2 className="text-md font-semibold text-foreground">Add Friend</h2>
        </div>
        <p className='text-muted-foreground text-sm'>
          You can add friend with their username.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
          placeholder="You can add friend with their username."
          disabled={loading}
          className="flex-1"
        />

        <Button
          onClick={sendRequest}
          disabled={loading || !username.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Add friend
        </Button>
      </div>

      <div className="min-h-[20px]">
        {loading && (
          <div className="flex items-center gap-3 animate-pulse">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {status.message && (
          <p className={`text-sm font-medium ${status.type === 'error' ? 'text-destructive' : 'text-green-500'
            }`}>
            {status.message}
          </p>
        )}
      </div>
    </Card>
  )
}
