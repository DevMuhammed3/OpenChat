'use client'

export type EmptyChatStateProps = {
  name: string
  onSelectMessage: (message: string) => void
}

const QUICK_MESSAGES = ['Hi', 'Hello', "What's up"] as const

export function EmptyChatState({ name, onSelectMessage }: EmptyChatStateProps) {
  const displayName = name?.trim() || 'User'

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-bold">👋 Say hi to {displayName}</h2>

        <p className="text-sm text-muted-foreground">
          This is the beginning of your conversation
        </p>

        <div className="flex gap-2 mt-2">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              type="button"
              onClick={() => onSelectMessage(msg)}
              className="px-4 py-2 rounded-full border hover:bg-muted transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

