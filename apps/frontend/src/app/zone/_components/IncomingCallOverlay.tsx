'use client'
import { PhoneCall, PhoneOff, User } from 'lucide-react'
import { useCallStore } from '@/app/stores/call-store'
import { useVoiceCall } from '@/hooks/useVoiceCall'
import {
  Button,
  AvatarFallback,
  Avatar,
} from 'packages/ui'


export default function IncomingCallOverlay() {

  // const { chatPublicId } = useParams<{ chatPublicId: string }>()

  const {
    inCall,
    acceptCall,
    endCall,
    remoteAudioRef,
    ringtoneRef,
  } = useVoiceCall()
  const { caller } = useCallStore()
  const incoming = useCallStore((s) => s.incoming)

  if (!caller) return null

  return (
    <>
      {incoming && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded">

          <audio ref={remoteAudioRef} autoPlay />
          <audio ref={ringtoneRef} src="/sounds/rining.mp3" preload="auto" />
          <Avatar
            className="
              felx justify-center
                    h-10 w-10
                  "
          >
            <AvatarFallback
              className="
                        text-primary-foreground
                      "
            >
              <User
                className="
                            h-5 w-5
                          "
              />
            </AvatarFallback>
          </Avatar>

          <p>Incoming call</p>
          <Button onClick={acceptCall}>
            <PhoneCall className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
            Accept
          </Button>
          <Button variant="destructive" onClick={endCall}>
            <PhoneOff className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
            Reject
          </Button>
        </div>
      )}

      {
        inCall && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded">
            <Avatar
              className="
              felx justify-center
                    h-10 w-10
                  "
            >
              <AvatarFallback
                className="
                        text-primary-foreground
                      "
              >
                <User
                  className="
                            h-5 w-5
                          "
                />
              </AvatarFallback>
            </Avatar>
            <Button variant="destructive" onClick={endCall}>
              <PhoneOff className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
              Disconnect
            </Button>
          </div>
        )
      }
    </>

  )
}

