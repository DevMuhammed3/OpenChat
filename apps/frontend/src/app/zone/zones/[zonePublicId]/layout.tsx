'use client'

import { useParams } from 'next/navigation'
import { MembersSidebar } from '../../_components/zones/MembersSidebar'
import { useUser } from '@/features/user/queries'

export default function ZoneLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { zonePublicId } = useParams<{ zonePublicId?: string }>()
    const { data: user } = useUser()

    return (
        <div className="flex h-screen w-full">
            {/* Chat area */}
            <div className="flex-1 flex flex-col min-w-0">{children}</div>

            {/* Members sidebar - only show when in a zone */}
            {zonePublicId && <MembersSidebar />}
        </div>
    )
}
