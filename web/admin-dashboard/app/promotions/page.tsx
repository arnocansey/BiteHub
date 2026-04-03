"use client";

import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type FleetWorkspace = {
  summary: {
    bonusIncome: number;
  };
  campaigns: Array<{
    id: string;
    title: string;
    description: string;
    zoneLabel?: string | null;
    bonusAmount: number;
    startsAt?: string | null;
    endsAt?: string | null;
    riderName: string;
  }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function PromotionsPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(() => adminRequest<FleetWorkspace>("/admin/riders/fleet"), [session?.accessToken]);

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage promotions." />;
  if (!hasAdminAccess(session, "promotions")) {
    return <AccessDeniedCard message="Your manager role does not have access to promotions." />;
  }
  if (query.loading) return <LoadingCard label="Loading promotions..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const campaigns = query.data?.campaigns ?? [];
  const totalBonusValue = campaigns.reduce((sum, campaign) => sum + Number(campaign.bonusAmount ?? 0), 0);

  return (
    <DashboardShell
      title="Promotions"
      description="Track live rider campaign incentives and the bonus load they are adding to BiteHub fleet performance."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active campaigns</p>
          <p className="mt-2 text-3xl font-semibold text-white">{campaigns.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bonus value in market</p>
          <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(totalBonusValue)}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Recorded bonus income</p>
          <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(query.data?.summary.bonusIncome ?? 0)}</p>
        </article>
      </section>

      {campaigns.length ? (
        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Live promotions workspace</h2>
              <p className="mt-2 text-sm text-slate-400">These campaigns are pulled from the real rider incentive records in the backend.</p>
            </div>
            <div className="rounded-2xl bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-300">
              Finance view
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{campaign.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{campaign.description}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {formatMoney(campaign.bonusAmount)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned rider</p>
                    <p className="mt-2 font-semibold text-white">{campaign.riderName}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Zone</p>
                    <p className="mt-2 font-semibold text-white">{campaign.zoneLabel || "All zones"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Starts</p>
                    <p className="mt-2 font-semibold text-white">{formatDate(campaign.startsAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ends</p>
                    <p className="mt-2 font-semibold text-white">{formatDate(campaign.endsAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyCard message="No active promotions exist yet." />
      )}
    </DashboardShell>
  );
}
