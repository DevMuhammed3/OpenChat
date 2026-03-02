// "use client"
//
// import { useVoiceCall } from "@/hooks/useVoiceCall"
// import IncomingCallOverlay from "../IncomingCallOverlay"
// import IncomingCallOverlay from "./incoming-call-overlay"

// export function GlobalCallSystem() {
//   const voice = useVoiceCall()
//
//   return (
//     <>
//       <audio ref={voice.remoteAudioRef} autoPlay />
//       <audio ref={voice.ringtoneRef} src="/sounds/rining.mp3" preload="auto" />
//
//       <IncomingCallOverlay
//         inCall={voice.inCall}
//         acceptCall={voice.acceptCall}
//         endCall={voice.endCall}
//       />
//     </>
//   )
// }
