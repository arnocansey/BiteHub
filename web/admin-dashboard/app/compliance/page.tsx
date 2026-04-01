"use client";

import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type TrustOverview = {
  openSupportTickets: number;
  stressedRestaurants: number;
  lowConfidenceEtas: number;
};

type SupportTicket = {
  id: string;
  subject: string;
  severity: string;
  status: string;
  order?: { id?: string; restaurant?: { name?: string } };
};

type VendorApproval = { id: string; businessName: string; user?: { firstName?: string; lastName?: string } };
type RiderApproval = { id: string; user?: { firstName?: string; lastName?: string } };

export default function CompliancePage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(
    async () => {
      const [trustOverview, supportTickets, vendors, riders] = await Promise.all([
        adminRequest<TrustOverview>("/admin/trust/overview"),
        adminRequest<SupportTicket[]>("/admin/support-tickets"),
        adminRequest<VendorApproval[]>("/admin/vendors/pending"),
        adminRequest<RiderApproval[]>("/admin/riders/pending")
      ]);

      return { trustOverview, supportTickets, vendors, riders };
    },
    [session?.accessToken]
  );

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to view compliance tools." />;
  if (!hasAdminAccess(session, "compliance")) {
    return <AccessDeniedCard message="Your manager role does not have access to compliance." />;
  }
  if (query.loading) return <LoadingCard label="Loading compliance data..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  return (
    <DashboardShell
      title="Compliance and intervention"
      description="This workspace brings together support escalations, low-confidence ETAs, and pending operational reviews for super admins and ops managers."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Open support tickets</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.trustOverview.openSupportTickets ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Low-confidence ETAs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.trustOverview.lowConfidenceEtas ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending vendors</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.vendors.length ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending riders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.riders.length ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Support escalation queue</h2>
          <div className="mt-5 space-y-3">
            {query.data?.supportTickets.length ? (
              query.data.supportTickets.slice(0, 8).map((ticket) => (
                <div key={ticket.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.order?.id ?? "Order"} • {ticket.order?.restaurant?.name ?? "Restaurant"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase text-orange-500">{ticket.severity}</p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.status.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyCard message="No support escalations are open right now." />
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Pending reviews</h2>
          <div className="mt-5 space-y-3">
            {(query.data?.vendors ?? []).slice(0, 4).map((vendor) => (
              <div key={vendor.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{vendor.businessName}</p>
                <p className="mt-1 text-sm text-slate-500">Vendor • {vendor.user?.firstName} {vendor.user?.lastName}</p>
              </div>
            ))}
            {(query.data?.riders ?? []).slice(0, 4).map((rider) => (
              <div key={rider.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{rider.user?.firstName} {rider.user?.lastName}</p>
                <p className="mt-1 text-sm text-slate-500">Rider approval review</p>
              </div>
            ))}
            {!query.data?.vendors.length && !query.data?.riders.length ? (
              <EmptyCard message="No vendor or rider reviews are pending." />
            ) : null}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
