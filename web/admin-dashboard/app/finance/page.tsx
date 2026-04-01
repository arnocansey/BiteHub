"use client";

import { useState } from "react";
import { AccessDeniedCard, AuthRequiredCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

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

type Order = {
  id: string;
  status: string;
  subtotalAmount: number | string;
  deliveryFee: number | string;
  totalAmount: number | string;
  settlement?: {
    vendorPayoutAmount?: number | string;
    riderPayoutAmount?: number | string;
    netPlatformRevenue?: number | string;
    taxAmount?: number | string;
  } | null;
  restaurant?: { name?: string };
  delivery?: { riderProfile?: { user?: { firstName?: string; lastName?: string } } | null } | null;
};

type Settings = {
  vendorCommissionRate: number | string;
  riderCommissionRate: number | string;
  serviceFeeRate: number | string;
  taxRate: number | string;
  payoutDelayDays: number;
  minimumPayoutAmount: number | string;
};

type SettlementPreview = {
  settings: {
    payoutDelayDays: number;
    minimumPayoutAmount: number;
  };
  summary: {
    eligibleVendorCount: number;
    eligibleRiderCount: number;
    vendorPayoutDue: number;
    riderPayoutDue: number;
  };
  vendors: Array<{
    profileId: string;
    payeeName: string;
    contactName?: string;
    totalAmount: number;
    eligible: boolean;
    payoutVerified?: boolean;
  }>;
  riders: Array<{
    profileId: string;
    payeeName: string;
    totalAmount: number;
    eligible: boolean;
    vehicleType?: string;
  }>;
  batches: Array<{
    id: string;
    action: string;
    entityId?: string | null;
    createdAt: string;
    metadata?: {
      target?: string;
      totalAmount?: number;
      vendorCount?: number;
      riderCount?: number;
    } | null;
  }>;
};

export default function FinancePage() {
  const { session, ready } = useAdminSessionState();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [creatingTarget, setCreatingTarget] = useState<string | null>(null);
  const query = useAdminData(
    async () => {
      const [report, orders, settings, settlements] = await Promise.all([
        adminRequest<RevenueReport>("/admin/reports/revenue"),
        adminRequest<Order[]>("/admin/orders"),
        adminRequest<Settings>("/admin/settings"),
        adminRequest<SettlementPreview>("/admin/finance/settlements")
      ]);
      return { report, orders, settings, settlements };
    },
    [session?.accessToken]
  );

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to access finance operations." />;
  if (!hasAdminAccess(session, "finance")) {
    return <AccessDeniedCard message="Only platform administrators can access BiteHub finance operations." />;
  }
  if (query.loading) return <LoadingCard label="Loading finance data..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const report = query.data?.report;
  const deliveredOrders = (query.data?.orders ?? []).filter((order) => order.status === "DELIVERED");
  const settings = query.data?.settings;
  const vendorPayoutDue = query.data?.settlements.summary.vendorPayoutDue ?? 0;
  const riderPayoutDue = query.data?.settlements.summary.riderPayoutDue ?? 0;
  const netCashPosition = (report?.grossOrderValue ?? 0) - vendorPayoutDue - riderPayoutDue - (report?.taxPayable ?? 0);

  async function createSettlementBatch(target: "VENDORS" | "RIDERS" | "ALL") {
    setCreatingTarget(target);
    setActionMessage(null);
    try {
      await adminRequest("/admin/finance/settlements", {
        method: "POST",
        body: JSON.stringify({ target })
      });
      setActionMessage(`Settlement batch created for ${target.toLowerCase()}.`);
      await query.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to create settlement batch.");
    } finally {
      setCreatingTarget(null);
    }
  }

  return (
    <DashboardShell
      title="Finance and settlements"
      description="Track BiteHub platform revenue, tax liability, and estimated payouts due to vendors and riders."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Platform revenue</p>
          <p className="mt-2 text-3xl font-black text-slate-900">GHS {(report?.revenue ?? 0).toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Vendor payouts due</p>
          <p className="mt-2 text-3xl font-black text-slate-900">GHS {vendorPayoutDue.toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rider payouts due</p>
          <p className="mt-2 text-3xl font-black text-slate-900">GHS {riderPayoutDue.toLocaleString()}</p>
        </article>
        <article className="rounded-3xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100">
          <p className="text-sm text-amber-700">Tax liability</p>
          <p className="mt-2 text-3xl font-black text-amber-900">GHS {(report?.taxPayable ?? 0).toLocaleString()}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Settlement settings</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Platform order commission</span>
              <strong>{settings?.vendorCommissionRate}%</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Delivery platform fee</span>
              <strong>{settings?.riderCommissionRate}%</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Service fee</span>
              <strong>{settings?.serviceFeeRate}%</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Payout delay</span>
              <strong>{settings?.payoutDelayDays} days</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Minimum payout</span>
              <strong>GHS {Number(settings?.minimumPayoutAmount ?? 0).toLocaleString()}</strong>
            </div>
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Cash position</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Gross captured value</span>
              <strong>GHS {(report?.grossOrderValue ?? 0).toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Transactions</span>
              <strong>{report?.transactions ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Subscription revenue</span>
              <strong>GHS {(report?.subscriptionRevenue ?? 0).toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-4 text-white">
              <span>Estimated net cash after payouts and tax</span>
              <strong>GHS {netCashPosition.toLocaleString()}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Settlement actions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create payout batches for verified vendors and active riders who have crossed the minimum payout threshold.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void createSettlementBatch("VENDORS")} className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
              {creatingTarget === "VENDORS" ? "Creating..." : "Create vendor batch"}
            </button>
            <button type="button" onClick={() => void createSettlementBatch("RIDERS")} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              {creatingTarget === "RIDERS" ? "Creating..." : "Create rider batch"}
            </button>
            <button type="button" onClick={() => void createSettlementBatch("ALL")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              {creatingTarget === "ALL" ? "Creating..." : "Create full batch"}
            </button>
          </div>
        </div>
        {actionMessage ? <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-600">{actionMessage}</div> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Eligible vendors</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{query.data?.settlements.summary.eligibleVendorCount ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Eligible riders</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{query.data?.settlements.summary.eligibleRiderCount ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Delivered orders driving settlement</h2>
        <div className="mt-5 space-y-3">
          {deliveredOrders.slice(0, 8).map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
              <div>
                <p className="font-semibold text-slate-900">{order.restaurant?.name ?? "Restaurant"}</p>
                <p className="text-xs text-slate-500">{order.id}</p>
              </div>
              <div className="text-sm text-slate-600">
                Rider: {order.delivery?.riderProfile?.user?.firstName ?? "Unassigned"} {order.delivery?.riderProfile?.user?.lastName ?? ""}
              </div>
              <div className="text-right">
                <strong className="block text-orange-500">GHS {Number(order.totalAmount ?? 0).toLocaleString()}</strong>
                <p className="text-[11px] text-slate-500">
                  Vendor GHS {Number(order.settlement?.vendorPayoutAmount ?? 0).toLocaleString()} | Rider GHS{" "}
                  {Number(order.settlement?.riderPayoutAmount ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {!deliveredOrders.length ? <p className="text-sm text-slate-500">No delivered orders yet, so no settlements are due.</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Vendor payout queue</h2>
          <div className="mt-5 space-y-3">
            {(query.data?.settlements.vendors ?? []).slice(0, 8).map((vendor) => (
              <div key={vendor.profileId} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{vendor.payeeName}</p>
                  <p className="text-xs text-slate-500">{vendor.contactName || "Vendor account"}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{vendor.payoutVerified ? "Payout verified" : "Payout pending verification"}</p>
                </div>
                <div className="text-right">
                  <strong className="text-orange-500">GHS {vendor.totalAmount.toLocaleString()}</strong>
                  <p className={`text-[11px] font-semibold ${vendor.eligible ? "text-emerald-600" : "text-slate-400"}`}>{vendor.eligible ? "Eligible" : "Below threshold / not verified"}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Rider payout queue</h2>
          <div className="mt-5 space-y-3">
            {(query.data?.settlements.riders ?? []).slice(0, 8).map((rider) => (
              <div key={rider.profileId} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{rider.payeeName}</p>
                  <p className="text-xs text-slate-500">{rider.vehicleType || "Delivery rider"}</p>
                </div>
                <div className="text-right">
                  <strong className="text-orange-500">GHS {rider.totalAmount.toLocaleString()}</strong>
                  <p className={`text-[11px] font-semibold ${rider.eligible ? "text-emerald-600" : "text-slate-400"}`}>{rider.eligible ? "Eligible" : "Below threshold"}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Recent settlement batches</h2>
        <div className="mt-5 space-y-3">
          {(query.data?.settlements.batches ?? []).length ? (query.data?.settlements.batches ?? []).map((batch) => (
            <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
              <div>
                <p className="font-semibold text-slate-900">{batch.metadata?.target ?? "Settlement batch"}</p>
                <p className="text-xs text-slate-500">{new Date(batch.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-sm text-slate-600">
                Vendors: {batch.metadata?.vendorCount ?? 0} | Riders: {batch.metadata?.riderCount ?? 0}
              </div>
              <strong className="text-orange-500">GHS {Number(batch.metadata?.totalAmount ?? 0).toLocaleString()}</strong>
            </div>
          )) : <p className="text-sm text-slate-500">No settlement batches have been created yet.</p>}
        </div>
      </section>
    </DashboardShell>
  );
}
