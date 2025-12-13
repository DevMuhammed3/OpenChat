"use client";

import { useState } from "react";
import { Input, Skeleton } from "packages/ui";

export default function AddFriend() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    if (!username.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send friend request");
        return;
      }

      setSuccess(`Friend request sent to @${username}`);
      setUsername("");
    } catch {
      setError("Something went wrong, try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendRequest();
    }
  };

  return (
    <div className="bg-card p-4 border-b border-border">
      {/* Input */}
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Add friend by username..."
        disabled={loading}
        className="rounded-lg"
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center space-x-4 mt-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive mt-3">
          {error}
        </p>
      )}

      {/* Success */}
      {success && (
        <p className="text-sm text-green-500 mt-3">
          {success}
        </p>
      )}
    </div>
  );
}

