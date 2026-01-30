export type CallOfferPayload = {
  chatPublicId: string
  offer: RTCSessionDescriptionInit
  from: Caller
}


export type Caller = {
  id: number
  username: string
  avatar?: string | null
}

export type CallAnswerPayload = {
  chatPublicId: string
  answer: RTCSessionDescriptionInit
}

export type CallIcePayload = {
  chatPublicId: string
  candidate: RTCIceCandidateInit
}

export type CallEndPayload = {
  chatPublicId: string
}


