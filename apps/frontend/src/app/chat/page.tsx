"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User } from "lucide-react";
import { Input } from "packages/ui";
import AddFriend from "./AddFriend";
import { socket } from "@openchat/lib";
import { useRouter } from "next/navigation";
import FriendRequests from "./FriendRequests";
import FriendList from "./FriendList";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  // const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get logged user
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) router.push("/auth");
        const data = await res.json();
        setUser(data.user);
      })
      // .finally(() => setLoading(false));
  }, []);

  // Connect socket
  useEffect(() => {
    if (!user) return;
    
    socket.connect();
    return () => {socket.disconnect();}
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSend = () => {
    if (!input.trim() || !selectedFriend) return;

    const text = input;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: text,
        senderId: user.id,
        timestamp: new Date(),
      },
    ]);

    socket.emit("send-private", {
      text,
      from: user.id,
      to: selectedFriend.id,
    });

    setInput("");
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // if (loading) return <p>Loading chat...</p>;

  return (
    <div className="flex h-screen bg-background" dir="ltr">

      {/* Sidebar to choose friend */}
      <AddFriend />
    
      {/* Main chat */}
      <div className="flex-1 flex flex-col mx-auto w-full">

        {/* Header */}
        {/* Type header here : TODO */} 

      <FriendRequests />
      <FriendList />
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((m) => {
            const mine = m.senderId === user.id;

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2.5 ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedFriend && (
          <div className="border-t bg-card p-4">
            <div className="flex items-end gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message @${selectedFriend.username}...`}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-11 w-11 rounded-lg bg-primary text-primary-foreground"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {/*UserName*/}
        {user && (
          <div className="p-5 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">
            My UserName: {user.username}
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(user.username)}
              className="text-xs bg-muted px-3 py-1 rounded"
            >
              Copy
            </button>
          </div>
    )}
      </div>
    </div>
  );
}

