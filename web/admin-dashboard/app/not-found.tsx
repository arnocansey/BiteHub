export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">BiteHub</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm text-slate-500">
          The admin page you requested could not be found. Return to the dashboard or sign in again.
        </p>
      </div>
    </main>
  );
}
