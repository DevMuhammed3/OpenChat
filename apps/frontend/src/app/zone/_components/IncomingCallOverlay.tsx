'use client'

import { PhoneCall, PhoneOff, User } from 'lucide-react'
import { useCallStore } from '@/app/stores/call-store'
import { Button, Avatar, AvatarFallback } from 'packages/ui'

type Props = {
  inCall: boolean
  acceptCall: () => void
  endCall: () => void
}

export default function IncomingCallOverlay({
  inCall,
  acceptCall,
  endCall,
}: Props) {
  const { caller, incoming } = useCallStore()

  if (!caller) return null

  return (
    <>
      {incoming && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-background p-6 rounded-xl w-[350px] text-center space-y-4">
            <Avatar className="mx-auto h-12 w-12">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <p className="font-medium">
              {caller} is calling...
            </p>

            <div className="flex justify-center gap-4">
              <Button onClick={acceptCall}>
                <PhoneCall className="w-4 h-4 mr-2" />
                Accept
              </Button>

              <Button variant="destructive" onClick={endCall}>
                <PhoneOff className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {inCall && (
        <div className="fixed bottom-6 right-6 bg-background border shadow-lg rounded-xl px-4 py-3 z-[9999] flex items-center gap-4">
          <span>In Call</span>
          <Button size="sm" variant="destructive" onClick={endCall}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      )}
    </>
  )
}
