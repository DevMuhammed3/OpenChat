'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
  Textarea,
  Avatar,
  AvatarFallback,
} from 'packages/ui'

import { useUserStore } from '@/app/stores/user-store'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { useState, useRef, useEffect } from 'react'
import { api } from '@openchat/lib'

type FormValues = {
  name: string
  username: string
  bio: string
}

export default function ProfilePage() {
  const { user, isLoaded } = useUserStore()
  const updateUser = useUserStore((s) => s.updateUser)

  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState,
    reset,
  } = useForm<FormValues>()



  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        const res = await api('/auth/me')
        if (!res.ok) return

        const data = await res.json()
        updateUser(data.user)
        return
      }

      reset({
        name: user.name ?? '',
        username: user.username ?? '',
        bio: user.bio ?? '',
      })
    }

    fetchUser()
  }, [user, reset])

  if (!isLoaded) {
    return <div className="p-8">Loading profile...</div>
  }

  if (!user) {
    return <div className="p-8">Unauthorized</div>
  }

  // const onSubmit = async (data: FormValues) => {
  //   setLoading(true)
  //
  //   setTimeout(() => {
  //     updateUser(data)
  //     toast.success('Profile updated successfully')
  //     setLoading(false)
  //   }, 800)
  // }

  const onSubmit = async (data: FormValues) => {
    if (!user) return

    const noChanges =
      data.name === (user.name ?? '') &&
      data.username === user.username &&
      data.bio === (user.bio ?? '')

    if (noChanges) {
      toast('No changes detected')
      return
    }

    try {
      setLoading(true)

      const res = await api('/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message)
      }

      updateUser(result.user)
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (file: File) => {
    const preview = URL.createObjectURL(file)

    updateUser({ avatar: preview }) // optimistic preview

    try {
      setAvatarLoading(true)

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await api('/users/avatar', {
        method: 'PATCH',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      updateUser(data.user) // update with real filename
      toast.success('Avatar updated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarLoading(true)

    setTimeout(() => {
      updateUser({ avatar: null })
      toast.success('Avatar removed')
      setAvatarLoading(false)
    }, 600)
  }

  return (
    <div className="max-w-3xl space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information and profile details.
        </p>
      </div>

      {/* Avatar Card */}
      <Card className="bg-[#111a2b] border border-white/5">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            This will be displayed on your profile and chats.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-28 w-28 ring-2 ring-border">
              {user.avatar ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {user.username[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="space-y-2">
              <p className="text-sm font-medium">@{user.username}</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG up to 2MB
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline"
              disabled={avatarLoading}
              onClick={() => fileRef.current?.click()}
            >
              {avatarLoading ? 'Updating...' : 'Change'}
            </Button>

            {user.avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Remove photo
              </button>
            )}
          </div>
          <input
            type="file"
            hidden
            accept="image/*"
            ref={fileRef}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleAvatarChange(e.target.files[0])
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Personal Info Card */}
      <Card className="bg-[#111a2b] border border-white/5">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name, username and bio.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  Full Name
                </label>
                <Input {...register('name')} />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Username
                </label>
                <Input {...register('username')} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Bio
              </label>
              <Textarea
                {...register('bio')}
                rows={4}
                className="bg-[#0f172a]/40 border-white/10 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Email
              </label>
              <Input value={user.email} disabled />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!formState.isDirty || loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
