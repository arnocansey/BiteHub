"use client";

import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type RiderApproval = {
  id: string;
  vehicleType?: string | null;
  approvalStatus?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
};

type OperationsIntelligence = {
  activeRiderIncentives: number;
  heatmap: Array<{ id: string; zoneLabel: string; demandLevel: number; supplyLevel: number; activeOrders: number }>;
  qualityScores: Array<{
    id: string;
    scoreType: string;
    scoreValue: number;
    trend?: string | null;
    riderProfile?: { user?: { firstName?: string; lastName?: string } | null } | null;
  }>;
};

export default function RidersPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(
    async () => {
      const [pendingRiders, ops] = await Promise.all([
        adminRequest<RiderApproval[]>("/admin/riders/pending"),
        adminRequest<OperationsIntelligence>("/admin/reports/operations")
      ]);

      return { pendingRiders, ops };
    },
    [session?.accessToken]
  );

  async function approveRider(riderId: string) {
    await adminRequest(`/admin/riders/${riderId}/approve`, { method: "PATCH" });
    await query.refresh();
  }

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage riders." />;
  if (!hasAdminAccess(session, "riders")) {
    return <AccessDeniedCard message="Your manager role does not have access to the rider workspace." />;
  }
  if (query.loading) return <LoadingCard label="Loading riders..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const riderQuality = (query.data?.ops.qualityScores ?? []).filter((score) => score.riderProfile?.user);

  return (
    <DashboardShell
      title="Rider operations"
      description="Rider performance, pending approvals, and delivery-zone pressure are all surfaced here for super admins and rider managers."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending riders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.pendingRiders.length ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active incentives</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.ops.activeRiderIncentives ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Hot zones</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.ops.heatmap.length ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Pending rider approvals</h2>
          <div className="mt-5 space-y-3">
            {query.data?.pendingRiders.length ? (
              query.data.pendingRiders.map((rider) => (
                <div key={rider.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{rider.user?.firstName} {rider.user?.lastName}</p>
                      <p className="mt-1 text-sm text-slate-500">{rider.user?.email ?? "No email"} • {rider.vehicleType ?? "Vehicle type not set"}</p>
                    </div>
                    <button
                      onClick={() => void approveRider(rider.id)}
                      className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyCard message="No riders are waiting for approval." />
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Demand heatmap</h2>
          <div className="mt-5 space-y-3">
            {(query.data?.ops.heatmap ?? []).slice(0, 5).map((zone) => (
              <div key={zone.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{zone.zoneLabel}</p>
                <p className="mt-1 text-sm text-slate-500">Demand {zone.demandLevel}/10 • Supply {zone.supplyLevel}/10</p>
                <p className="mt-3 text-sm font-semibold text-orange-500">{zone.activeOrders} active deliveries</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Rider quality signals</h2>
        <div className="mt-5 space-y-3">
          {riderQuality.length ? (
            riderQuality.slice(0, 6).map((score) => (
              <div key={score.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {score.riderProfile?.user?.firstName} {score.riderProfile?.user?.lastName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{score.scoreType}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{Number(score.scoreValue ?? 0).toFixed(1)}</p>
                  <p className="mt-1 text-xs text-orange-500">{score.trend ?? "Stable"}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyCard message="No rider quality scores have been recorded yet." />
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
