"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveAdminSession } from "../../lib/admin-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            accessToken?: string;
            refreshToken?: string;
            user?: {
              id: string;
              email: string;
              firstName: string;
              lastName: string;
              role: string;
              adminProfile?: {
                id: string;
                userId: string;
                title?: string | null;
                isSuperAdmin?: boolean;
              } | null;
            };
          }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to sign in.");
      }

      if (payload?.user?.role !== "ADMIN" || !payload.accessToken || !payload.refreshToken) {
        throw new Error("This account does not have admin access.");
      }

      saveAdminSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user
      });

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),transparent_30%),linear-gradient(180deg,#fafafa_0%,#fff7ed_100%)] p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-gradient-to-br from-orange-500 to-amber-400 p-10 text-white">
          <div className="flex justify-center">
            <Image src="/bitehub-icon.png" alt="BiteHub" width={220} height={220} className="h-[220px] w-[220px] object-contain drop-shadow-2xl" priority />
          </div>
          <p className="mt-5 text-center text-lg font-black uppercase tracking-[0.42em] text-white/80">BiteHub</p>
          <h1 className="mt-5 text-4xl font-semibold">Admin command center</h1>
          <p className="mt-4 max-w-md text-sm text-white/75">
            Sign in with a real admin account to view live users, orders, approvals, reports, and platform settings.
          </p>
        </div>

        <div className="p-10">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">
            This form now connects directly to the backend auth API.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            {error ? <p className="text-sm text-rose-500">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Continue to dashboard"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/forgot-password" className="font-medium text-orange-600 transition hover:text-orange-700">
              Forgot password
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/signup" className="font-medium text-orange-600 transition hover:text-orange-700">
              Create admin account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
