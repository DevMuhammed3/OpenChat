"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Skeleton } from "packages/ui";
import { socket } from "@openchat/lib";

export default function FriendList() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const router = useRouter();

  type Friend = {
    id: number;
    username: string;
    name?: string | null;
    avatar?: string | null;
  };

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Load friends (used also by socket events)
  const loadFriends = async () => {
    try {
      const res = await fetch(`${API_URL}/friends/list`, {
        credentials: "include",
      });
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error loading friends", error);
    } finally {
      setLoading(false);
    }
  };

  // First load
  useEffect(() => {
    loadFriends();
  }, []);

  // Real-time updates
  useEffect(() => {
    socket.on("friend-added", () => {
      console.log("Friend added — refreshing list...");
      loadFriends();
    });

    return () => {
      socket.off("friend-added");
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-3 text-lg">Friends</h2>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          ))}
        </div>
      )}

      {/* No friends */}
      {!loading && friends.length === 0 && (
        <p className="text-muted-foreground text-sm">No friends yet.</p>
      )}

      {/* Friends List */}
      {!loading &&
        friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
            onClick={() => router.push(`/zone/${friend.username}`)}
          >
            <User className="w-6 h-6" />
            {friend.username}
          </div>
        ))}
    </div>
  );
}

