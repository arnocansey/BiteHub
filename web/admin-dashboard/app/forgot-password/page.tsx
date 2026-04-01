"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json().catch(() => null)) as { message?: string; resetToken?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to request a password reset.");
      }

      setMessage(payload?.resetToken ? `Reset token: ${payload.resetToken}` : payload?.message ?? "Reset instructions sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a password reset.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to reset password.");
      }

      setMessage(payload?.message ?? "Password updated successfully.");
      setToken("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),transparent_30%),linear-gradient(180deg,#fafafa_0%,#fff7ed_100%)] p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-gradient-to-br from-orange-500 to-amber-400 p-10 text-white">
          <div className="flex justify-center">
            <Image src="/bitehub-icon.png" alt="BiteHub" width={220} height={220} className="h-[220px] w-[220px] object-contain drop-shadow-2xl" priority />
          </div>
          <p className="mt-5 text-center text-lg font-black uppercase tracking-[0.42em] text-white/80">BiteHub</p>
          <h1 className="mt-5 text-4xl font-semibold">Recover admin access</h1>
          <p className="mt-4 max-w-md text-sm text-white/75">
            Request a reset token from the auth API, then use it here to set a new password for your admin account.
          </p>
          <Link href="/login" className="mt-8 inline-flex rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            Back to sign in
          </Link>
        </div>

        <div className="space-y-8 p-10">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Forgot password</h2>
            <p className="mt-2 text-sm text-slate-500">Use the same backend auth flow that powers the mobile apps.</p>
          </div>

          <form className="space-y-4" onSubmit={handleRequestReset}>
            <label className="block text-sm font-medium text-slate-700">Admin email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white disabled:opacity-70"
            >
              {loading ? "Requesting..." : "Send reset token"}
            </button>
          </form>

          <form className="space-y-4 border-t border-slate-200 pt-8" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Reset token</label>
              <input
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste token"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">New password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </div>
            {error ? <p className="text-sm text-rose-500">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 font-semibold text-orange-700 disabled:opacity-70"
            >
              {loading ? "Updating..." : "Reset password"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
