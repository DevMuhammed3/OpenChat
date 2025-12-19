'use client'

import { useEffect, useState } from 'react'
import { Input, Skeleton } from 'packages/ui'
import { api } from '@openchat/lib'

export default function AddFriend() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sendRequest = async () => {
    const value = username.trim()
    if (!value || loading) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await api('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to send friend request')
        return
      }

      setSuccess(`Friend request sent to @${value}`)
      setUsername('')
    } catch {
      setError('Something went wrong, try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!success) return

    const timer = setTimeout(() => {
      setSuccess(null)
    }, 3000)

    return () => clearTimeout(timer)
  }, [success])

  return (
    <div className="bg-card p-4 border-b border-border">
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
        placeholder="Add friend by username..."
        disabled={loading}
        className="rounded-lg"
      />

      {loading && (
        <div className="flex items-center space-x-4 mt-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-3">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-500 mt-3">
          {success}
        </p>
      )}
    </div>
  )
}

