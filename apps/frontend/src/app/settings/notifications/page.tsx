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

export default function NotificationsPage() {
  const [inApp, setInApp] = useState(true)
  const [email, setEmail] = useState(true)
  const [sound, setSound] = useState(true)
  const [marketing, setMarketing] = useState(false)

  return (
    <div className="max-w-3xl space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Choose how and when you want to be notified.
        </p>
      </div>

      {/* In-App */}
      <Card className="bg-[#111a2b] border border-white/5">
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Notifications that appear inside the app.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">New Messages</p>
              <p className="text-xs text-muted-foreground">
                Get notified when someone sends you a message.
              </p>
            </div>

            <Toggle
              checked={inApp}
              onChange={(value) => {
                setInApp(value)
                toast.success('In-app notification updated')
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="bg-[#111a2b] border border-white/5">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Receive updates via email.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">Message Alerts</p>
              <p className="text-xs text-muted-foreground">
                Get notified by email when you receive new messages.
              </p>
            </div>

            <Toggle
              checked={email}
              onChange={(value) => {
                setEmail(value)
                toast.success('Email notification updated')
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">Marketing Emails</p>
              <p className="text-xs text-muted-foreground">
                Receive product updates and feature announcements.
              </p>
            </div>

            <Toggle
              checked={marketing}
              onChange={(value) => {
                setMarketing(value)
                toast.success('Marketing preference updated')
              }}
            />
          </div>

        </CardContent>
      </Card>

      {/* Sound */}
      <Card className="bg-[#111a2b] border border-white/5">
        <CardHeader>
          <CardTitle>Sound</CardTitle>
          <CardDescription>
            Control notification sounds.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">Notification Sounds</p>
              <p className="text-xs text-muted-foreground">
                Play a sound when receiving a new message.
              </p>
            </div>

            <Toggle
              checked={sound}
              onChange={(value) => {
                setSound(value)
                toast.success('Sound preference updated')
              }}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
