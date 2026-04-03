"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CreditCard, Landmark, Search, Wallet } from "lucide-react";
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
  totalAmount: number | string;
  createdAt?: string;
  settlement?: {
    vendorPayoutAmount?: number | string;
    riderPayoutAmount?: number | string;
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
  summary: {
    eligibleVendorCount: number;
    eligibleRiderCount: number;
    vendorPayoutDue: number;
    riderPayoutDue: number;
    pendingRequestCount: number;
    approvedRequestCount: number;
    approvedRequestAmount: number;
  };
  payoutRequests: {
    pending: Array<{
      id: string;
      targetType: "VENDOR" | "RIDER";
      status: string;
      requestedAmount: number;
      approvedAmount: number;
      payeeName: string;
      contactName?: string;
      createdAt: string;
      note?: string | null;
      adminNote?: string | null;
      payoutMethod?: string | null;
      payoutReference?: string | null;
    }>;
    approved: Array<{
      id: string;
      targetType: "VENDOR" | "RIDER";
      status: string;
      requestedAmount: number;
      approvedAmount: number;
      payeeName: string;
      contactName?: string;
      createdAt: string;
      note?: string | null;
      adminNote?: string | null;
      payoutMethod?: string | null;
      payoutReference?: string | null;
    }>;
  };
  batches: Array<{
    id: string;
    createdAt: string;
    metadata?: {
      target?: string;
      totalAmount?: number;
      vendorCount?: number;
      riderCount?: number;
    } | null;
  }>;
};

function formatCurrency(value: number | string | null | undefined) {
  return `GHS ${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function compactCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  if (Math.abs(amount) >= 1000000) return `GHS ${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `GHS ${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "BH"
  );
}

export default function FinancePage() {
  const { session, ready } = useAdminSessionState();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [creatingTarget, setCreatingTarget] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [payingRequestId, setPayingRequestId] = useState<string | null>(null);
  const [paymentForms, setPaymentForms] = useState<Record<string, { payoutMethod: string; payoutReference: string }>>({});
  const [searchTerm, setSearchTerm] = useState("");

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

  const report = query.data?.report;
  const settings = query.data?.settings;
  const settlements = query.data?.settlements;
  const deliveredOrders = useMemo(
    () => (Array.isArray(query.data?.orders) ? query.data?.orders.filter((order) => order.status === "DELIVERED") : []),
    [query.data?.orders]
  );
  const vendorPayoutDue = settlements?.summary.vendorPayoutDue ?? 0;
  const riderPayoutDue = settlements?.summary.riderPayoutDue ?? 0;
  const netCashPosition = (report?.grossOrderValue ?? 0) - vendorPayoutDue - riderPayoutDue - (report?.taxPayable ?? 0);

  const financeBars = useMemo(() => {
    const rows = [
      { label: "Gross", value: report?.grossOrderValue ?? 0, color: "bg-slate-500" },
      { label: "Revenue", value: report?.revenue ?? 0, color: "bg-blue-500" },
      { label: "Vendor", value: vendorPayoutDue, color: "bg-fuchsia-500" },
      { label: "Rider", value: riderPayoutDue, color: "bg-cyan-500" },
      { label: "Tax", value: report?.taxPayable ?? 0, color: "bg-amber-400" },
      { label: "Net", value: Math.max(netCashPosition, 0), color: "bg-emerald-500" }
    ];
    const maxValue = Math.max(...rows.map((row) => row.value), 1);
    return rows.map((row) => ({ ...row, height: Math.max((row.value / maxValue) * 100, 12) }));
  }, [netCashPosition, report?.grossOrderValue, report?.revenue, report?.taxPayable, riderPayoutDue, vendorPayoutDue]);

  const expenseSegments = useMemo(() => {
    const rows = [
      { label: "Vendor payouts", value: vendorPayoutDue, color: "#38bdf8" },
      { label: "Rider payouts", value: riderPayoutDue, color: "#a855f7" },
      { label: "Tax reserve", value: report?.taxPayable ?? 0, color: "#f59e0b" },
      { label: "Service pool", value: report?.serviceFeeRevenue ?? 0, color: "#22c55e" }
    ];
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    let cursor = 0;
    return rows.map((row) => {
      const start = cursor;
      const share = total > 0 ? (row.value / total) * 100 : 0;
      cursor += share;
      return { ...row, share, start, end: cursor };
    });
  }, [report?.serviceFeeRevenue, report?.taxPayable, riderPayoutDue, vendorPayoutDue]);

  const activityRows = useMemo(() => {
    const rows = [
      ...(settlements?.payoutRequests.pending ?? []).map((request) => ({
        id: request.id,
        label: request.payeeName,
        detail: request.contactName || request.targetType,
        amount: request.requestedAmount,
        status: request.status,
        timestamp: request.createdAt
      })),
      ...(settlements?.payoutRequests.approved ?? []).map((request) => ({
        id: request.id,
        label: request.payeeName,
        detail: request.contactName || request.targetType,
        amount: request.approvedAmount || request.requestedAmount,
        status: request.status,
        timestamp: request.createdAt
      })),
      ...(settlements?.batches ?? []).map((batch) => ({
        id: batch.id,
        label: batch.metadata?.target ?? "Settlement batch",
        detail: `Vendors ${batch.metadata?.vendorCount ?? 0} • Riders ${batch.metadata?.riderCount ?? 0}`,
        amount: Number(batch.metadata?.totalAmount ?? 0),
        status: "BATCHED",
        timestamp: batch.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter((row) => {
        if (!searchTerm.trim()) return true;
        const haystack = `${row.label} ${row.detail} ${row.status}`.toLowerCase();
        return haystack.includes(searchTerm.trim().toLowerCase());
      });
    return rows.slice(0, 8);
  }, [searchTerm, settlements?.batches, settlements?.payoutRequests.approved, settlements?.payoutRequests.pending]);

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to access finance operations." />;
  if (!hasAdminAccess(session, "finance")) {
    return <AccessDeniedCard message="Only Admin Finance Manager or Platform Administrator accounts can access BiteHub finance operations." />;
  }
  if (query.loading) return <LoadingCard label="Loading finance data..." />;
  if (query.error) return <ErrorCard message={query.error} />;

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

  async function reviewPayoutRequest(requestId: string, decision: "approve" | "reject") {
    setReviewingRequestId(requestId);
    setActionMessage(null);
    try {
      await adminRequest(`/admin/finance/payout-requests/${requestId}/${decision}`, {
        method: "PATCH",
        body: JSON.stringify({})
      });
      setActionMessage(`Payout request ${decision}d successfully.`);
      await query.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to review payout request.");
    } finally {
      setReviewingRequestId(null);
    }
  }

  function getPaymentForm(requestId: string) {
    return paymentForms[requestId] ?? {
      payoutMethod: "MTN_MOBILE_MONEY",
      payoutReference: ""
    };
  }

  function updatePaymentForm(requestId: string, patch: Partial<{ payoutMethod: string; payoutReference: string }>) {
    setPaymentForms((current) => ({
      ...current,
      [requestId]: {
        ...getPaymentForm(requestId),
        ...patch
      }
    }));
  }

  async function payPayoutRequest(requestId: string) {
    const form = getPaymentForm(requestId);
    setPayingRequestId(requestId);
    setActionMessage(null);
    try {
      await adminRequest(`/admin/finance/payout-requests/${requestId}/pay`, {
        method: "PATCH",
        body: JSON.stringify({
          payoutMethod: form.payoutMethod,
          payoutReference: form.payoutReference || undefined
        })
      });
      setActionMessage(`Payout marked as paid via ${form.payoutMethod.replaceAll("_", " ").toLowerCase()}.`);
      await query.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to pay payout request.");
    } finally {
      setPayingRequestId(null);
    }
  }

  return (
    <DashboardShell
      title="Finance manager"
      description="Run BiteHub treasury from one dark command center using live payout, tax, settlement, and revenue data."
      session={session}
    >
      <section className="rounded-[34px] border border-white/10 bg-[#081120] p-4 shadow-[0_24px_80px_rgba(2,6,23,0.4)] md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/5 bg-[#0b1529] px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">BiteHub Treasury</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Finance command center</h2>
              </div>
              <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#09111f] px-4 py-3 text-slate-500 md:max-w-md">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search requests, batches, payees..."
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div className="rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: "Total balance",
                      value: formatCurrency(report?.revenue ?? 0),
                      note: `${report?.transactions ?? 0} transactions`,
                      icon: Wallet,
                      color: "text-blue-300"
                    },
                    {
                      label: "Debit",
                      value: formatCurrency(vendorPayoutDue + riderPayoutDue + (report?.taxPayable ?? 0)),
                      note: "Payouts and liabilities",
                      icon: ArrowDownRight,
                      color: "text-fuchsia-300"
                    },
                    {
                      label: "Credit",
                      value: formatCurrency(netCashPosition),
                      note: "Net position after liabilities",
                      icon: ArrowUpRight,
                      color: "text-emerald-300"
                    }
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <article key={card.label} className="rounded-[26px] border border-white/10 bg-[#08111f] p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-400">{card.label}</p>
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <p className="mt-5 text-3xl font-semibold text-white">{card.value}</p>
                        <p className="mt-3 text-xs text-slate-500">{card.note}</p>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[28px] border border-white/5 bg-[#08111f] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Transaction reports</h3>
                      <p className="text-sm text-slate-500">Live gross, payouts, tax, and net cash profile.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0f1b31] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Live
                    </div>
                  </div>
                  <div className="mt-8 flex h-64 items-end gap-4 rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.4),_rgba(2,6,23,0.95))] px-4 pb-5 pt-10">
                    {financeBars.map((bar) => (
                      <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-3">
                        <span className="text-xs font-semibold text-slate-500">{compactCurrency(bar.value)}</span>
                        <div className="flex h-44 w-full items-end rounded-full bg-white/[0.03] p-1">
                          <div className={`w-full rounded-full ${bar.color}`} style={{ height: `${bar.height}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">My cards</h3>
                  <button className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
                    Treasury active
                  </button>
                </div>
                <div className="rounded-[28px] bg-[linear-gradient(135deg,_#1d4ed8,_#7c3aed_55%,_#22d3ee)] p-[1px]">
                  <div className="rounded-[27px] bg-[#0b1529] p-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-sm font-medium">BiteHub settlement card</span>
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <p className="mt-10 text-3xl font-semibold tracking-[0.22em] text-white">
                      {String(report?.transactions ?? 0).padStart(4, "0")} {String(settlements?.summary.approvedRequestCount ?? 0).padStart(4, "0")} {String(settlements?.summary.pendingRequestCount ?? 0).padStart(4, "0")}
                    </p>
                    <div className="mt-6 flex items-end justify-between text-sm">
                      <div>
                        <p className="text-slate-400">Approved payout ready</p>
                        <p className="mt-1 font-semibold text-white">{formatCurrency(settlements?.summary.approvedRequestAmount ?? 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400">Delay policy</p>
                        <p className="mt-1 font-semibold text-white">{settings?.payoutDelayDays ?? 0} days</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => void createSettlementBatch("VENDORS")}
                    className="rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-sm font-semibold text-white transition hover:border-orange-400/40 hover:bg-[#0d1a2f]"
                  >
                    {creatingTarget === "VENDORS" ? "Creating..." : "Batch vendors"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void createSettlementBatch("RIDERS")}
                    className="rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-[#0d1a2f]"
                  >
                    {creatingTarget === "RIDERS" ? "Creating..." : "Batch riders"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void createSettlementBatch("ALL")}
                    className="col-span-2 rounded-2xl bg-orange-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-orange-400"
                  >
                    {creatingTarget === "ALL" ? "Creating..." : "Run full settlement"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-white">Recent transactions</h3>
                  <p className="mt-1 text-sm text-slate-500">Requests, approvals, and payout batches using real data.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#08111f] px-4 py-2 text-sm text-slate-400">{activityRows.length} shown</div>
              </div>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/5 bg-[#08111f]">
                <div className="grid grid-cols-[minmax(0,1.2fr)_120px_130px_130px] gap-3 border-b border-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span>Account</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Time</span>
                </div>
                <div className="divide-y divide-white/5">
                  {activityRows.length ? (
                    activityRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[minmax(0,1.2fr)_120px_130px_130px] gap-3 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-sm font-semibold text-white">{initials(row.label)}</div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{row.label}</p>
                            <p className="truncate text-xs text-slate-500">{row.detail}</p>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-white">{compactCurrency(row.amount)}</div>
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === "APPROVED" || row.status === "BATCHED" ? "bg-emerald-500/15 text-emerald-300" : row.status === "PENDING" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}>
                            {row.status.toLowerCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{new Date(row.timestamp).toLocaleString()}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-slate-500">No finance activity matches your search yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <article className="rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Expenses</h3>
                <Landmark className="h-5 w-5 text-slate-500" />
              </div>
              <div className="mt-6 flex justify-center">
                <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-slate-950/70">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(${expenseSegments
                        .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
                        .join(", ")})`
                    }}
                  />
                  <div className="absolute inset-[18px] rounded-full bg-[#08111f]" />
                  <div className="relative text-center">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{compactCurrency(vendorPayoutDue + riderPayoutDue + (report?.taxPayable ?? 0) + (report?.serviceFeeRevenue ?? 0))}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {expenseSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-slate-300">{segment.label}</span>
                    </div>
                    <span className="font-semibold text-white">{segment.share.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Approval desk</h3>
                <div className="rounded-2xl bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
                  {settlements?.payoutRequests.pending.length ?? 0} pending
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {(settlements?.payoutRequests.pending ?? []).length ? (
                  settlements?.payoutRequests.pending.map((request) => (
                    <div key={request.id} className="rounded-[24px] border border-white/5 bg-[#08111f] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{request.payeeName}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{request.targetType}</p>
                        </div>
                        <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">{compactCurrency(request.requestedAmount)}</div>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{request.contactName || "No contact label"}</p>
                      {request.note ? <p className="mt-2 text-xs leading-5 text-slate-500">Note: {request.note}</p> : null}
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void reviewPayoutRequest(request.id, "reject")}
                          className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                        >
                          {reviewingRequestId === request.id ? "Working..." : "Reject"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void reviewPayoutRequest(request.id, "approve")}
                          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          {reviewingRequestId === request.id ? "Working..." : "Approve"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-[#08111f] px-4 py-8 text-center text-sm text-slate-500">
                    No pending payout approvals right now.
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Payout requests</h3>
                <div className="rounded-2xl bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                  {settlements?.payoutRequests.approved.length ?? 0} ready to pay
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">Approve first, then send money by MTN Mobile Money, Vodafone Cash, or bank transfer.</p>
              <div className="mt-5 space-y-3">
                {(settlements?.payoutRequests.approved ?? []).length ? (
                  settlements?.payoutRequests.approved.map((request) => {
                    const form = getPaymentForm(request.id);
                    return (
                      <div key={request.id} className="rounded-[24px] border border-white/5 bg-[#08111f] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{request.payeeName}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{request.targetType}</p>
                          </div>
                          <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {compactCurrency(request.approvedAmount || request.requestedAmount)}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-400">{request.contactName || "No contact label"}</p>
                        <div className="mt-4 grid gap-3">
                          <select
                            value={form.payoutMethod}
                            onChange={(event) => updatePaymentForm(request.id, { payoutMethod: event.target.value })}
                            className="rounded-2xl border border-white/10 bg-[#0b1529] px-4 py-3 text-sm text-white outline-none"
                          >
                            <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option>
                            <option value="VODAFONE_CASH">Vodafone Cash</option>
                            <option value="BANK_TRANSFER">Bank transfer</option>
                          </select>
                          <input
                            type="text"
                            value={form.payoutReference}
                            onChange={(event) => updatePaymentForm(request.id, { payoutReference: event.target.value })}
                            placeholder="Reference / transaction ID"
                            className="rounded-2xl border border-white/10 bg-[#0b1529] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                          />
                          <button
                            type="button"
                            onClick={() => void payPayoutRequest(request.id)}
                            className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                          >
                            {payingRequestId === request.id ? "Paying..." : "Pay"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-[#08111f] px-4 py-8 text-center text-sm text-slate-500">
                    No approved payout requests are waiting for payment.
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[30px] border border-white/5 bg-[#0b1529] p-5">
              <h3 className="text-xl font-semibold text-white">Settlement policy</h3>
              <div className="mt-5 space-y-3">
                {[
                  ["Platform order commission", `${settings?.vendorCommissionRate ?? 0}%`],
                  ["Delivery platform fee", `${settings?.riderCommissionRate ?? 0}%`],
                  ["Service fee", `${settings?.serviceFeeRate ?? 0}%`],
                  ["Tax rate", `${settings?.taxRate ?? 0}%`],
                  ["Payout delay", `${settings?.payoutDelayDays ?? 0} days`],
                  ["Minimum payout", formatCurrency(settings?.minimumPayoutAmount ?? 0)],
                  ["Delivered orders", String(deliveredOrders.length)],
                  ["Approved request pool", formatCurrency(settlements?.summary.approvedRequestAmount ?? 0)]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-[#08111f] px-4 py-3 text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>

        {actionMessage ? <div className="mt-4 rounded-[24px] border border-orange-400/20 bg-orange-500/10 px-4 py-4 text-sm text-orange-200">{actionMessage}</div> : null}
      </section>
    </DashboardShell>
  );
}
