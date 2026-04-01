"use client";

import { useState } from "react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  customerProfile?: object | null;
  vendorProfile?: object | null;
  riderProfile?: object | null;
  adminProfile?: object | null;
};

export default function UsersPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(() => adminRequest<UserRecord[]>("/admin/users"), [session?.accessToken]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to view live users." />;
  if (!hasAdminAccess(session, "users")) {
    return <AccessDeniedCard message="Only Admin User Manager accounts can access the user workspace." />;
  }
  if (query.loading) return <LoadingCard label="Loading users..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const users = query.data ?? [];
  const totals = {
    customers: users.filter((user) => user.role === "CUSTOMER").length,
    vendors: users.filter((user) => user.role === "VENDOR").length,
    riders: users.filter((user) => user.role === "RIDER").length,
    admins: users.filter((user) => user.role === "ADMIN").length
  };

  async function promoteUser(userId: string) {
    setBusyUserId(userId);
    setActionError(null);

    try {
      await adminRequest(`/admin/users/${userId}/promote-admin`, {
        method: "PATCH",
        body: JSON.stringify({})
      });
      await query.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to promote this user.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <DashboardShell
      title="Customer and user management"
      description="This view follows the BiteHub admin UI and is reserved for the Admin User Manager workflow."
      session={session}
    >
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">User management</h1>
          <p className="mt-2 text-sm text-slate-500">Live user records from the BiteHub backend.</p>
          {actionError ? <p className="mt-3 text-sm text-rose-500">{actionError}</p> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Customers", totals.customers],
            ["Vendors", totals.vendors],
            ["Riders", totals.riders],
            ["Admins", totals.admins]
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            </article>
          ))}
        </section>

        {users.length ? (
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    {["Name", "Email", "Role", "Action"].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{user.firstName} {user.lastName}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-orange-500">{user.role}</td>
                      <td className="px-4 py-3">
                        {user.role === "CUSTOMER" ? (
                          <button
                            type="button"
                            onClick={() => void promoteUser(user.id)}
                            disabled={busyUserId === user.id}
                            className="rounded-2xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {busyUserId === user.id ? "Promoting..." : "Promote to Admin"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <EmptyCard message="No users are in the database yet." />
        )}
    </DashboardShell>
  );
}
