// src/features/chat/components/ChatBox.tsx
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { useState } from "react"
import { Send } from "lucide-react"

export function ChatBox() {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return
    console.log("Message:", message)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="p-4 bg-card">
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
  )
}
