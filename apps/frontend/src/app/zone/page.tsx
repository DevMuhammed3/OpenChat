'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, User } from 'lucide-react'
import { Input } from 'packages/ui'
import AddFriend from './friends/AddFriend'
import { socket } from '@openchat/lib'
import { useRouter } from 'next/navigation'
import FriendRequests from './friends/FriendRequests'
import FriendList from './friends/FriendList'

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

export default function Zone() {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [user, setUser] = useState<any>(null)
    const [copied, setCopied] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<any>(null)
    // const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Auto scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Handle copy
    const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
};


    // Get logged user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                })

                if (!res.ok) {
                    console.log('Unauthorized')
                    router.push('/auth')
                    return
                }

                const data = await res.json()
                setUser(data.user)
            } catch (err) {
                console.log('Fetch error:', err)
                router.push('/auth')
            }
        }

        fetchUser()
    }, [])
    
    // Logout
    const handleLogout = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            })

            if (!res.ok) {
                console.log('Logout failed')
                return
            }

            setUser(null)
            socket.disconnect()
            router.push('/auth')
        } catch (err) {
            console.log('Logout error:', err)
        }
    }

    // Connect socket
    useEffect(() => {
        if (!user) return;

        socket.connect();

        socket.emit("register", user.id);

        socket.on("registered", () => {
          console.log("User registered in socket room:", user.id)
        });

        return () => {
            socket.off("registered")
            socket.disconnect()
        };
    }, [user])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Send message
    const handleSend = () => {
        if (!input.trim() || !selectedFriend) return

        const text = input

        setMessages((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                content: text,
                senderId: user.id,
                timestamp: new Date(),
            },
        ])

        socket.emit('send-private', {
            text,
            from: user.id,
            to: selectedFriend.id,
        })

        setInput('')
    }

    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // if (loading) return <p>Loading chat...</p>;

    return (
        <div className="flex h-screen bg-background" dir="ltr">
            {/* Sidebar to choose friend */}
            <div className='m-2'>
            <AddFriend />
            <FriendRequests />
            <FriendList />

                {/*UserName*/}
                {user && (
                    <div className="fixed bottom-2 p-5 border-t flex items-center justify-between">

                      {copied && (
                        <div className="fixed bottom-20 left-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 ">
                          Copied to clipboard!
                        </div>
                      )}

                        <div className="text-sm sm:text-md cursor-pointer mr-3 font-semibold"
                              onClick={() => handleCopy(user.username)}
                        >
                            My UserName: {user.username}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    handleCopy(user.username)
                                }
                                className="text-xs bg-muted px-3 py-1 rounded"
                            >
                                Copy
                            </button>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="text-xs bg-red-700 text-destructive-foreground px-3 py-1 rounded"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main chat */}
            <div className="flex-1 flex flex-col mx-auto w-full">
                {/* Header */}
                {/* Type header here : TODO */}

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
            </div>
        </div>
    )
}
