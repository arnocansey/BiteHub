"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveAdminSession } from "../../lib/admin-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const adminTypes = [
  "Admin User Manager",
  "Admin Rider Manager",
  "Admin Finance Manager",
  "Admin Customer Service Manager",
  "Admin Vendor Manager"
] as const;

function sanitizePhone(value: string) {
  return value.replace(/[^\d+\-\s()]/g, "");
}

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState<(typeof adminTypes)[number]>(adminTypes[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone.trim() || undefined,
          password,
          role: "ADMIN",
          title
        })
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
        throw new Error(payload?.message ?? "Unable to create admin account.");
      }

      if (payload?.user?.role !== "ADMIN" || !payload.accessToken || !payload.refreshToken) {
        throw new Error("Admin account was created, but the session could not be started.");
      }

      saveAdminSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user
      });

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create admin account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),transparent_30%),linear-gradient(180deg,#fafafa_0%,#fff7ed_100%)] p-6">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1fr_1fr]">
        <div className="bg-gradient-to-br from-slate-900 to-orange-500 p-10 text-white">
          <div className="flex justify-center">
            <Image src="/bitehub-icon.png" alt="BiteHub" width={220} height={220} className="h-[220px] w-[220px] object-contain drop-shadow-2xl" priority />
          </div>
          <p className="mt-5 text-center text-lg font-black uppercase tracking-[0.42em] text-white/80">BiteHub</p>
          <h1 className="mt-5 text-4xl font-semibold">Create an admin account</h1>
          <p className="mt-4 max-w-md text-sm text-white/75">
            Sign up as a platform admin and choose the responsibility area you want this account to manage.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/80">
            {adminTypes.map((item) => (
              <div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-10">
          <h2 className="text-2xl font-semibold text-slate-900">Admin sign up</h2>
          <p className="mt-2 text-sm text-slate-500">
            This creates a real admin user and signs you straight into the dashboard.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@bitehub.app"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(sanitizePhone(event.target.value))}
              placeholder="Phone number"
              inputMode="tel"
              autoComplete="tel"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <select
              value={title}
              onChange={(event) => setTitle(event.target.value as (typeof adminTypes)[number])}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
            >
              {adminTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
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
              {loading ? "Creating account..." : "Create admin account"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/login" className="font-medium text-orange-600 transition hover:text-orange-700">
              Already have an admin account? Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
