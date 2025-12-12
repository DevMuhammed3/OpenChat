"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "packages/ui";
import { Button } from "packages/ui";
import { Avatar, AvatarFallback, AvatarImage } from "packages/ui";
import { ScrollArea } from "packages/ui";
import { Separator } from "packages/ui";
import { useRouter } from "next/navigation";
import { socket } from "@openchat/lib";

export default function FriendRequests() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(null);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Load logged-in user ID
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) setUserId(data.user.id);
      });
  }, []);

  // Load friends
  const fetchFriends = () => {
    fetch(`${API_URL}/friends/list`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setFriends(data.friends || []));
  };

  // Load requests
  const fetchRequests = async () => {
    const res = await fetch(`${API_URL}/friends/requests`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) setRequests(data.requests || []);
  };

  // First load
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  // Register THIS component to the socket room
  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) socket.connect();
    socket.emit("register", userId);

    console.log("Registered to socket room:", userId);
  }, [userId]);

  // Real-time listeners
  useEffect(() => {
    socket.on("friend-request-received", () => {
      fetchRequests();
    });

    socket.on("friend-added", () => {
      fetchRequests();
      fetchFriends();
    });

    return () => {
      socket.off("friend-request-received");
      socket.off("friend-added");
    };
  }, []);

  // Accept request
  const accept = async (id: number, senderId: number) => {
    await fetch(`${API_URL}/friends/accept/${id}`, {
      method: "POST",
      credentials: "include",
    });

    fetchRequests();
    fetchFriends();
  };

  // Reject request
  const reject = async (id: number) => {
    await fetch(`${API_URL}/friends/reject/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchRequests();
  };

  return (
    <Card className="border-0 shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Friend Requests</CardTitle>
      </CardHeader>

      <CardContent>
        {requests.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No pending friend requests.
          </p>
        )}

        {requests.length > 0 && (
          <ScrollArea className="max-h-64 pr-2">
            {requests.map((req: any, index) => (
              <div key={req.id}>
                <div className="flex items-center justify-between py-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push(`/friend/${req.sender.username}`)}
                  >
                    <Avatar>
                      <AvatarImage src={req.sender?.avatar || ""} />
                      <AvatarFallback>
                        {req.sender?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">@{req.sender.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => accept(req.id, req.sender.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reject(req.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {index < requests.length - 1 && <Separator />}
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

