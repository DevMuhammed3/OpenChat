'use client'

import { useState } from "react"
import { api } from "@openchat/lib"
import { useQueryClient } from "@tanstack/react-query"
import { userKeys } from "@/features/user/queries"
import type { AppUser } from "@/features/user/types"
import { Dialog, DialogContent } from "@openchat/components/ui/dialog"
import { Mail, Copy, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface VerifyEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerifyEmailDialog({ open, onOpenChange }: VerifyEmailDialogProps) {
  const queryClient = useQueryClient()

  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null)
  const [resending, setResending] = useState(false)

  async function handleVerify() {
    if (code.length !== 6) return
    
    setLoading(true)
    setMessage("")
    setMessageType(null)

    const res = await api("/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setMessage("Email verified successfully!")
      setMessageType("success")

      setTimeout(() => {
        queryClient.setQueryData<AppUser | null>(userKeys.current(), (current) => {
          if (!current) return current
          return { ...current, emailVerified: true }
        })
        queryClient.invalidateQueries({ queryKey: userKeys.current() })
        onOpenChange(false)
      }, 1500)
    } else {
      setMessage(data.message || "Invalid code")
      setMessageType("error")
    }
  }

  async function handleResend() {
    setResending(true)
    setMessage("")
    setMessageType(null)

    const res = await api("/auth/resend-email", {
      method: "POST",
    })

    const data = await res.json()
    setResending(false)

    if (res.ok) {
      setMessage("Verification code sent!")
      setMessageType("info")
    } else {
      setMessage(data.message || "Something went wrong")
      setMessageType("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-main border-white/10 max-w-sm mx-4 p-0 overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-50" />
          
          <div className="relative p-6 pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary" />
              </div>
            </div>

            <div className="text-center mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                Verify your email
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-surface border border-white/10 rounded-xl py-3.5 text-center text-2xl tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
              />

              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 py-2"
              >
                {resending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {resending ? "Sending..." : "Resend code"}
              </button>
            </div>

            {message && (
              <div className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${
                messageType === "success" ? "text-green-500" :
                messageType === "error" ? "text-red-500" :
                "text-blue-500"
              }`}>
                {messageType === "success" && <CheckCircle className="w-4 h-4" />}
                {messageType === "error" && <AlertCircle className="w-4 h-4" />}
                {messageType === "info" && <Mail className="w-4 h-4" />}
                {message}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}