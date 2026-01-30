import { useEffect, useRef, useState } from "react"
import { socket, getAudioStream, createPeer, api } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import {
  CallAnswerPayload,
  CallEndPayload,
  CallIcePayload,
  CallOfferPayload,
} from "@openchat/types"

export function useVoiceCall() {
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const cleaningRef = useRef(false)

  const showIncoming = useCallStore((s) => s.showIncoming)
  const clearCall = useCallStore((s) => s.clear)
  const getActiveChatId = () => useCallStore.getState().chatPublicId

  const [inCall, setInCall] = useState(false)

  async function fetchIceServers(): Promise<RTCIceServer[]> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/webrtc/ice`,
      { credentials: "include" }
    )

    const data = await res.json()
    return data.iceServers
  }

  function playRingtone() {
    const audio = ringtoneRef.current
    if (!audio) return

    audio.loop = true
    audio.currentTime = 0
    audio.muted = false

    audio.play().catch(() => { })
  }

  // function playRingtone() {
  //   if (!ringtoneRef.current) return
  //   ringtoneRef.current.currentTime = 0
  //   ringtoneRef.current.loop = true
  //   ringtoneRef.current.play().catch(() => { })
  // }

  function stopRingtone() {
    if (!ringtoneRef.current) return
    ringtoneRef.current.pause()
    ringtoneRef.current.currentTime = 0
  }

  useEffect(() => {
    if (!socket.connected) socket.connect()
  }, [])

  async function startCall(chatPublicId: string) {
    if (inCall) return

    useCallStore.setState({ chatPublicId })

    socket.emit("join-room", { chatPublicId })

    const stream = await getAudioStream()
    localStreamRef.current = stream

    const iceServers = await fetchIceServers()
    const peer = createPeer(iceServers)
    peerRef.current = peer

    stream.getTracks().forEach((t) => peer.addTrack(t, stream))

    peer.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0]
      }
    }

    peer.onicecandidate = (e) => {
      if (!e.candidate) return
      const cid = getActiveChatId()
      if (!cid) return
      socket.emit("call:ice", { chatPublicId: cid, candidate: e.candidate })
    }

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    socket.emit("call:offer", { chatPublicId, offer })
  }

  async function acceptCall() {
    const chatPublicId = getActiveChatId()
    if (!pendingOfferRef.current || !chatPublicId) return

    stopRingtone()

    socket.emit("join-room", { chatPublicId })

    const stream = await getAudioStream()
    localStreamRef.current = stream

    const iceServers = await fetchIceServers()
    const peer = createPeer(iceServers)
    peerRef.current = peer

    stream.getTracks().forEach((t) => peer.addTrack(t, stream))

    peer.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0]
      }
    }

    peer.onicecandidate = (e) => {
      if (!e.candidate) return
      socket.emit("call:ice", { chatPublicId, candidate: e.candidate })
    }

    await peer.setRemoteDescription(pendingOfferRef.current)

    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    socket.emit("call:answer", { chatPublicId, answer })

    pendingOfferRef.current = null
    clearCall()
    setInCall(true)
  }

  function cleanupCall() {
    if (cleaningRef.current) return
    cleaningRef.current = true

    const cid = getActiveChatId()
    if (cid) socket.emit("leave-room", { chatPublicId: cid })

    peerRef.current?.close()
    peerRef.current = null

    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null

    stopRingtone()

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }

    pendingOfferRef.current = null
    clearCall()
    setInCall(false)

    setTimeout(() => {
      cleaningRef.current = false
    }, 300)
  }


  function onCallReject({ chatPublicId }: { chatPublicId: string }) {
    const cid = getActiveChatId()
    if (chatPublicId !== cid) return
    cleanupCall()
  }


  function endCall() {
    const cid = getActiveChatId()
    if (cid) socket.emit("call:end", { chatPublicId: cid })
    cleanupCall()
  }


  useEffect(() => {
    function onOffer({ chatPublicId, offer, from }: CallOfferPayload) {
      pendingOfferRef.current = offer
      showIncoming({ chatPublicId, caller: from })
      playRingtone()
    }


    function onAnswer({ chatPublicId, answer }: CallAnswerPayload) {
      const cid = getActiveChatId()
      const peer = peerRef.current

      if (!peer || chatPublicId !== cid) return

      if (peer.signalingState !== "have-local-offer") {
        console.warn(
          "Ignoring answer, wrong state:",
          peer.signalingState
        )
        return
      }

      peer.setRemoteDescription(answer)
    }


    function onIce({ chatPublicId, candidate }: CallIcePayload) {
      const cid = getActiveChatId()
      if (chatPublicId !== cid || !peerRef.current) return
      peerRef.current.addIceCandidate(candidate)
    }

    function onCallEnd({ chatPublicId }: CallEndPayload) {
      const cid = getActiveChatId()
      if (chatPublicId !== cid) return
      cleanupCall()
    }

    function onCallReject({ chatPublicId }: { chatPublicId: string }) {
      const cid = getActiveChatId()
      if (chatPublicId !== cid) return
      cleanupCall()
    }

    socket.on("call:offer", onOffer)
    socket.on("call:answer", onAnswer)
    socket.on("call:ice", onIce)
    socket.on("call:end", onCallEnd)
    socket.on("call:reject", onCallReject)
    socket.on("disconnect", () => {
      if (inCall) cleanupCall()
    })

    return () => {
      socket.off("call:offer", onOffer)
      socket.off("call:answer", onAnswer)
      socket.off("call:ice", onIce)
      socket.off("call:end", onCallEnd)
      socket.off("call:reject", onCallReject)
      socket.off("disconnect", cleanupCall)
    }
  }, [])

  return {
    startCall,
    acceptCall,
    onCallReject,
    endCall,
    inCall,
    remoteAudioRef,
    ringtoneRef,
  }
}
