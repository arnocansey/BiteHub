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

type AdminOrder = {
  id: string;
  status: string;
  placedAt?: string;
  totalAmount: number | string;
  customer?: { firstName?: string; lastName?: string; email?: string } | null;
  restaurant?: { name?: string } | null;
  delivery?: {
    riderProfile?: {
      id: string;
      user?: { firstName?: string; lastName?: string } | null;
    } | null;
  } | null;
  etaPredictions?: Array<{ minutesAway?: number | null; confidencePercent?: number | null }> | null;
};

type NearbyRider = {
  id: string;
  vehicleType?: string | null;
  restaurantDistanceKm: number;
  customerDistanceKm: number;
  user?: { firstName?: string; lastName?: string } | null;
};

function formatRiderName(input?: { firstName?: string; lastName?: string } | null) {
  const full = [input?.firstName, input?.lastName].filter(Boolean).join(" ").trim();
  return full || "Unassigned rider";
}

function formatCustomerName(input?: { firstName?: string; lastName?: string } | null) {
  const full = [input?.firstName, input?.lastName].filter(Boolean).join(" ").trim();
  return full || "Customer";
}

function getZoneHeat(zone: { demandLevel: number; supplyLevel: number; activeOrders: number }) {
  const pressure = Number(zone.demandLevel ?? 0) - Number(zone.supplyLevel ?? 0) + Number(zone.activeOrders ?? 0) * 0.35;
  if (pressure >= 6) {
    return {
      label: "Red zone",
      dot: "bg-rose-500",
      svgFill: "#f43f5e",
      glow: "shadow-[0_0_0_14px_rgba(244,63,94,0.16)]",
      chip: "bg-rose-500/15 text-rose-200",
      panel: "border-rose-500/35 bg-rose-500/10"
    };
  }
  if (pressure >= 3.5) {
    return {
      label: "Warm zone",
      dot: "bg-orange-400",
      svgFill: "#fb923c",
      glow: "shadow-[0_0_0_14px_rgba(251,146,60,0.16)]",
      chip: "bg-orange-400/15 text-orange-200",
      panel: "border-orange-400/30 bg-orange-400/10"
    };
  }
  return {
    label: "Balanced",
    dot: "bg-emerald-400",
    svgFill: "#34d399",
    glow: "shadow-[0_0_0_14px_rgba(16,185,129,0.14)]",
    chip: "bg-emerald-400/15 text-emerald-200",
    panel: "border-emerald-400/25 bg-emerald-400/10"
  };
}

const ghanaMapAnchors = [
  { keywords: ["accra", "osu", "airport", "cantonments", "labone"], x: 59, y: 84 },
  { keywords: ["tema", "spintex", "sakumono", "ashaiman"], x: 66, y: 83 },
  { keywords: ["kasoa", "weija", "mallam"], x: 50, y: 82 },
  { keywords: ["madina", "east legon", "adenta", "legon"], x: 61, y: 78 },
  { keywords: ["kumasi", "suame", "asokwa", "knust"], x: 46, y: 57 },
  { keywords: ["cape coast", "takoradi", "sekondi", "western"], x: 26, y: 72 },
  { keywords: ["sunyani", "brong", "ahafo"], x: 36, y: 60 },
  { keywords: ["ho", "volta", "hohoe"], x: 68, y: 66 },
  { keywords: ["koforidua", "eastern"], x: 57, y: 69 },
  { keywords: ["tamale", "northern"], x: 49, y: 33 },
  { keywords: ["bolgatanga", "upper east"], x: 55, y: 16 },
  { keywords: ["wa", "upper west"], x: 28, y: 23 }
] as const;

function getGhanaZoneAnchor(zoneLabel: string, index: number) {
  const normalized = zoneLabel.toLowerCase();
  const matched = ghanaMapAnchors.find((anchor) => anchor.keywords.some((keyword) => normalized.includes(keyword)));
  if (matched) return matched;

  const fallbackAnchors = [
    { x: 59, y: 84 },
    { x: 46, y: 57 },
    { x: 49, y: 33 },
    { x: 26, y: 72 },
    { x: 68, y: 66 },
    { x: 36, y: 60 }
  ];

  return fallbackAnchors[index % fallbackAnchors.length];
}

export default function RidersPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(
    async () => {
      const [pendingRiders, ops, orders] = await Promise.all([
        adminRequest<RiderApproval[]>("/admin/riders/pending"),
        adminRequest<OperationsIntelligence>("/admin/reports/operations"),
        adminRequest<AdminOrder[]>("/admin/orders")
      ]);

      return { pendingRiders, ops, orders };
    },
    [session?.accessToken]
  );

  async function approveRider(riderId: string) {
    await adminRequest(`/admin/riders/${riderId}/approve`, { method: "PATCH" });
    await query.refresh();
  }

  const pendingRiders = query.data?.pendingRiders ?? [];
  const heatmap = query.data?.ops.heatmap ?? [];
  const orders = query.data?.orders ?? [];
  const riderQuality = (query.data?.ops.qualityScores ?? []).filter((score) => score.riderProfile?.user);
  const activeOrdersList = orders.filter((order) =>
    ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "IN_TRANSIT"].includes(order.status)
  );
  const rankedZones = [...heatmap].sort((left, right) => {
    const leftPressure = Number(left.demandLevel ?? 0) - Number(left.supplyLevel ?? 0) + Number(left.activeOrders ?? 0) * 0.35;
    const rightPressure = Number(right.demandLevel ?? 0) - Number(right.supplyLevel ?? 0) + Number(right.activeOrders ?? 0) * 0.35;
    return rightPressure - leftPressure;
  });
  const focusedOrder = activeOrdersList[0] ?? orders[0] ?? null;
  const focusedZone = rankedZones[0] ?? null;
  const focusedRider = riderQuality[0] ?? null;

  const nearbyRidersQuery = useAdminData(
    () =>
      focusedOrder?.id
        ? adminRequest<NearbyRider[]>(`/admin/orders/${focusedOrder.id}/nearby-riders`)
        : Promise.resolve([] as NearbyRider[]),
    [session?.accessToken, focusedOrder?.id]
  );

  const nearbyRiders = nearbyRidersQuery.data ?? [];
  const liveOrders = activeOrdersList.length;
  const activeDrivers = nearbyRiders.length || riderQuality.length;
  const pendingPickups = pendingRiders.length;
  const averageDeliveryMinutes =
    activeOrdersList.length > 0
      ? Math.round(
          activeOrdersList.reduce((sum, order) => sum + Number(order.etaPredictions?.[0]?.minutesAway ?? 24), 0) /
            activeOrdersList.length
        )
      : heatmap.length > 0
        ? Math.round(heatmap.reduce((sum, zone) => sum + Number(zone.demandLevel ?? 0) * 3.2, 18) / heatmap.length)
        : 24;

  const feedRows = activeOrdersList.map((order) => ({
    id: order.id,
    orderCode: order.id.slice(0, 8).toUpperCase(),
    customer: formatCustomerName(order.customer),
    items: "Live order",
    restaurant: order.restaurant?.name ?? "Restaurant",
    driver: order.delivery?.riderProfile?.user ? formatRiderName(order.delivery.riderProfile.user) : "Awaiting rider",
    status: order.status.replaceAll("_", " "),
    eta: `${Math.max(10, Number(order.etaPredictions?.[0]?.minutesAway ?? 24))} min`
  }));

  const hotZones = rankedZones.slice(0, 3).map((zone) => ({
    ...zone,
    heat: getZoneHeat(zone),
    nudgeDrivers: Math.max(1, Math.ceil(Math.max(0, zone.demandLevel - zone.supplyLevel) / 2))
  }));
  const focusedZoneHeat = focusedZone ? getZoneHeat(focusedZone) : null;

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage riders." />;
  if (!hasAdminAccess(session, "riders")) {
    return <AccessDeniedCard message="Your manager role does not have access to the rider workspace." />;
  }
  if (query.loading) return <LoadingCard label="Loading riders..." />;
  if (query.error) return <ErrorCard message={query.error} />;

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

              <div className={`rounded-2xl border px-4 py-3 text-sm ${focusedZoneHeat?.panel ?? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>
                <p className="font-semibold">Dynamic surge slider</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-200/80">
                  Active @ {focusedZone ? `${(focusedZone.demandLevel / 10 + 1).toFixed(1)}` : "1.2"}x {focusedZone?.zoneLabel ?? "dispatch zone"}
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
                  <p className="mt-1 text-sm text-slate-500">Real BiteHub orders currently moving through dispatch.</p>
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
                          <span className="inline-flex rounded-full bg-orange-400/15 px-2.5 py-1 text-[11px] font-semibold text-orange-200">
                            {row.status}
                          </span>
                        </span>
                        <span className="text-slate-300">{row.eta}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4">
                      <EmptyCard message="No live dispatch orders yet." />
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>

          <section className="relative overflow-hidden bg-[#07101d] p-5 2xl:border-l 2xl:border-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.14),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.12),transparent_18%),radial-gradient(circle_at_60%_75%,rgba(56,189,248,0.08),transparent_20%)]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

            <div className="relative h-full min-h-[540px] rounded-[28px] border border-slate-700 bg-[linear-gradient(180deg,rgba(15,23,42,0.65),rgba(2,6,23,0.85))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:min-h-[600px] 2xl:min-h-[720px]">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fleet map</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Ghana dispatch pressure map</h3>
                  <p className="mt-2 text-sm text-slate-400">Demand hotspots are projected onto Ghana dispatch zones so ops can nudge riders toward real pressure areas.</p>
                </div>
                <div className={`rounded-2xl border px-3 py-2 text-sm text-slate-200 ${focusedZoneHeat?.panel ?? "border-slate-700 bg-slate-900/70"}`}>
                  {focusedZone ? focusedZone.zoneLabel : "No active zone"}
                </div>
              </div>

              <div className="relative mt-6 overflow-hidden rounded-[28px] border border-slate-700 bg-[#07101d] p-4">
                <svg className="h-[360px] w-full md:h-[440px] xl:h-[500px]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="ghanaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(15,23,42,0.98)" />
                      <stop offset="100%" stopColor="rgba(30,41,59,0.95)" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M34 3 L47 6 L60 10 L71 17 L79 26 L82 36 L80 48 L77 59 L79 73 L76 84 L68 95 L58 97 L50 94 L43 88 L38 80 L33 70 L29 58 L26 45 L24 32 L26 20 L31 11 Z"
                    fill="url(#ghanaFill)"
                    stroke="rgba(251,146,60,0.5)"
                    strokeWidth="1.2"
                  />

                  <path d="M37 16 L46 28 L50 45 L48 58 L45 72" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.8" />
                  <path d="M52 14 L58 28 L61 46 L60 64 L57 82" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.8" />
                  <path d="M30 40 L44 43 L58 45 L76 44" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="0.8" />
                  <path d="M33 62 L48 64 L64 67 L77 70" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="0.8" />

                  {rankedZones.slice(0, 8).map((zone, index) => {
                    const heat = getZoneHeat(zone);
                    const anchor = getGhanaZoneAnchor(zone.zoneLabel, index);
                    const pulseColor =
                      heat.label === "Red zone" ? "rgba(244,63,94,0.22)" : heat.label === "Warm zone" ? "rgba(251,146,60,0.22)" : "rgba(16,185,129,0.2)";

                    return (
                      <g key={zone.id}>
                        <circle cx={anchor.x} cy={anchor.y} r="5.8" fill={pulseColor} />
                        <circle cx={anchor.x} cy={anchor.y} r="2.2" fill={heat.svgFill} />
                        <text x={anchor.x + 3} y={anchor.y - 3.5} fill="rgba(241,245,249,0.92)" fontSize="2.6" fontWeight="700">
                          {zone.zoneLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Heat key</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-200">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Red zone</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Warm zone</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Balanced</span>
                  </div>
                </div>
              </div>

              <div className="relative mt-6 grid gap-3 md:grid-cols-3">
                {hotZones.map((zone) => (
                  <div key={zone.id} className={`rounded-2xl border px-4 py-3 ${zone.heat.panel}`}>
                    <p className="text-sm font-semibold text-white">{zone.zoneLabel}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Demand {zone.demandLevel}/10 · Supply {zone.supplyLevel}/10
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        {zone.activeOrders} active deliveries
                      </p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${zone.heat.chip}`}>
                        {zone.heat.label}
                      </span>
                    </div>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pre-rush nudge</p>
                  {focusedZone ? (
                    <>
                      <p className="mt-3 text-lg font-semibold text-white">
                        Move {hotZones[0]?.nudgeDrivers ?? 1} rider{(hotZones[0]?.nudgeDrivers ?? 1) === 1 ? "" : "s"} toward {focusedZone.zoneLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Demand is outpacing available supply here. Push nearby drivers into this red zone before the rush starts.
                      </p>
                      <div className="mt-3 inline-flex rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
                        Highest demand zone
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">No demand hotspot is active yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned rider</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {focusedOrder?.delivery?.riderProfile?.user
                          ? formatRiderName(focusedOrder.delivery.riderProfile.user)
                          : nearbyRiders[0]?.user
                            ? formatRiderName(nearbyRiders[0].user)
                            : focusedRider
                              ? formatRiderName(focusedRider.riderProfile?.user)
                              : "Dispatch pool"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {focusedOrder?.delivery?.riderProfile?.user
                          ? "Currently assigned to focused order"
                          : nearbyRiders[0]
                            ? `${nearbyRiders[0].restaurantDistanceKm} km from restaurant`
                            : focusedRider?.scoreType ?? "Quality signal pending"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Focused order</p>
                  <p className="mt-3 text-lg font-semibold text-white">{focusedOrder?.restaurant?.name ?? "No active order selected"}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {focusedOrder ? `${formatCustomerName(focusedOrder.customer)} · ${focusedOrder.status.replaceAll("_", " ")}` : "Waiting for live order activity"}
                  </p>
                  <p className="mt-3 text-sm text-emerald-300">
                    {focusedOrder ? `ETA ${Math.max(10, Number(focusedOrder.etaPredictions?.[0]?.minutesAway ?? 24))} min` : "Stable rider confidence"}
                  </p>
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
