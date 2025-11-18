import { ChatBox } from "web/pages/components/chat/ChatBox";
import { useEffect, useState } from "react";
import { socket } from "@openchat/lib";

function ChatPage (){
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const handler = (msg: string) => {
      setMessages((prev) => [...prev, msg])
    }
    socket.on('receive-message', handler)
    return () => { socket.off('receive-message', handler) }
  }, [])

  return (
    // Hidden The Components : TODO
   <div className="hidden flex-1 w-full">
  <div className="max-w-3xl mx-auto px-4 py-8 w-full">
    <p className="text-muted-foreground text-center">Welcome to OpenChat</p>

    <div className="mt-6 bg-card rounded-md h-[89vh] px-4 py-6 flex flex-col justify-end overflow-y-auto">
      {messages.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">No messages yet — start the conversation.</div>
      ) : (
        <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="px-3 py-2 rounded-md bg-background/50 text-foreground font-code text-[16px]">
                {m}
              </div>
            ))}
        </div>
      )}
    </div>
  </div>
  <ChatBox />
</div>
  )
}

export default ChatPage;
