import { create } from "zustand"
import { Caller } from "@openchat/types"

type CallState = {
  incoming: boolean
  chatPublicId: string | null
  caller: Caller | null
  showIncoming: (data: {
    chatPublicId: string
    caller: Caller
  }) => void
  clear: () => void
}

export const useCallStore = create<CallState>((set) => ({
  incoming: false,
  chatPublicId: null,
  caller: null,

  showIncoming: ({ chatPublicId, caller }) =>
    set({
      incoming: true,
      chatPublicId,
      caller,
    }),

  clear: () =>
    set({
      incoming: false,
      chatPublicId: null,
      caller: null,
    }),
}))
