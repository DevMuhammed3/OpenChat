"use client";

import { useEffect, useState } from "react";
import { Button, Avatar, AvatarFallback, ScrollArea, Separator } from "packages/ui";
import { UserPlus, Check, X } from "lucide-react";
import { socket } from "@openchat/lib";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export default function FriendRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/friends/requests`, {
        credentials: "include",
      });
      if (!res.ok) return;

      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  // initial load
  useEffect(() => {
    fetchRequests();
  }, []);

  // realtime listeners
  useEffect(() => {
    const onRequest = () => fetchRequests();
    const onFriendAdded = () => fetchRequests();

    socket.on("friend-request-received", onRequest);
    socket.on("friend-added", onFriendAdded);

    return () => {
      socket.off("friend-request-received", onRequest);
      socket.off("friend-added", onFriendAdded);
    };
  }, []);

  const accept = async (id: number) => {
    await fetch(`${API_URL}/friends/accept/${id}`, {
      method: "POST",
      credentials: "include",
    });
    fetchRequests();
  };

  const reject = async (id: number) => {
    await fetch(`${API_URL}/friends/reject/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchRequests();
  };

  if (requests.length === 0) return null;

  return (
    <div className="border-b border-border">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Friend Requests</h2>
          <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
            {requests.length}
          </span>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {requests.map((req, index) => (
              <div key={req.id}>
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {req.sender.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      @{req.sender.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      wants to connect
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => accept(req.id)}
                      className="h-8 w-8 hover:bg-green-500/10 hover:text-green-500"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => reject(req.id)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {index < requests.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

