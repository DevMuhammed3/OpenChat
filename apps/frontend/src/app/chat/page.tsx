"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User } from "lucide-react";
import { Input } from "packages/ui";
import AddFriend from "./AddFriend";
import { socket } from "@openchat/lib";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! How are you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Connect socket once
  useEffect(() => {
    console.log("Connecting socket...");
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  // Receive message from others
  useEffect(() => {
    socket.on("receive-message", (data) => {
      console.log("SERVER SAYS:", data);

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: data.text,
          role: data.from === socket.id ? "user" : "assistant",
          timestamp: new Date(),
        },
      ]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  // Scroll on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSend = () => {
    if (!input.trim()) return;

    const text = input;

    // Add user's own message locally
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: text,
        role: "user",
        timestamp: new Date(),
      },
    ]);

    // Send to backend
    socket.emit("send-message", {
      text,
      from: socket.id,
    });

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-background" dir="ltr">

      {/* Add AddFriend Sidebar */}
      <AddFriend />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col mx-auto w-full">
        
        {/* Header */}
        <div className="border-b bg-card">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">

            {/*<Bot className="w-5 h-5 text-primary-foreground" />*/}
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">@user</h1>
              <p className="text-sm text-muted-foreground">Online now</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Assistant Avatar */}
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                {/* <Bot className="w-4 h-4 text-primary-foreground" /> */}
                    <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div
                className={`flex flex-col gap-1 max-w-[70%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {/* User Avatar */}
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-card p-4">
          <div className="flex items-end gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 scrollbar-hide resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground max-h-32 min-h-11"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-11 w-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <p className="hidden md:block text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
