'use client'

import { useEffect, useState } from 'react'
import { Input, Button } from 'packages/ui'
import { Search, Send, UserPlus, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, cn } from '@openchat/lib'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddFriend() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string | null }>({
    type: null,
    message: null
  })

  const sendRequest = async () => {
    const value = username.trim()
    if (!value || loading) return

    setLoading(true)
    setStatus({ type: null, message: null })

    try {
      const res = await api('/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus({ type: 'error', message: data.message || 'We could not find that user. Double check the username!' })
        return
      }

      setStatus({ type: 'success', message: `Success! Your friend request is on its way to @${value}.` })
      setUsername('')
    } catch {
      setStatus({ type: 'error', message: 'The server is feeling unsocial right now. Try again later!' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status.type === 'success') {
      const timer = setTimeout(() => setStatus({ type: null, message: null }), 5000)
      return () => clearTimeout(timer)
    }
  }, [status.type])

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="space-y-2 border-b border-white/5 pb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <UserPlus className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white tracking-tight">Add Friend</h2>
          </div>
          <p className="text-zinc-400 text-[14px] leading-relaxed max-w-lg">
            Connect with friends by entering their unique username. You can find their username in their profile card.
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          <div className="relative group">
            <div className={cn(
              "absolute -inset-0.5 rounded-2xl blur opacity-0 transition duration-500",
              status.type === 'success' ? "bg-emerald-500/20 opacity-40" : 
              status.type === 'error' ? "bg-red-500/20 opacity-40" :
              "bg-primary/20 group-focus-within:opacity-40"
            )} />
            
            <div className="relative flex flex-col sm:flex-row gap-3 p-2 bg-[#111214] border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                  placeholder="Enter a username (e.g. muhammed_dev)"
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-[15px]"
                />
              </div>
              
              <Button
                onClick={sendRequest}
                disabled={loading || !username.trim()}
                className={cn(
                  "h-12 px-6 rounded-xl font-bold transition-all shrink-0",
                  status.type === 'success' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-primary text-white hover:opacity-90"
                )}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Send Friend Request</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Status Feedback */}
          <AnimatePresence mode="wait">
            {status.message && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border",
                  status.type === 'error' 
                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                )}
              >
                {status.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span className="text-sm font-medium">{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info/Onboarding Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-white/5">
           <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                 <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-zinc-200 mb-2">Privacy First</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                 Only people you add can see your online status and send you direct messages.
              </p>
           </div>
           
           <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                 <Search className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-zinc-200 mb-2">Recent Searches</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                 Try searching for users in public channels to find people with similar interests.
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  )
}
