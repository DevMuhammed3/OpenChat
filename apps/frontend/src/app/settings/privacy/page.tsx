'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from 'packages/ui'

import { useState } from 'react'
import { toast } from 'sonner'

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-600'
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  )
}

export default function PrivacyPage() {
  const [isPrivate, setIsPrivate] = useState(false)
  const [showStatus, setShowStatus] = useState(true)
  const [allowMessages, setAllowMessages] = useState(true)

  return (
    <div className="max-w-3xl space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Privacy</h1>
        <p className="text-muted-foreground text-sm">
          Control how others interact with your account.
        </p>
      </div>

      {/* Account Visibility */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Account Visibility</CardTitle>
          <CardDescription>
            Manage who can find and view your profile.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">Private Account</p>
              <p className="text-xs text-muted-foreground">
                Only approved users can see your profile.
              </p>
            </div>

            <Toggle
              checked={isPrivate}
              onChange={(value) => {
                setIsPrivate(value)
                toast.success('Privacy setting updated')
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Status */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Activity Status</CardTitle>
          <CardDescription>
            Control whether others can see when you're online.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">Show Online Status</p>
              <p className="text-xs text-muted-foreground">
                Display your active status in chats.
              </p>
            </div>

            <Toggle
              checked={showStatus}
              onChange={(value) => {
                setShowStatus(value)
                toast.success('Status visibility updated')
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Messaging */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Messaging</CardTitle>
          <CardDescription>
            Decide who can send you messages.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">Allow Direct Messages</p>
              <p className="text-xs text-muted-foreground">
                Let users send you private messages.
              </p>
            </div>

            <Toggle
              checked={allowMessages}
              onChange={(value) => {
                setAllowMessages(value)
                toast.success('Messaging preference updated')
              }}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
