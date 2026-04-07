'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronDown,
    Settings,
    Pencil,
    LogOut,
    Users,
    AlertTriangle,
} from 'lucide-react'
import { useZone, useZoneMembers } from '@/features/zones/queries'
import {
    useDeleteZoneMutation,
    useLeaveZoneMutation,
    useUpdateZoneMutation,
} from '@/features/zones/mutations'
import { useUser } from '@/features/user/queries'
import { ZoneSettingsModal } from './ZoneSettingsModal'

type ZoneDropdownMenuProps = {
    zonePublicId: string
    children?: React.ReactNode
}

export function ZoneDropdownMenu({
    zonePublicId,
    children,
}: ZoneDropdownMenuProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const { data: zone } = useZone(zonePublicId)
    const { data: members = [] } = useZoneMembers(zonePublicId)
    const { data: currentUser } = useUser()
    const deleteZoneMutation = useDeleteZoneMutation(zonePublicId)
    const leaveZoneMutation = useLeaveZoneMutation(zonePublicId)
    const updateZoneMutation = useUpdateZoneMutation(zonePublicId)

    const isOwner = members.some(
        (m) => m.id === currentUser?.id && m.role === 'OWNER'
    )

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setIsEditing(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (zone) setEditName(zone.name)
    }, [zone])

    const handleRename = async () => {
        if (!editName.trim() || editName === zone?.name) {
            setIsEditing(false)
            return
        }
        await updateZoneMutation.mutateAsync({ name: editName })
        setIsEditing(false)
    }

    const handleDelete = async () => {
        try {
            await deleteZoneMutation.mutateAsync()
            setShowDeleteConfirm(false)
        } catch (err: any) {
            const message = err?.data?.message || err?.message || 'Failed to delete zone'
            console.error('Delete zone error:', err)
            alert(message)
        }
    }

    const handleLeave = async () => {
        try {
            await leaveZoneMutation.mutateAsync()
        } catch (err: any) {
            const message = err?.data?.message || err?.message || 'Failed to leave zone'
            console.error('Leave zone error:', err)
            alert(message)
        }
    }

    return (
        <>
            <div className="relative border-b p-2" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1 p-2 rounded hover:bg-white/5 transition-colors"
                >
                    {children || (
                        <h2 className="font-bold text-white text-[15px] truncate max-w-[180px]">
                            {zone?.name || 'Loading...'}
                        </h2>
                    )}
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                        {isEditing ? (
                            <div className="p-3 space-y-2">
                                <p className="text-xs text-white/50 uppercase tracking-wide font-semibold">
                                    Rename Zone
                                </p>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && handleRename()
                                    }
                                    onBlur={handleRename}
                                    autoFocus
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false)
                                            setShowSettings(true)
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Zone Settings
                                    </button>
                                    {isOwner && (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false)
                                                setIsEditing(true)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Rename Zone
                                        </button>
                                    )}
                                </div>

                                <div className="border-t border-white/10 py-1">
                                    {isOwner ? (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false)
                                                setShowDeleteConfirm(true)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            Delete Zone
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false)
                                                setShowLeaveConfirm(true)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Leave Zone
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="fixed inset-0 bg-black/70"
                        onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmText('')
                        }}
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 w-full max-w-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-bold text-white">
                                    Delete Zone?
                                </h3>
                            </div>
                            <p className="text-sm text-white/60 mb-4">
                                This will permanently delete "<span className="text-white font-medium">{zone?.name}</span>" and all its channels. This cannot be undone.
                            </p>
                            <div className="mb-4">
                                <label className="block text-xs text-white/50 mb-2">
                                    Type the zone name to confirm deletion
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder={`Type "${zone?.name}"`}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false)
                                        setDeleteConfirmText('')
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== zone?.name || deleteZoneMutation.isPending}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteZoneMutation.isPending
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLeaveConfirm && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="fixed inset-0 bg-black/70"
                        onClick={() => setShowLeaveConfirm(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold text-white mb-2">
                                Leave Zone?
                            </h3>
                            <p className="text-sm text-white/60 mb-6">
                                You will be removed from "{zone?.name}" and lose
                                access to all channels.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeave}
                                    disabled={leaveZoneMutation.isPending}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {leaveZoneMutation.isPending
                                        ? 'Leaving...'
                                        : 'Leave'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ZoneSettingsModal
                open={showSettings}
                onClose={() => setShowSettings(false)}
                zonePublicId={zonePublicId}
            />
        </>
    )
}
