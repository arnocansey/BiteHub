"use client";

import { useMemo, useState } from "react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type Order = {
  id: string;
  status: string;
  totalAmount: number | string;
  customer?: { firstName?: string; lastName?: string };
  restaurant?: { name?: string };
  delivery?: { riderProfile?: { user?: { firstName?: string; lastName?: string } } | null } | null;
};

type NearbyRider = {
  id: string;
  vehicleType?: string | null;
  restaurantDistanceKm: number;
  customerDistanceKm: number;
  user?: { firstName?: string; lastName?: string };
};

export default function OrdersPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(() => adminRequest<Order[]>("/admin/orders"), [session?.accessToken]);
  const [nearbyByOrder, setNearbyByOrder] = useState<Record<string, NearbyRider[]>>({});
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unassigned" | "active" | "delivered">("all");

  const orders = query.data ?? [];
  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;
    if (activeFilter === "unassigned") return orders.filter((order) => !order.delivery?.riderProfile);
    if (activeFilter === "active") {
      return orders.filter((order) =>
        ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "IN_TRANSIT"].includes(order.status)
      );
    }
    return orders.filter((order) => order.status === "DELIVERED");
  }, [activeFilter, orders]);
  const summary = {
    preparing: orders.filter((order) => order.status === "PREPARING").length,
    ready: orders.filter((order) => order.status === "READY_FOR_PICKUP").length,
    transit: orders.filter((order) => order.status === "IN_TRANSIT").length,
    delivered: orders.filter((order) => order.status === "DELIVERED").length
  };

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to view live orders." />;
  if (!hasAdminAccess(session, "orders")) {
    return <AccessDeniedCard message="Only Customer Service Manager accounts can access the live order board." />;
  }
  if (query.loading) return <LoadingCard label="Loading orders..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  async function loadNearbyRiders(orderId: string) {
    setBusyOrderId(orderId);
    setActionMessage(null);
    try {
      const riders = await adminRequest<NearbyRider[]>(`/admin/orders/${orderId}/nearby-riders`);
      setNearbyByOrder((current) => ({ ...current, [orderId]: riders }));
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to load nearby riders.");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function assignRider(orderId: string, riderProfileId: string) {
    setBusyOrderId(orderId);
    setActionMessage(null);
    try {
      await adminRequest(`/admin/orders/${orderId}/assign-rider`, {
        method: "PATCH",
        body: JSON.stringify({ riderProfileId })
      });
      setActionMessage("Rider assigned successfully.");
      await query.refresh();
      await loadNearbyRiders(orderId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to assign rider.");
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <DashboardShell
      title="Order monitoring"
      description="This order board is reserved for customer-service operations and mirrors the BiteHub admin UI structure."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Preparing", summary.preparing],
          ["Ready for pickup", summary.ready],
          ["In transit", summary.transit],
          ["Delivered", summary.delivered]
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        {[
          ["all", "All orders"],
          ["unassigned", "Need rider"],
          ["active", "Active"],
          ["delivered", "Delivered"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveFilter(id as typeof activeFilter)}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              activeFilter === id ? "bg-orange-500 text-white" : "bg-white text-slate-600 shadow-sm hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      {filteredOrders.length ? (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {actionMessage ? <div className="border-b border-slate-100 bg-orange-50 px-4 py-3 text-sm text-orange-600">{actionMessage}</div> : null}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <tr>
                  {["Order", "Customer", "Restaurant", "Amount", "Status", "Dispatch"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{order.id}</td>
                    <td className="px-4 py-3 text-slate-600">{order.customer?.firstName ?? "Customer"} {order.customer?.lastName ?? ""}</td>
                    <td className="px-4 py-3 text-slate-600">{order.restaurant?.name ?? "Restaurant"}</td>
                    <td className="px-4 py-3 text-slate-900">GHS {Number(order.totalAmount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-orange-500">{order.status.replaceAll("_", " ")}</p>
                        <p className="text-[11px] text-slate-400">{order.delivery?.riderProfile ? "Assigned" : "Awaiting rider"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500">
                          {order.delivery?.riderProfile?.user
                            ? `Assigned to ${order.delivery.riderProfile.user.firstName ?? "Rider"} ${order.delivery.riderProfile.user.lastName ?? ""}`.trim()
                            : "No rider assigned"}
                        </p>
                        <button
                          type="button"
                          onClick={() => loadNearbyRiders(order.id)}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"
                        >
                          {busyOrderId === order.id ? "Loading..." : "Nearby riders"}
                        </button>
                        {nearbyByOrder[order.id]?.length ? (
                          <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
                            {nearbyByOrder[order.id].slice(0, 3).map((rider) => (
                              <div key={rider.id} className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">
                                    {rider.user?.firstName ?? "Rider"} {rider.user?.lastName ?? ""}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {rider.restaurantDistanceKm} km to restaurant
                                    {rider.vehicleType ? ` · ${rider.vehicleType}` : ""}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => assignRider(order.id, rider.id)}
                                  className="rounded-xl bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-orange-600"
                                >
                                  Assign
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyCard message="No orders have been created yet." />
      )}
    </DashboardShell>
  );
}
