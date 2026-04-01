"use client";

import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { getAdminManagerTitle, hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type VendorApproval = { id: string; businessName: string; user?: { firstName?: string; lastName?: string; email?: string } };
type RiderApproval = { id: string; vehicleType?: string | null; user?: { firstName?: string; lastName?: string; email?: string } };

export default function ApprovalsPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(
    async () => {
      const [vendors, riders] = await Promise.all([
        adminRequest<VendorApproval[]>("/admin/vendors/pending"),
        adminRequest<RiderApproval[]>("/admin/riders/pending")
      ]);

      return { vendors, riders };
    },
    [session?.accessToken]
  );

  async function approveVendor(vendorId: string) {
    await adminRequest(`/admin/vendors/${vendorId}/approve`, { method: "PATCH" });
    await query.refresh();
  }

  async function approveRider(riderId: string) {
    await adminRequest(`/admin/riders/${riderId}/approve`, { method: "PATCH" });
    await query.refresh();
  }

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to review approvals." />;
  if (!hasAdminAccess(session, "approvals")) {
    return <AccessDeniedCard message="Your manager role does not have access to approvals." />;
  }
  if (query.loading) return <LoadingCard label="Loading approvals..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const managerTitle = getAdminManagerTitle(session);
  const showVendors = managerTitle === "Platform Administrator" || managerTitle === "Admin Vendor Manager";
  const showRiders = managerTitle === "Platform Administrator" || managerTitle === "Admin Rider Manager";

  return (
    <DashboardShell
      title="Approvals queue"
      description="Approval sections are split by manager role so vendor and rider operations stay focused."
      session={session}
    >
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Approvals</h1>
        <p className="mt-2 text-sm text-slate-500">Approve real vendors and riders from the database.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {showVendors ? (
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Pending vendors</h2>
            <div className="mt-4 space-y-3">
              {query.data?.vendors.length ? query.data.vendors.map((vendor) => (
                <div key={vendor.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{vendor.businessName}</p>
                  <p className="mt-1 text-sm text-slate-500">{vendor.user?.firstName} {vendor.user?.lastName} • {vendor.user?.email}</p>
                  <button onClick={() => void approveVendor(vendor.id)} className="mt-3 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                    Approve vendor
                  </button>
                </div>
              )) : <EmptyCard message="No vendors are waiting for approval." />}
            </div>
          </article>
        ) : null}

        {showRiders ? (
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Pending riders</h2>
            <div className="mt-4 space-y-3">
              {query.data?.riders.length ? query.data.riders.map((rider) => (
                <div key={rider.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{rider.user?.firstName} {rider.user?.lastName}</p>
                  <p className="mt-1 text-sm text-slate-500">{rider.user?.email} • {rider.vehicleType ?? "Vehicle type not set"}</p>
                  <button onClick={() => void approveRider(rider.id)} className="mt-3 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                    Approve rider
                  </button>
                </div>
              )) : <EmptyCard message="No riders are waiting for approval." />}
            </div>
          </article>
        ) : null}
      </section>
    </DashboardShell>
  );
}
