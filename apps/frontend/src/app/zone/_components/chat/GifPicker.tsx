'use client'

import { useState } from 'react'
import { Button, Card, ScrollArea, Input } from 'packages/ui'
import { Search, X, Gift } from 'lucide-react'
import { cn } from '@openchat/lib'

export default function GifPicker({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (url: string) => void,
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  
  const trendingGifs = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/vFKqnCdLPNOKc/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/H54feNXf6Y4n6/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/cuOiZ6BYXYXB6/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/5ORCpdJJivRE6BfOXg/giphy.gif'
  ]

  return (
    <Card className="absolute bottom-16 right-4 w-80 h-[450px] bg-[#2b2d31] border-white/5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
      <div className="p-4 border-b border-white/5 space-y-3">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Gift className="w-5 h-5 text-primary" />
               <h3 className="text-sm font-bold text-white tracking-wide uppercase">GIF Search</h3>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-all transform hover:rotate-90">
               <X className="w-5 h-5" />
            </button>
         </div>
         <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Tenor..." 
              className="w-full bg-[#1e1f22] border-0 rounded-lg h-10 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all focus:ring-1 focus:ring-primary/50"
            />
         </div>
      </div>

      <ScrollArea className="flex-1 p-3">
         <div className="grid grid-cols-2 gap-2">
            {trendingGifs.map((url, i) => (
               <button 
                 key={i} 
                 onClick={() => onSelect(url)}
                 className="relative group aspect-square rounded-xl overflow-hidden bg-black/40 hover:ring-2 hover:ring-primary transition-all"
               >
                  <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                     <span className="text-[10px] font-bold text-white">Select GIF</span>
                  </div>
               </button>
            ))}
         </div>
         <div className="mt-4 p-4 text-center">
            <p className="text-[11px] text-zinc-600 font-medium">Powered by Tens of Memes</p>
         </div>
      </ScrollArea>
    </Card>
  )
}
