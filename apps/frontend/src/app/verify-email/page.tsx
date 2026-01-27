'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@openchat/lib";

export default function VerifyEmail() {
  const router = useRouter();

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
      setMessage("✅ Email verified successfully");

      setTimeout(() => {
        router.push("/zone");
        router.refresh();
      }, 1500);
    } else {
      setMessage(data.message || "❌ Invalid code");
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
      setMessage("📧 Verification code sent again");
    } else {
      setMessage(data.message || "Something went wrong");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded">
      <h2 className="text-xl font-bold mb-2">Verify your email</h2>

      <p className="text-sm text-gray-600 mb-4">
        We sent a 6-digit code to your email
      </p>

      <input
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border p-2 text-center text-xl tracking-widest"
        placeholder="------"
      />

      <button
        onClick={handleVerify}
        disabled={loading || code.length !== 6}
        className="w-full mt-4 bg-black text-white py-2 rounded"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <button
        onClick={handleResend}
        disabled={resending}
        className="w-full mt-2 text-sm underline"
      >
        {resending ? "Sending..." : "Resend code"}
      </button>

      {message && (
        <p className="text-center mt-3 text-sm">{message}</p>
      )}
    </div>
  );
}

