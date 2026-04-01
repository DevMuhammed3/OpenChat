'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@openchat/lib";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/features/user/queries";
import type { AppUser } from "@/features/user/types";

export default function VerifyEmail() {
  const router = useRouter();
  const queryClient = useQueryClient()

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    setLoading(true);
    setMessage("");

    const res = await api("/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage(" Email verified successfully");

      setTimeout(() => {
        queryClient.setQueryData<AppUser | null>(userKeys.current(), (current) => {
          if (!current) return current
          return { ...current, emailVerified: true }
        })
        queryClient.invalidateQueries({ queryKey: userKeys.current() })
        router.push("/zone");
      }, 1500);
    } else {
      setMessage(data.message || "Invalid code");
    }
  }

  async function handleResend() {
    setResending(true);
    setMessage("");

    const res = await api("/auth/resend-email", {
      method: "POST",
    });

    const data = await res.json();
    setResending(false);

    if (res.ok) {
      setMessage("Verification code sent again");
    } else {
      setMessage(data.message || "Something went wrong");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0b1220] overflow-hidden">

      {/* subtle stars */}
      <div className="absolute inset-0 -z-10 opacity-5 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="w-full max-w-md bg-[#111a2b] border border-white/5 rounded-2xl p-8 shadow-2xl">

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Verify your email
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Input */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full bg-[#0f1626] border border-white/10 focus:border-white/20 rounded-xl py-4 text-center text-2xl tracking-[0.4em] text-white placeholder:text-white/30 transition"
        />

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full mt-6 bg-white text-black font-medium py-3 rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        {/* Resend */}
        <div className="text-center mt-4">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-white/50 hover:text-white transition disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-6 text-center text-sm font-medium ${message.includes("success")
              ? "text-green-400"
              : message.includes("sent")
                ? "text-blue-400"
                : "text-red-400"
              }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
