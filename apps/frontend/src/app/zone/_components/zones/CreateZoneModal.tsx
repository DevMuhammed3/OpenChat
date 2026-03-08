"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  Label,
} from "packages/ui"
import { useState, useRef, useEffect } from "react"
import { Camera, Plus } from "lucide-react"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!name.trim()) {
      setError("Zone name is required")
      return
    }
    onCreate(name, avatar)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setName("")
    setAvatar(null)
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose() }}>
      <DialogContent className="sm:max-w-[420px] p-6 gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Create New Zone</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Avatar Selector Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-24 w-24 border-2 border-muted transition-all group-hover:border-primary/50 group-hover:opacity-80">
                <AvatarImage src={preview} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Plus className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              {/* Overlay Icon on Hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white h-6 w-6" />
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">
              Zone Avatar
            </p>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setAvatar(file)
              }}
            />
          </div>

          {/* Name Input Section */}
          <div className="space-y-2">
            <Label htmlFor="zone-name" className="text-sm font-semibold ml-1">
              Zone Name
            </Label>
            <Input
              id="zone-name"
              value={name}
              autoFocus
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError("")
              }}
              placeholder="e.g. Gaming Lounge"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {error && (
              <p className="text-[12px] text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 mt-2">
            <Button
              variant="ghost"
              className="font-semibold text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="px-8 font-bold shadow-sm shadow-primary/20"
              onClick={handleCreate}
            >
              Create Zone
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
