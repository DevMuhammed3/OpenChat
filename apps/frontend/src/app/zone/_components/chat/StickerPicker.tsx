'use client'

import { useState, useEffect } from 'react'
import { Button, Card, ScrollArea } from 'packages/ui'
import { Plus, X, Sticker, Sparkles, Upload } from 'lucide-react'
import { cn } from '@openchat/lib'

export default function StickerPicker({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (url: string) => void,
  onClose: () => void
}) {
  const [myStickers, setMyStickers] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'custom'>('all')

  useEffect(() => {
    const saved = localStorage.getItem('user_custom_stickers')
    if (saved) setMyStickers(JSON.parse(saved))
  }, [])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (myStickers.length >= 5) {
      alert("You can only save up to 5 custom stickers!")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      const next = [...myStickers, url]
      setMyStickers(next)
      localStorage.setItem('user_custom_stickers', JSON.stringify(next))
    }
    reader.readAsDataURL(file)
  }

  const removeSticker = (idx: number) => {
    const next = myStickers.filter((_, i) => i !== idx)
    setMyStickers(next)
    localStorage.setItem('user_custom_stickers', JSON.stringify(next))
  }

  const defaultStickers = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKMGpx4Z2sT9XWw/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/l41lTfO3V8x0U19o4/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYybmx6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/3o7TKVUn7iM8FMEU24/giphy.gif'
  ]

  return (
    <Card className="absolute bottom-16 right-4 w-72 h-96 bg-[#2b2d31] border-white/5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Sticker className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Stickers</span>
         </div>
         <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
         </button>
      </div>

      <div className="flex p-1 bg-black/20 m-2 rounded-lg">
         <button 
           onClick={() => setActiveTab('all')}
           className={cn("flex-1 py-1 text-[11px] font-bold rounded-md transition-all", activeTab === 'all' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
         >
           Official
         </button>
         <button 
           onClick={() => setActiveTab('custom')}
           className={cn("flex-1 py-1 text-[11px] font-bold rounded-md transition-all", activeTab === 'custom' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
         >
           My Stickers ({myStickers.length}/5)
         </button>
      </div>

      <ScrollArea className="flex-1 p-3">
         {activeTab === 'all' ? (
            <div className="grid grid-cols-2 gap-2">
               {defaultStickers.map((url, i) => (
                  <button 
                    key={i} 
                    onClick={() => onSelect(url)}
                    className="aspect-square bg-white/5 rounded-xl hover:bg-white/10 transition-all p-2 group"
                  >
                     <img src={url} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  </button>
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-2 gap-2">
               {myStickers.map((url, i) => (
                  <div key={i} className="relative aspect-square bg-white/5 rounded-xl p-2 group">
                     <img src={url} className="w-full h-full object-contain cursor-pointer" onClick={() => onSelect(url)} />
                     <button 
                        onClick={() => removeSticker(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <X className="w-3 h-3" />
                     </button>
                  </div>
               ))}
               {myStickers.length < 5 && (
                  <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all border-zinc-700">
                     <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                     <span className="text-[10px] text-zinc-500 font-bold">Upload</span>
                     <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                  </label>
               )}
            </div>
         )}
         
         <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
               <Sparkles className="w-3 h-3 text-primary" />
               <h4 className="text-[10px] font-bold text-primary uppercase">Custom Slots</h4>
            </div>
            <p className="text-[9px] text-zinc-500 leading-tight">
               Every user gets 5 slots for custom stickers. Upload your favorite memes!
            </p>
         </div>
      </ScrollArea>
    </Card>
  )
}
