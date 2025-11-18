import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
} from "packages/ui"
import { useEffect, useRef, useState } from "react"
import { socket } from "@openchat/lib"
import { Send } from "lucide-react"

export function ChatBox() {
  const [message, setMessage] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null)
  const handleSend = () => {
    if (!message.trim()) return
    socket.emit("send-message", message)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    const focusTextarea = () => {
      const el = containerRef.current?.querySelector('textarea[data-slot="input-group-control"]') as HTMLTextAreaElement | null
      el?.focus()
    }

    focusTextarea()

    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return

      if (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        focusTextarea()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])


  return (
    <div ref={containerRef} className="fixed bottom-0 left-0 right-0 z-50 w-full">
      <div className="w-full p-4 bg-card">
        <div className="max-w-screen-2xl mx-auto">
          <InputGroup className="w-full">
            <InputGroupTextarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter message..."
              className="min-h-12 resize-none text-foreground placeholder:text-muted-foreground"
            />

            <InputGroupAddon
              onClick={handleSend}
              align="inline-end"
              className="cursor-pointer hover:bg-accent transition-colors p-4 rounded-md"
            >
               <Send className="h-5 w-5 text-foreground" />
            </InputGroupAddon>

          </InputGroup>
        </div>
      </div>
    </div>
  )
}
