'use client'

import { useState } from 'react'
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'packages/ui'
import { Hash, Volume2 } from 'lucide-react'
import { cn, api } from '@openchat/lib'

export function CreateChannelModal({ 
  open, 
  onClose, 
  onCreate,
  initialType = 'TEXT'
}: { 
  open: boolean; 
  onClose: () => void;
  onCreate: (name: string, type: 'TEXT' | 'VOICE') => void;
  initialType?: 'TEXT' | 'VOICE';
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'TEXT' | 'VOICE'>(initialType)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name, type)
    setLoading(false)
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111a2b] border-white/5 text-white">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Channel Type</label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setType('TEXT')}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md transition-colors",
                  type === 'TEXT' ? "bg-white/10 text-white" : "bg-[#0b1220] text-zinc-400 hover:bg-white/5"
                )}
              >
                <Hash className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-bold">Text</div>
                  <div className="text-xs text-zinc-500">Send messages, images, and more.</div>
                </div>
              </button>
              <button 
                onClick={() => setType('VOICE')}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md transition-colors",
                  type === 'VOICE' ? "bg-white/10 text-white" : "bg-[#0b1220] text-zinc-400 hover:bg-white/5"
                )}
              >
                <Volume2 className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-bold">Voice</div>
                  <div className="text-xs text-zinc-500">Hang out with friends using voice and video.</div>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Channel Name</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="new-channel"
                className="bg-[#0b1220] border-none pl-9 focus-visible:ring-1 focus-visible:ring-primary h-10"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-[#1b253b] -m-6 mt-0 p-4 rounded-b-lg">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? "Creating..." : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
