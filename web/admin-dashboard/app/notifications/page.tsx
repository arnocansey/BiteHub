"use client";

import { FormEvent, useState } from "react";
import { AccessDeniedCard, AuthRequiredCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { session, ready } = useAdminSessionState();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const notificationsQuery = useAdminData(
    async () => adminRequest<NotificationItem[]>("/notifications"),
    [session?.accessToken]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await adminRequest<{ delivered: number }>("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          role: role || undefined
        })
      });

      setMessage(`Broadcast delivered to ${result.delivered} user(s).`);
      setTitle("");
      setBody("");
      setRole("");
      await notificationsQuery.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send broadcast.");
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setActionMessage(null);
    try {
      const result = await adminRequest<{ updated: number }>("/notifications/read-all", { method: "PATCH" });
      setActionMessage(result.updated ? `Marked ${result.updated} notification(s) as read.` : "All notifications are already read.");
      await notificationsQuery.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update notifications.");
    }
  }

  async function clearRead() {
    setActionMessage(null);
    try {
      const result = await adminRequest<{ deleted: number }>("/notifications/clear-read", { method: "DELETE" });
      setActionMessage(result.deleted ? `Cleared ${result.deleted} read notification(s).` : "There are no read notifications to clear.");
      await notificationsQuery.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear notifications.");
    }
  }

  async function markNotificationRead(notificationId: string) {
    setActionMessage(null);
    try {
      await adminRequest(`/notifications/${notificationId}/read`, { method: "PATCH" });
      await notificationsQuery.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this notification.");
    }
  }

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to send notifications." />;
  if (!hasAdminAccess(session, "notifications")) {
    return <AccessDeniedCard message="Only Customer Service Manager accounts can send platform-wide notifications." />;
  }
  if (error) return <ErrorCard message={error} />;

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <DashboardShell
      title="Platform notifications"
      description="Broadcast messages, monitor admin alerts, and clear read notifications from one workspace."
      session={session}
    >
      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Broadcast Center</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Send a platform-wide update</h3>
              <p className="mt-2 text-sm text-slate-500">Use this for order issues, city-wide alerts, promos, and important service updates.</p>
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Notification title"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Message body"
              className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              <option value="">All roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="VENDOR">Vendors</option>
              <option value="RIDER">Riders</option>
              <option value="ADMIN">Admins</option>
            </select>
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send broadcast"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Inbox Controls</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Admin notifications</h3>
              <p className="mt-2 text-sm text-slate-500">{unreadCount} unread notification(s) waiting for review.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="rounded-2xl border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => void clearRead()}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Clear read
              </button>
            </div>
          </div>

          {actionMessage ? <p className="mt-4 text-sm text-emerald-600">{actionMessage}</p> : null}

          <div className="mt-5 space-y-3">
            {notificationsQuery.loading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Loading notifications...</div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void markNotificationRead(notification.id)}
                  className={`block w-full rounded-2xl border px-4 py-4 text-left transition ${
                    notification.isRead
                      ? "border-slate-100 bg-slate-50"
                      : "border-orange-100 bg-orange-50/60 hover:bg-orange-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{notification.body}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        notification.isRead ? "bg-white text-slate-400" : "bg-orange-500 text-white"
                      }`}
                    >
                      {notification.isRead ? "Read" : "New"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No notifications yet.</div>
            )}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
