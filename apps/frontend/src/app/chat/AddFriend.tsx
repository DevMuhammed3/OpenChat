"use client";

import { Input, Skeleton } from "packages/ui";
import { useState } from "react";

export default function AddFriend() {
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSend = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;

      setLoading(true);
      setError("");
      setResult(null);

      try {
        // 1) Search for username
        const res = await fetch(
          `${API_URL}/friends/search?username=${input}`,
          { credentials: "include" }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "User not found");
          setLoading(false);
          return;
        }

        setResult(data.user); // store the found user
        setLoading(false);

        // 2) Send friend request
      const sendRes = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        username: data.user.username
        }),
      });


        const sendData = await sendRes.json();

        if (!sendRes.ok) {
          setError(sendData.message || "Failed to send request");
          return;
        }

        console.log("Friend request sent:", sendData);

        // Clear input
        setInput("");
      } catch (err) {
        setError("Something went wrong");
      }

      setLoading(false);
    }
  };

  return (
    <div className="hidden md:block border-t bg-card p-4">
      {/* Friend Input */}
      <div className="flex items-end gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSend}
          placeholder="Type your friend’s username..."
          className="flex-1 scrollbar-hide resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm"
        />
      </div>

      {/* Loading skeleton */}
      {/*loading && (
      )*/}

        <div className="flex items-center space-x-4 m-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mt-2 ml-2">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="mt-3 ml-2">
          <p className="text-sm text-green-500">
            Request sent to @{result.username}
          </p>
        </div>
      )}
    </div>
  );
}

