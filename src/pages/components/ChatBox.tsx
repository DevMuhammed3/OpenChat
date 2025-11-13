// src/features/chat/components/ChatBox.tsx
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"
import { Send } from "lucide-react"

export function ChatBox() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

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
    socket.on("receive-message", (msg:string) => {
      setMessages((prev) => [...prev, msg])
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);


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
