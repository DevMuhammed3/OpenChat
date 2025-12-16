"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, ScrollArea } from "packages/ui";
import { Users, Loader2 } from "lucide-react";
import { socket } from "@openchat/lib";
import { cn } from "@openchat/lib";
import { api } from "@openchat/lib";

type Friend = {
  id: number;
  username: string;
  name?: string | null;
  avatar?: string | null;
};

interface FriendListProps {
  onSelectFriend?: (friend: Friend) => void;
}

export default function FriendList({ onSelectFriend }: FriendListProps) {
  const { username } = useParams<{ username?: string }>();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = async () => {
    try {
      const res = await api(`/friends/list`, {
        credentials: "include",
      });
      if (!res.ok) return;

      const data = await res.json();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error loading friends", err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadFriends();
  }, []);

  // realtime updates
  useEffect(() => {
    const onFriendAdded = () => loadFriends();

    socket.on("friend-added", onFriendAdded);
    return () => {
      socket.off("friend-added", onFriendAdded);
    }
  }, []);

  return (
    <div className="flex-1">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Friends</h2>
          {friends.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {friends.length}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!loading && friends.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No friends yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add friends to start chatting
            </p>
          </div>
        )}

        {/* List */}
        {!loading && friends.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {friends.map((friend) => {
                const isActive = username === friend.username;

                return (
                  <button
                    key={friend.id}
                    onClick={() => onSelectFriend?.(friend)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {friend.username?.[0]?.toUpperCase() || "F"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-md truncate">
                        {friend.name || `@${friend.username}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{friend.username}
                      </p>
                    </div>

                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

