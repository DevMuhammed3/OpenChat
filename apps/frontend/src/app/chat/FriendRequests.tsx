"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "packages/ui";
import { Button } from "packages/ui";
import { Avatar, AvatarFallback, AvatarImage } from "packages/ui";
import { ScrollArea } from "packages/ui";
import { Separator } from "packages/ui";
import { useRouter } from "next/navigation";

export default function FriendRequests() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const router = useRouter();

  type User = {
    id: number;
    username: string;
    name?: string | null;
    avatar?: string | null;
  };

  type FriendRequest = {
    id: number;
    sender: User;
  };

  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);

  // Load friends list
  const fetchFriends = () => {
    fetch(`${API_URL}/friends/list`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setFriends(data.friends));
  };

  // Load requests
  const fetchRequests = async () => {
    const res = await fetch(`${API_URL}/friends/requests`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) setRequests(data.requests);
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  // Accept friend request
  const accept = async (id: number) => {
    await fetch(`${API_URL}/friends/accept/${id}`, {
      method: "POST",
      credentials: "include",
    });

    fetchRequests();
    fetchFriends();
  };

  // Reject friend request
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
            {requests.map((req, index) => (
              <div key={req.id}>
                <div className="flex items-center justify-between py-3">
                  {/* Sender Info */}
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => accept(req.id)}
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

