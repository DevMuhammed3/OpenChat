"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetch(`${API_URL}/friends/list`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setFriends(data.friends || []));
  }, []);

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-3 text-lg">Friends</h2>

      {friends.length === 0 && (
        <p className="text-muted-foreground text-sm">No friends yet.</p>
      )}

      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
          onClick={() => router.push(`/chat/${friend.id}`)}
        >
          @{friend.username}
        </div>
      ))}
    </div>
  );
}

