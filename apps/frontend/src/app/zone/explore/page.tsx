'use client'

import { useState } from 'react'
import { Search, TrendingUp, Users, Hash, Plus, UserPlus, X } from 'lucide-react'
import { cn } from '@openchat/lib'

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'channels'>('trending')

  const trendingTopics = [
    { name: '#TechNews', posts: '12.5K', growth: '+15%' },
    { name: '#OpenSource', posts: '8.2K', growth: '+23%' },
    { name: '#WebDev', posts: '6.8K', growth: '+8%' },
    { name: '#AI', posts: '15.3K', growth: '+45%' },
    { name: '#Gaming', posts: '22.1K', growth: '+12%' },
  ]

  const suggestedPeople = [
    { name: 'Sarah Chen', username: 'sarahc', followers: '25K', avatar: null },
    { name: 'Alex Rivera', username: 'alexr', followers: '18K', avatar: null },
    { name: 'Jordan Lee', username: 'jordanl', followers: '32K', avatar: null },
  ]

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'people', label: 'People', icon: Users },
    { id: 'channels', label: 'Channels', icon: Hash },
  ]

  return (
    <div className="h-full flex flex-col bg-[#0b1220]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <h1 className="text-xl font-bold text-white mb-4">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, people..."
            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-4 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'trending' && (
          <div className="space-y-3">
            {trendingTopics.map((topic) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-4 bg-[#1a1d23] rounded-xl border border-white/5 hover:bg-[#22252b] transition-colors cursor-pointer active:scale-[0.98]"
              >
                <div>
                  <h4 className="font-semibold text-white">{topic.name}</h4>
                  <p className="text-sm text-zinc-500">{topic.posts} posts</p>
                </div>
                <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  {topic.growth}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-3">
            {suggestedPeople.map((person) => (
              <div
                key={person.username}
                className="flex items-center justify-between p-4 bg-[#1a1d23] rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white font-bold">
                    {person.name[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{person.name}</h4>
                    <p className="text-sm text-zinc-500">@{person.username} · {person.followers} followers</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-3">
            {[
              { name: 'General Tech', members: '5.2K', category: 'Technology' },
              { name: 'Dev Community', members: '3.8K', category: 'Development' },
              { name: 'Gaming Hub', members: '12K', category: 'Gaming' },
            ].map((channel) => (
              <div
                key={channel.name}
                className="flex items-center justify-between p-4 bg-[#1a1d23] rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{channel.name}</h4>
                    <p className="text-sm text-zinc-500">{channel.members} members · {channel.category}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors">
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
