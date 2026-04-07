"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Plus, X } from "lucide-react"

type ModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (name: string, avatar?: File | null) => void
}

export function CreateZoneModal({ open, onClose, onCreate }: ModalProps) {
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string>("")
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setName("")
      setAvatar(null)
      setError("")
      setPreview("")
      setIsSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (!avatar) {
      setPreview("")
      return
    }

    const objectUrl = URL.createObjectURL(avatar)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [avatar])

  const handleCreate = () => {
    if (isSubmitting) return
    if (!name.trim()) {
      setError("Zone name is required")
      return
    }
    setIsSubmitting(true)
    onCreate(name, avatar)
    onClose()
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md transform transition-all duration-300 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="
            relative overflow-hidden
            bg-[#0f0f13]/95 backdrop-blur-xl
            border border-white/10
            rounded-2xl
            shadow-2xl shadow-black/50
            ring-1 ring-white/5
            scale-100
          ">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl" />

            <div className="relative p-6 space-y-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2 pt-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Create your zone
                </h2>
                <p className="text-sm text-white/50">
                  Give your zone a personality. You can change it later.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div
                  className="group relative cursor-pointer"
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                  <div className="
                    relative h-28 w-28 rounded-full
                    border-2 border-dashed border-white/20
                    bg-white/5
                    overflow-hidden
                    transition-all duration-300 ease-out
                    group-hover:border-[hsl(var(--primary))]/50
                    group-hover:bg-white/10
                    group-hover:scale-105
                    group-hover:shadow-lg group-hover:shadow-[hsl(var(--primary))]/25
                  ">
                    {preview ? (
                      <img 
                        src={preview} 
                        alt="Zone avatar" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" />
                      </div>
                    )}

                    <div className="
                      absolute inset-0 
                      bg-black/60 
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100 
                      transition-opacity duration-200
                    ">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setAvatar(file)
                  }}
                />

                <p className="text-xs text-white/40 font-medium uppercase tracking-widest">
                  Upload Avatar
                </p>
              </div>

              <div className="space-y-2">
                <input
                  id="zone-name"
                  type="text"
                  value={name}
                  autoFocus
                  className={`
                    w-full px-4 py-3 rounded-xl
                    bg-white/[0.03] border border-white/[0.08]
                    text-white placeholder:text-white/30
                    outline-none
                    transition-all duration-200
                    focus:border-[hsl(var(--primary))]/50 focus:bg-white/[0.06]
                    focus:ring-2 focus:ring-[hsl(var(--primary))]/20
                    ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""}
                  `}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError("")
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Gaming Lounge"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="text-xs text-red-400 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex justify-end items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="
                    px-5 py-2.5 rounded-xl
                    text-sm font-semibold text-white/60
                    hover:text-white hover:bg-white/10
                    transition-all duration-200
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="
                    px-6 py-2.5 rounded-xl
                    text-sm font-bold text-white
                    bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80
                    hover:brightness-110
                    shadow-lg shadow-[hsl(var(--primary))]/25 hover:shadow-[hsl(var(--primary))]/40
                    transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  "
                >
                  {isSubmitting ? "Creating..." : "Create Zone"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}