"use client";

import { Bike, Clock3, Flame, MapPinned, Radio, Search, ShieldCheck, Siren, UserRound } from "lucide-react";
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

function formatRiderName(input?: { firstName?: string; lastName?: string } | null) {
  const full = [input?.firstName, input?.lastName].filter(Boolean).join(" ").trim();
  return full || "Unassigned rider";
}

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

  const pendingRiders = query.data?.pendingRiders ?? [];
  const heatmap = query.data?.ops.heatmap ?? [];
  const riderQuality = (query.data?.ops.qualityScores ?? []).filter((score) => score.riderProfile?.user);
  const focusedZone = heatmap[0] ?? null;
  const focusedRider = riderQuality[0] ?? null;
  const liveOrders = heatmap.reduce((sum, zone) => sum + Number(zone.activeOrders ?? 0), 0);
  const activeDrivers = riderQuality.length;
  const pendingPickups = pendingRiders.length;
  const averageDeliveryMinutes =
    heatmap.length > 0
      ? Math.round(heatmap.reduce((sum, zone) => sum + Number(zone.demandLevel ?? 0) * 3.2, 18) / heatmap.length)
      : 24;

  const feedRows = heatmap.length
    ? heatmap.flatMap((zone, zoneIndex) =>
        Array.from({ length: Math.min(3, Math.max(1, zone.activeOrders || 1)) }).map((_, rowIndex) => {
          const score = riderQuality[(zoneIndex + rowIndex) % Math.max(riderQuality.length, 1)];
          return {
            id: `${zone.id}-${rowIndex}`,
            orderCode: `BH-${String(zoneIndex + 1).padStart(2, "0")}${String(rowIndex + 7).padStart(2, "0")}`,
            customer: `Zone ${zoneIndex + 1} customer`,
            items: `${rowIndex + 1} item${rowIndex === 0 ? "" : "s"}`,
            restaurant: zone.zoneLabel,
            driver: score ? formatRiderName(score.riderProfile?.user) : "Dispatch pool",
            status: zone.demandLevel >= 7 ? "Surge" : zone.supplyLevel < zone.demandLevel ? "Dispatching" : "Stable",
            eta: `${Math.max(12, 18 + rowIndex * 4 + zoneIndex)} min`
          };
        })
      )
    : [];

  return (
    <DashboardShell
      title="Rider managers"
      description="Run live fleet operations, monitor demand pressure, and move riders where BiteHub needs them most."
      session={session}
    >
      <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-[#08111f] shadow-[0_32px_90px_rgba(2,6,23,0.45)]">
        <div className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.12),_transparent_24%),linear-gradient(180deg,#101827_0%,#09111d_100%)] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300/80">Delivery Ops Center</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Fleet dashboard</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  placeholder="Smart Search"
                  className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
              </label>

              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                <p className="font-semibold">Dynamic surge slider</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-300/70">
                  Active @ {focusedZone ? `${focusedZone.demandLevel / 10 + 1}` : "1.2"}x downtown
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-800 xl:grid-cols-[1.02fr_0.98fr] 2xl:grid-cols-[1.02fr_1.08fr_0.7fr]">
          <section className="bg-[#0b1424] p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Live orders", value: liveOrders, icon: Radio, accent: "from-emerald-400/20 to-emerald-500/5" },
                { label: "Active drivers", value: activeDrivers, icon: Bike, accent: "from-sky-400/20 to-sky-500/5" },
                { label: "Pending pickups", value: pendingPickups, icon: Clock3, accent: "from-amber-400/20 to-amber-500/5" },
                { label: "Avg delivery time", value: `${averageDeliveryMinutes} min`, icon: Flame, accent: "from-orange-400/20 to-orange-500/5" }
              ].map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl border border-slate-700 bg-gradient-to-br ${card.accent} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                    <card.icon className="h-4 w-4 text-slate-300" />
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                </article>
              ))}
            </div>

            <article className="mt-5 rounded-[26px] border border-slate-700 bg-[#0f1a2d] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Live order feed</p>
                  <p className="mt-1 text-sm text-slate-500">Current dispatch pressure by zone and rider pool.</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300">
                  {feedRows.length} queued rows
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
                <div className="grid grid-cols-[0.9fr_1.1fr_0.8fr_1.1fr_1fr_0.85fr_0.75fr] gap-3 bg-slate-900/90 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span>ID</span>
                  <span>Customer</span>
                  <span>Items</span>
                  <span>Restaurant</span>
                  <span>Driver</span>
                  <span>Status</span>
                  <span>ETA</span>
                </div>

                <div className="max-h-[430px] overflow-y-auto bg-[#0c1526]">
                  {feedRows.length ? (
                    feedRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`grid grid-cols-[0.9fr_1.1fr_0.8fr_1.1fr_1fr_0.85fr_0.75fr] gap-3 px-4 py-3 text-[13px] text-slate-200 ${
                          index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"
                        }`}
                      >
                        <span className="font-medium text-sky-300">{row.orderCode}</span>
                        <span>{row.customer}</span>
                        <span className="text-slate-400">{row.items}</span>
                        <span>{row.restaurant}</span>
                        <span className="truncate text-slate-300">{row.driver}</span>
                        <span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              row.status === "Surge"
                                ? "bg-amber-400/15 text-amber-300"
                                : row.status === "Dispatching"
                                  ? "bg-orange-400/15 text-orange-300"
                                  : "bg-emerald-400/15 text-emerald-300"
                            }`}
                          >
                            {row.status}
                          </span>
                        </span>
                        <span className="text-slate-300">{row.eta}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4">
                      <EmptyCard message="No live rider feed yet." />
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>

          <section className="relative overflow-hidden bg-[#07101d] p-5 2xl:border-l 2xl:border-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.15),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.12),transparent_18%),radial-gradient(circle_at_60%_75%,rgba(56,189,248,0.1),transparent_20%)]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

            <div className="relative h-full min-h-[540px] rounded-[28px] border border-slate-700 bg-[linear-gradient(180deg,rgba(15,23,42,0.65),rgba(2,6,23,0.85))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:min-h-[600px] 2xl:min-h-[720px]">
              <div className="absolute left-[12%] top-[22%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_10px_rgba(16,185,129,0.12)]" />
              <div className="absolute left-[28%] top-[34%] h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_0_10px_rgba(249,115,22,0.12)]" />
              <div className="absolute left-[43%] top-[48%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_10px_rgba(16,185,129,0.12)]" />
              <div className="absolute left-[63%] top-[26%] h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_0_10px_rgba(56,189,248,0.12)]" />
              <div className="absolute left-[74%] top-[60%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_10px_rgba(16,185,129,0.12)]" />
              <div className="absolute left-[58%] top-[72%] h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_0_10px_rgba(249,115,22,0.12)]" />
              <div className="absolute left-[19%] top-[62%] h-3 w-3 rounded-full bg-slate-200 shadow-[0_0_0_10px_rgba(226,232,240,0.08)]" />

              <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1000 800" preserveAspectRatio="none">
                <path d="M40 600 C180 560, 220 430, 340 410 S580 380, 660 520 820 690, 960 620" fill="none" stroke="rgba(226,232,240,0.22)" strokeWidth="8" />
                <path d="M80 180 C180 220, 300 260, 360 340 S540 460, 700 390 860 240, 920 120" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="6" />
                <path d="M110 90 C220 200, 260 310, 300 460 S420 670, 640 690 850 560, 900 420" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="5" />
                <path d="M240 120 C280 180, 340 220, 420 240 S590 250, 650 300 700 430, 760 500" fill="none" stroke="rgba(16,185,129,0.18)" strokeWidth="4" />
              </svg>

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fleet map</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Dispatch pressure map</h3>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                  {focusedZone ? focusedZone.zoneLabel : "No active zone"}
                </div>
              </div>

              <div className="relative mt-6 grid gap-3 md:grid-cols-3">
                {(heatmap.length ? heatmap.slice(0, 3) : []).map((zone) => (
                  <div key={zone.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{zone.zoneLabel}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Demand {zone.demandLevel}/10 · Supply {zone.supplyLevel}/10
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      {zone.activeOrders} active deliveries
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="bg-[#0a1220] p-5 xl:col-span-2 2xl:col-span-1 2xl:border-l 2xl:border-slate-800">
            <div className="rounded-[26px] border border-slate-700 bg-[#0f1829] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Action panel</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Focused dispatch lane</h3>
                </div>
                <Siren className="h-5 w-5 text-orange-300" />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{focusedZone?.zoneLabel ?? "Awaiting zone data"}</p>
                    <p className="text-xs text-slate-400">
                      {focusedZone ? `${focusedZone.activeOrders} live orders in focus` : "No hot zone selected"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned rider</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {focusedRider ? formatRiderName(focusedRider.riderProfile?.user) : "Dispatch pool"}
                      </p>
                      <p className="text-xs text-slate-400">{focusedRider?.scoreType ?? "Quality signal pending"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quality monitor</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {focusedRider ? Number(focusedRider.scoreValue ?? 0).toFixed(1) : "0.0"}
                  </p>
                  <p className="mt-1 text-sm text-emerald-300">{focusedRider?.trend ?? "Stable rider confidence"}</p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending approvals</p>
                  <div className="mt-3 space-y-2">
                    {pendingRiders.length ? (
                      pendingRiders.slice(0, 3).map((rider) => (
                        <div key={rider.id} className="rounded-2xl bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-white">{formatRiderName(rider.user)}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {rider.user?.email ?? "No email"} · {rider.vehicleType ?? "Vehicle type pending"}
                          </p>
                          <button
                            type="button"
                            onClick={() => void approveRider(rider.id)}
                            className="mt-3 inline-flex rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
                          >
                            Approve rider
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white/[0.03] p-3 text-sm text-slate-400">No riders awaiting approval.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/50 hover:bg-slate-800"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Manual re-dispatch
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/20"
                  >
                    <Siren className="h-4 w-4" />
                    Flag issue
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/35 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                  >
                    <Radio className="h-4 w-4" />
                    Send driver message
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </DashboardShell>
  );
}
