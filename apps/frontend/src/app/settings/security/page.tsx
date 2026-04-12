'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
} from 'packages/ui'

import { useState } from 'react'
import { toast } from 'sonner'

export default function SecurityPage() {
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async () => {
    setLoading(true)

    setTimeout(() => {
      toast.success('Password updated successfully')
      setLoading(false)
    }, 800)
  }

  return (
    <div className="max-w-3xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-muted-foreground text-sm">
          Manage your password and account security settings.
        </p>
      </div>

      {/* Change Password */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Make sure your new password is strong and unique.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">
              Current Password
            </label>
            <Input type="password" />
          </div>

          <div>
            <label className="text-sm font-medium">
              New Password
            </label>
            <Input type="password" />
          </div>

          <div>
            <label className="text-sm font-medium">
              Confirm Password
            </label>
            <Input type="password" />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handlePasswordChange}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Devices currently logged into your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-background border-border">
            <div>
              <p className="text-sm font-medium">
                Chrome • Linux
              </p>
              <p className="text-xs text-muted-foreground">
                Cairo, Egypt • Active now
              </p>
            </div>

            <Button variant="destructive" size="sm">
              Revoke
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-background border-border">
            <div>
              <p className="text-sm font-medium">
                Safari • iPhone
              </p>
              <p className="text-xs text-muted-foreground">
                2 days ago
              </p>
            </div>

            <Button variant="destructive" size="sm">
              Revoke
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Factor */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              2FA Status
            </p>
            <p className="text-xs text-muted-foreground">
              Currently disabled
            </p>
          </div>

          <Button variant="outline">
            Enable
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
