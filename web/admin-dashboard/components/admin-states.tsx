import Link from "next/link";

export function AuthRequiredCard({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{message}</p>
      <Link
        href="/login"
        className="mt-4 inline-flex rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
      >
        Go to login
      </Link>
    </section>
  );
}

export function LoadingCard({ label = "Loading live BiteHub data..." }: { label?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
    </section>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
      <p className="text-sm text-rose-600">{message}</p>
    </section>
  );
}

export function EmptyCard({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{message}</p>
    </section>
  );
}

export function AccessDeniedCard({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <p className="text-sm text-amber-700">{message}</p>
    </section>
  );
}
