"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  Bike,
  Package,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Users
} from "lucide-react";
import {
  AccessDeniedCard,
  AuthRequiredCard,
  EmptyCard,
  ErrorCard,
  LoadingCard
} from "../components/admin-states";
import { DashboardShell } from "../components/dashboard-shell";
import { getAdminManagerTitle, hasAdminAccess } from "../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../lib/admin-client";
import { isWithinAdminDateRange, parseAdminDateRange } from "../lib/admin-date-range";

type Overview = { users: number; orders: number; restaurants: number };
type TrustOverview = {
  openSupportTickets: number;
  stressedRestaurants: number;
  lowConfidenceEtas: number;
};
type OperationsIntelligence = {
  activeRiderIncentives: number;
  heatmap: Array<{ id: string; zoneLabel: string; demandLevel: number; supplyLevel: number; activeOrders: number }>;
  qualityScores: Array<{
    id: string;
    scoreType: string;
    scoreValue: number;
    trend?: string | null;
    restaurant?: { name?: string } | null;
    riderProfile?: { user?: { firstName?: string; lastName?: string } | null } | null;
  }>;
  forecasts: Array<{ id: string; windowLabel: string; expectedOrders: number; confidencePercent: number; restaurant?: { name?: string } | null }>;
};
type SupportTicket = {
  id: string;
  subject: string;
  severity: string;
  status: string;
  order?: { id?: string; restaurant?: { name?: string } };
};
type Order = {
  id: string;
  status: string;
  totalAmount: number | string;
  placedAt?: string;
  customer?: { firstName?: string; lastName?: string };
  restaurant?: { name?: string };
};

export default function HomePage() {
  const { session, ready } = useAdminSessionState();
  const [activeRange, setActiveRange] = useState<ReturnType<typeof parseAdminDateRange>>("today");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setActiveRange(parseAdminDateRange(params.get("range")));
    const handleRangeChange = (event: Event) => {
      setActiveRange(parseAdminDateRange((event as CustomEvent<string>).detail));
    };
    window.addEventListener("bitehub-admin-range-change", handleRangeChange as EventListener);
    return () => window.removeEventListener("bitehub-admin-range-change", handleRangeChange as EventListener);
  }, []);
  const overviewQuery = useAdminData(() => adminRequest<Overview>("/admin/overview"), [session?.accessToken]);
  const ordersQuery = useAdminData(() => adminRequest<Order[]>("/admin/orders"), [session?.accessToken]);
  const approvalsQuery = useAdminData(
    async () => {
      const [vendors, riders] = await Promise.all([
        adminRequest<any[]>("/admin/vendors/pending"),
        adminRequest<any[]>("/admin/riders/pending")
      ]);

      return { vendors, riders };
    },
    [session?.accessToken]
  );
  const reportQuery = useAdminData(() => adminRequest<{ revenue: number; transactions: number }>("/admin/reports/revenue"), [session?.accessToken]);
  const trustQuery = useAdminData(
    async () => {
      const [overview, tickets] = await Promise.all([
        adminRequest<TrustOverview>("/admin/trust/overview"),
        adminRequest<SupportTicket[]>("/admin/support-tickets")
      ]);

      return { overview, tickets };
    },
    [session?.accessToken]
  );
  const opsQuery = useAdminData(
    () => adminRequest<OperationsIntelligence>("/admin/reports/operations"),
    [session?.accessToken]
  );

  const metrics = useMemo(() => {
    const overview = overviewQuery.data;
    const orders = (ordersQuery.data ?? []).filter((order) => isWithinAdminDateRange(order.placedAt, activeRange));
    const delivered = orders.filter((order) => order.status === "DELIVERED").length;
    const active = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;
    const readyForPickup = orders.filter((order) => order.status === "READY_FOR_PICKUP").length;

    return [
      { label: "Users", value: overview?.users ?? 0, icon: Users },
      { label: "Orders", value: orders.length, icon: ShoppingBag },
      { label: "Restaurants", value: overview?.restaurants ?? 0, icon: Store },
      { label: "Revenue", value: `GHS ${(reportQuery.data?.revenue ?? 0).toLocaleString()}`, icon: TrendingUp },
      { label: "Delivered", value: delivered, icon: Package },
      { label: "Ready For Pickup", value: readyForPickup, icon: Bike },
      { label: "Active Orders", value: active, icon: BarChart2 },
      { label: "Pending Approvals", value: (approvalsQuery.data?.vendors.length ?? 0) + (approvalsQuery.data?.riders.length ?? 0), icon: Star }
    ];
  }, [approvalsQuery.data, ordersQuery.data, overviewQuery.data, reportQuery.data]);

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to load live BiteHub metrics." />;
  if (!hasAdminAccess(session, "overview")) {
    return <AccessDeniedCard message="This dashboard area is not available for your manager role." />;
  }
  if (overviewQuery.loading || ordersQuery.loading || approvalsQuery.loading || reportQuery.loading || trustQuery.loading || opsQuery.loading) {
    return <LoadingCard />;
  }
  if (overviewQuery.error || ordersQuery.error || approvalsQuery.error || reportQuery.error || trustQuery.error || opsQuery.error) {
    return <ErrorCard message={overviewQuery.error ?? ordersQuery.error ?? approvalsQuery.error ?? reportQuery.error ?? trustQuery.error ?? opsQuery.error ?? "Unable to load the dashboard."} />;
  }

  const orders = (ordersQuery.data ?? []).filter((order) => isWithinAdminDateRange(order.placedAt, activeRange));
  const topOrders = orders.slice(0, 6);
  const managerTitle = getAdminManagerTitle(session);

  return (
    <DashboardShell
      title="Live operations overview"
      description={`This workspace follows the BiteHub admin UI and adapts what each manager sees. ${managerTitle} accounts land in a focused control surface instead of a one-size-fits-all dashboard. The current header filter is applied to order-driven sections here.`}
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100">
              <metric.icon className="h-5 w-5 text-orange-500" />
            </div>
            <p className="mt-4 text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Latest orders</h2>
            <p className="text-sm text-slate-500">{orders.length} total</p>
          </div>
          {topOrders.length ? (
            <div className="mt-6 space-y-3">
              {topOrders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{order.id}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {(order.customer?.firstName ?? "Customer") + " " + (order.customer?.lastName ?? "")} • {order.restaurant?.name ?? "Restaurant"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">GHS {Number(order.totalAmount ?? 0).toLocaleString()}</p>
                      <p className="mt-1 text-xs font-semibold text-orange-500">{order.status.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard message="No orders have been placed yet." />
          )}
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Queue snapshot</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
              <span>Pending vendors</span>
              <strong>{approvalsQuery.data?.vendors.length ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
              <span>Pending riders</span>
              <strong>{approvalsQuery.data?.riders.length ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
              <span>Paid transactions</span>
              <strong>{reportQuery.data?.transactions ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3">
              <span>Open support tickets</span>
              <strong>{trustQuery.data?.overview.openSupportTickets ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3">
              <span>Busy or paused restaurants</span>
              <strong>{trustQuery.data?.overview.stressedRestaurants ?? 0}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Trust and recovery queue</h2>
          <p className="text-sm text-slate-500">Low-confidence ETAs: {trustQuery.data?.overview.lowConfidenceEtas ?? 0}</p>
        </div>
        {(trustQuery.data?.tickets.length ?? 0) > 0 ? (
          <div className="mt-6 space-y-3">
            {trustQuery.data?.tickets.slice(0, 5).map((ticket) => (
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
            ))}
          </div>
        ) : (
          <EmptyCard message="No open support tickets yet." />
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Demand heatmap</h2>
            <p className="text-sm text-slate-500">{opsQuery.data?.activeRiderIncentives ?? 0} active rider incentives</p>
          </div>
          <div className="mt-6 space-y-3">
            {(opsQuery.data?.heatmap ?? []).slice(0, 4).map((zone) => (
              <div key={zone.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{zone.zoneLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">Demand {zone.demandLevel}/10 • Supply {zone.supplyLevel}/10</p>
                  </div>
                  <p className="text-sm font-semibold text-orange-500">{zone.activeOrders} live orders</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Forecast windows</h2>
          <div className="mt-6 space-y-3">
            {(opsQuery.data?.forecasts ?? []).slice(0, 4).map((forecast) => (
              <div key={forecast.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{forecast.restaurant?.name ?? "Restaurant"}</p>
                <p className="mt-1 text-sm text-slate-500">{forecast.windowLabel}</p>
                <p className="mt-3 text-sm font-semibold text-orange-500">{forecast.expectedOrders} expected orders • {forecast.confidencePercent}% confidence</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Quality signals</h2>
          <div className="mt-6 space-y-3">
            {(opsQuery.data?.qualityScores ?? []).slice(0, 4).map((score) => (
              <div key={score.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{score.restaurant?.name ?? score.riderProfile?.user?.firstName ?? score.scoreType}</p>
                <p className="mt-1 text-sm text-slate-500">{score.scoreType}</p>
                <p className="mt-3 text-sm font-semibold text-orange-500">{Number(score.scoreValue ?? 0).toFixed(1)} {score.trend ? `• ${score.trend}` : ""}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
