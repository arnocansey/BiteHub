"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { getAdminManagerTitle, hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";
import { isWithinAdminDateRange, parseAdminDateRange } from "../../lib/admin-date-range";

type RevenueReport = {
  revenue: number;
  transactions: number;
  grossOrderValue: number;
  orderCommissionRevenue: number;
  deliveryPlatformRevenue: number;
  serviceFeeRevenue: number;
  subscriptionRevenue: number;
  taxPayable: number;
};
type RetentionReport = {
  activeSubscriptions: number;
  liveMealPlans: number;
  openGroupOrders: number;
  activeScheduledOrders: number;
  loyaltyMembers: number;
  averagePoints: number;
};
type Order = { id: string; status: string; totalAmount: number | string; placedAt?: string; restaurant?: { name?: string } };

export default function ReportsPage() {
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
  const query = useAdminData(
    async () => {
      const [report, retention, orders] = await Promise.all([
        adminRequest<RevenueReport>("/admin/reports/revenue"),
        adminRequest<RetentionReport>("/admin/reports/retention"),
        adminRequest<Order[]>("/admin/orders")
      ]);

      return { report, retention, orders };
    },
    [session?.accessToken]
  );
  const orders = useMemo(
    () => (query.data?.orders ?? []).filter((order) => isWithinAdminDateRange(order.placedAt, activeRange)),
    [activeRange, query.data?.orders]
  );
  const topRestaurants = Object.entries(
    orders.reduce<Record<string, number>>((accumulator, order) => {
      const key = order.restaurant?.name ?? "Unknown restaurant";
      accumulator[key] = (accumulator[key] ?? 0) + Number(order.totalAmount ?? 0);
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to see live reports." />;
  if (!hasAdminAccess(session, "reports")) {
    return <AccessDeniedCard message="Your manager role does not have access to reports." />;
  }
  if (query.loading) return <LoadingCard label="Loading reports..." />;
  if (query.error) return <ErrorCard message={query.error} />;
  const managerTitle = getAdminManagerTitle(session);

  return (
    <DashboardShell
      title="Reports and insights"
      description={`Reporting stays visible to ${managerTitle} accounts, but the navigation and workspace remain role-aware. The header range selector filters the order-based sections on this page.`}
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Platform revenue</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">GHS {(query.data?.report.revenue ?? 0).toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.report.transactions ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Gross order value</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">GHS {(query.data?.report.grossOrderValue ?? 0).toLocaleString()}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Order commission</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">GHS {(query.data?.report.orderCommissionRevenue ?? 0).toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Delivery platform fee</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">GHS {(query.data?.report.deliveryPlatformRevenue ?? 0).toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Service fee revenue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">GHS {(query.data?.report.serviceFeeRevenue ?? 0).toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Subscription revenue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">GHS {(query.data?.report.subscriptionRevenue ?? 0).toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100">
          <p className="text-sm text-amber-700">Tax payable to government</p>
          <p className="mt-2 text-2xl font-black text-amber-900">GHS {(query.data?.report.taxPayable ?? 0).toLocaleString()}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Orders tracked</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{orders.length}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tax note</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Platform revenue belongs to BiteHub. The tax total above is tracked separately as a government liability and should not be treated as company profit.
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Subscriptions</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.retention.activeSubscriptions ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Meal plans</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.retention.liveMealPlans ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Group orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.retention.openGroupOrders ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Scheduled orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.retention.activeScheduledOrders ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Loyalty members</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.retention.loyaltyMembers ?? 0}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Avg points</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{query.data?.retention.averagePoints ?? 0}</p>
        </article>
      </section>

      {topRestaurants.length ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Top restaurants by captured revenue</h2>
          <div className="mt-6 space-y-3">
            {topRestaurants.map(([name, value]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-900">{name}</span>
                <strong className="text-orange-500">GHS {value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyCard message="Revenue reports will appear here once paid orders exist." />
      )}
    </DashboardShell>
  );
}
