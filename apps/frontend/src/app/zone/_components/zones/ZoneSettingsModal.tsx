"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Plus, X, AlertTriangle } from "lucide-react"
import { Button, Avatar, AvatarFallback, AvatarImage } from "packages/ui"
import { useZone, useZoneMembers } from "@/features/zones/queries"
import { useUpdateZoneMutation, useDeleteZoneMutation, useLeaveZoneMutation } from "@/features/zones/mutations"
import { useUser } from "@/features/user/queries"
import { cn } from "@openchat/lib"

type ZoneSettingsModalProps = {
  open: boolean
  onClose: () => void
  zonePublicId: string
}

export function ZoneSettingsModal({ open, onClose, zonePublicId }: ZoneSettingsModalProps) {
  const router = useRouter()
  const { data: zone } = useZone(zonePublicId)
  const { data: members = [] } = useZoneMembers(zonePublicId)
  const { data: currentUser } = useUser()
  const updateZoneMutation = useUpdateZoneMutation(zonePublicId)
  const deleteZoneMutation = useDeleteZoneMutation(zonePublicId)
  const leaveZoneMutation = useLeaveZoneMutation(zonePublicId)

  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">("general")
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOwner = members.some((m) => m.id === currentUser?.id && m.role === "OWNER")

  useEffect(() => {
    if (zone) setName(zone.name)
  }, [zone])

  useEffect(() => {
    if (!open) {
      setName(zone?.name ?? "")
      setAvatar(null)
      setPreview("")
      setShowDeleteConfirm(false)
      setDeleteConfirmText("")
      setShowLeaveConfirm(false)
    }
  }, [open, zone])

  useEffect(() => {
    if (!avatar) {
      setPreview("")
      return
    }
    const objectUrl = URL.createObjectURL(avatar)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [avatar])

  const handleSave = async () => {
    if (!name.trim()) return
    await updateZoneMutation.mutateAsync({ name, avatar })
    setAvatar(null)
    onClose()
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== zone?.name) return
    try {
      await deleteZoneMutation.mutateAsync()
      onClose()
    } catch (err) {
      // Error is handled by the mutation, no need to do anything here
    }
  }

  const handleLeave = async () => {
    await leaveZoneMutation.mutateAsync()
    router.push("/zone/zones")
  }

  if (!open) return null

  const currentAvatar = preview || zone?.avatar || null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-[#0f0f13]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Zone Settings</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-white/10">
              {["general", "members", "danger"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors capitalize",
                    activeTab === tab
                      ? "text-white border-b-2 border-[hsl(var(--primary))]"
                      : "text-white/50 hover:text-white/70"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="group relative cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="h-24 w-24 rounded-full border-2 border-white/10 bg-white/5 overflow-hidden transition-all group-hover:border-[hsl(var(--primary))]/50 group-hover:scale-105">
                        {currentAvatar ? (
                          <Avatar className="h-full w-full">
                            <AvatarImage src={currentAvatar} className="object-cover" />
                            <AvatarFallback className="bg-transparent">
                              <Plus className="w-8 h-8 text-white/40" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white/40" />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest">
                      Change Avatar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Zone Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 outline-none transition-all focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      placeholder="Enter zone name"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={!name.trim() || updateZoneMutation.isPending}
                    className="w-full bg-[hsl(var(--primary))] hover:brightness-110 text-white font-semibold"
                  >
                    {updateZoneMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}

              {activeTab === "members" && (
                <div className="space-y-3">
                  <p className="text-sm text-white/50 mb-4">{members.length} members</p>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar ?? undefined} />
                          <AvatarFallback className="bg-[hsl(var(--primary))] text-white text-sm">
                            {member.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{member.username}</p>
                          <p className="text-xs text-white/40 capitalize">{member.role.toLowerCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "danger" && (
                <div className="space-y-6">
                  {isOwner ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h3 className="font-semibold text-white">Delete Zone</h3>
                      </div>
                      <p className="text-sm text-white/60 mb-4">
                        This action is irreversible. All channels and messages will be permanently deleted.
                      </p>

                      {!showDeleteConfirm ? (
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          Delete Zone
                        </Button>
                        ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-white/50">
                            Please type the zone name to confirm deletion
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                            placeholder={`Type "${zone?.name}"`}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmText('')
                              }}
                              className="flex-1 text-white/60 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleDelete}
                              disabled={deleteConfirmText !== zone?.name || deleteZoneMutation.isPending}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteZoneMutation.isPending ? "Deleting..." : "Confirm Delete"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h3 className="font-semibold text-white">Leave Zone</h3>
                      </div>
                      <p className="text-sm text-white/60 mb-4">
                        You will be removed from this zone and lose access to all channels.
                      </p>

                      {!showLeaveConfirm ? (
                        <Button
                          variant="destructive"
                          onClick={() => setShowLeaveConfirm(true)}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          Leave Zone
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setShowLeaveConfirm(false)}
                            className="flex-1 text-white/60 hover:text-white"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleLeave}
                            disabled={leaveZoneMutation.isPending}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            {leaveZoneMutation.isPending ? "Leaving..." : "Confirm Leave"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}