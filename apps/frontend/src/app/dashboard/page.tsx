'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  Settings, 
  LayoutDashboard, 
  Bell, 
  PlusCircle,
  ArrowRight,
  Monitor,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  Button,
  Avatar,
  AvatarFallback,
  ScrollArea
} from 'packages/ui'
import { useUserStore } from '@/app/stores/user-store'
import { useFriendsStore } from '@/app/stores/friends-store'
import { useChatsStore } from '@/app/stores/chat-store'
import { api, getAvatarUrl } from '@openchat/lib'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useUserStore()
  const { friends, setFriends, onlineUsers } = useFriendsStore()
  const { chats, setChats } = useChatsStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, chatsRes] = await Promise.all([
          api('/friends/list'),
          api('/chats')
        ])

        const friendsData = await friendsRes.json()
        const chatsData = await chatsRes.json()

        setFriends(friendsData.friends || [])
        setChats(chatsData.chats || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [setFriends, setChats])

  if (!user) return null

  const stats = [
    { 
      label: 'Connected Friends', 
      value: friends.length, 
      icon: Users, 
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    { 
      label: 'Active Chats', 
      value: chats.length, 
      icon: MessageSquare, 
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    { 
      label: 'Online Now', 
      value: onlineUsers.size, 
      icon: Zap, 
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    { 
      label: 'Security Status', 
      value: user.emailVerified ? 'Verified' : 'Pending', 
      icon: ShieldCheck, 
      color: user.emailVerified ? 'text-emerald-400' : 'text-yellow-400',
      bg: user.emailVerified ? 'bg-emerald-400/10' : 'bg-yellow-400/10'
    },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome back, {user.name || user.username}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your OpenChat account today.
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/settings/profile')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => router.push('/zone')}>
            <Monitor className="w-4 h-4 mr-2" />
            Open App
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-[#111a2b] border-white/5 hover:border-white/10 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-4 font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Chats */}
        <Card className="lg:col-span-2 bg-[#111a2b] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>Your latest discussions and group chats.</CardDescription>
            </div>
            <Link href="/zone" className="text-sm text-primary hover:underline flex items-center">
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {chats.length > 0 ? (
              <div className="space-y-4">
                {chats.slice(0, 5).map((chat) => {
                  const other = chat.participants.find(p => p.id !== user.id)
                  const avatarUrl = getAvatarUrl(other?.avatar)
                  
                  return (
                    <div 
                      key={chat.chatPublicId}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer"
                      onClick={() => router.push(`/zone/chat/${chat.chatPublicId}`)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border border-white/10">
                          {avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full object-cover" />
                          ) : (
                            <AvatarFallback>{other?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-semibold">@{other?.username || 'Group Chat'}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {chat.lastMessage?.text || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto opacity-20 mb-3" />
                <p>No active conversations yet.</p>
                <Button variant="link" onClick={() => router.push('/zone')}>Start a conversation</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Friends / Notifications */}
        <div className="space-y-8">
          <Card className="bg-[#111a2b] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Online Friends</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] pr-4">
                {friends.filter(f => onlineUsers.has(f.id)).length > 0 ? (
                  <div className="space-y-4">
                    {friends.filter(f => onlineUsers.has(f.id)).map(friend => {
                      const avatarUrl = getAvatarUrl(friend.avatar)
                      return (
                        <div key={friend.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-green-500/20">
                              {avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" />
                              ) : (
                                <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <span className="font-medium text-sm">@{friend.username}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => router.push('/zone')}
                          >
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-10 italic">No friends online right now.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card className="bg-[#111a2b] border-white/5 border-l-4 border-l-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simplified view since we'd need more logic for actual notifictions */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-sm">
                  <p className="font-medium">Welcome to OpenChat!</p>
                  <p className="text-xs text-muted-foreground mt-1">Start by inviting your friends to join your private zones.</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-9 border-dashed border-white/10 hover:border-primary/50"
                  onClick={() => router.push('/zone')}
                >
                  View Activity Feed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/20 to-purple-500/10 border-white/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button 
                variant="secondary" 
                className="justify-start h-auto py-3 px-4 flex-col items-start gap-1"
                onClick={() => router.push('/zone')}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-xs">Add Friend</span>
              </Button>
              <Button 
                variant="secondary" 
                className="justify-start h-auto py-3 px-4 flex-col items-start gap-1"
                onClick={() => router.push('/zone')}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-xs">Join Zone</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
