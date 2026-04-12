'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
} from 'packages/ui'

import { toast } from 'sonner'
import { useState } from 'react'

export default function AccountPage() {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleLogoutAll = () => {
    setLoading(true)

    setTimeout(() => {
      toast.success('Logged out from all sessions')
      setLoading(false)
    }, 800)
  }

  const handleDeleteAccount = () => {
    setDeleting(true)

    setTimeout(() => {
      toast.success('Account scheduled for deletion')
      setDeleting(false)
    }, 1200)
  }

  return (
    <div className="max-w-3xl space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account settings and data.
        </p>
      </div>

      {/* Sessions */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Manage devices connected to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Logout from all devices
            </p>
            <p className="text-xs text-muted-foreground">
              This will log you out from every active session.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleLogoutAll}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Logout All'}
          </Button>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Your Data</CardTitle>
          <CardDescription>
            Download or manage your account data.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Export account data
            </p>
            <p className="text-xs text-muted-foreground">
              Download your messages and account information.
            </p>
          </div>

          <Button variant="outline">
            Export
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-[#1a1216] border border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-300">
              Delete Account
            </p>
            <p className="text-xs text-red-400/70">
              This action cannot be undone.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}
