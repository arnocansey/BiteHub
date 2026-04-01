"use client";

import { useMemo, useState } from "react";
import { Eye, Plus, Star } from "lucide-react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess, isSuperAdmin } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type Restaurant = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  averageRating: number;
  storyHeadline?: string | null;
  category?: { name?: string | null } | null;
  vendorProfile?: {
    businessName?: string;
    user?: { firstName?: string; lastName?: string };
  } | null;
  orders?: Array<{
    id: string;
    totalAmount: number | string;
    payment?: { status?: string | null } | null;
  }>;
};

type VendorAccount = {
  id: string;
  businessName: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | string;
  user?: { firstName?: string; lastName?: string; email?: string } | null;
  restaurants: Restaurant[];
};

function formatCompactCedis(value: number) {
  if (value >= 1_000_000) {
    return `GHS ${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`;
  }

  if (value >= 1_000) {
    return `GHS ${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  }

  return `GHS ${value.toLocaleString()}`;
}

export default function VendorsPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(
    async () => {
      const vendors = await adminRequest<VendorAccount[]>("/admin/vendors");
      return vendors;
    },
    [session?.accessToken]
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [busyRestaurantId, setBusyRestaurantId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingVendor, setCreatingVendor] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    businessName: ""
  });

  const vendors = query.data ?? [];

  const vendorCards = useMemo(
    () =>
      vendors.map((vendor) => {
        const allRestaurants = vendor.restaurants ?? [];
        const allOrders = allRestaurants.flatMap((restaurant) => restaurant.orders ?? []);
        const paidOrders = allOrders.filter((order) => order.payment?.status === "PAID");
        const revenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);
        const primaryRestaurant = allRestaurants[0] ?? null;
        const averageRating = allRestaurants.length
          ? allRestaurants.reduce((sum, restaurant) => sum + Number(restaurant.averageRating ?? 0), 0) / allRestaurants.length
          : 0;

        return {
          ...vendor,
          primaryRestaurant,
          cuisine:
            primaryRestaurant?.storyHeadline ??
            primaryRestaurant?.category?.name ??
            (allRestaurants.length ? "Restaurant portfolio" : "Vendor account"),
          ordersCount: allOrders.length,
          revenue,
          averageRating,
          restaurantCount: allRestaurants.length,
          isActive: primaryRestaurant?.status === "ACTIVE",
          displayName:
            vendor.businessName ||
            `${vendor.user?.firstName ?? ""} ${vendor.user?.lastName ?? ""}`.trim() ||
            "Vendor account"
        };
      }),
    [vendors]
  );

  const selectedVendor = vendorCards.find((vendor) => vendor.id === selectedVendorId) ?? vendorCards[0] ?? null;
  const selectedVendorDisplayName = selectedVendor
    ? `${selectedVendor.user?.firstName ?? ""} ${selectedVendor.user?.lastName ?? ""}`.trim() || selectedVendor.user?.email || "Vendor owner"
    : "";

  async function changeRestaurantStatus(restaurantId: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyRestaurantId(restaurantId);
    setActionMessage(null);

    try {
      await adminRequest(`/admin/restaurants/${restaurantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setActionMessage(status === "ACTIVE" ? "Vendor activated." : "Vendor suspended.");
      await query.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to update vendor status.");
    } finally {
      setBusyRestaurantId(null);
    }
  }

  async function approveVendor(vendorId: string) {
    setBusyRestaurantId(vendorId);
    setActionMessage(null);

    try {
      await adminRequest(`/admin/vendors/${vendorId}/approve`, {
        method: "PATCH"
      });
      setActionMessage("Vendor approved successfully.");
      await query.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to approve vendor.");
    } finally {
      setBusyRestaurantId(null);
    }
  }

  async function createVendor() {
    setCreatingVendor(true);
    setActionMessage(null);

    try {
      await adminRequest("/admin/vendors", {
        method: "POST",
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          phone: createForm.phone.trim() || undefined,
          password: createForm.password,
          businessName: createForm.businessName
        })
      });

      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        businessName: ""
      });
      setShowCreateForm(false);
      setActionMessage("Vendor account created successfully.");
      await query.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Unable to create vendor.");
    } finally {
      setCreatingVendor(false);
    }
  }

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage vendors." />;
  if (!hasAdminAccess(session, "vendors")) {
    return <AccessDeniedCard message="Your manager role does not have access to the vendor workspace." />;
  }
  if (query.loading) return <LoadingCard label="Loading vendors..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const superAdmin = isSuperAdmin(session);

  return (
    <DashboardShell
      title="Vendors"
      description={
        superAdmin
          ? "This super-admin vendor workspace mirrors the BiteHub UI with live vendor metrics and real activation controls."
          : "Vendor Manager workspace with live vendor metrics and real activation controls."
      }
      session={session}
    >
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Vendors</h2>
          <p className="mt-1 text-sm text-slate-500">Live vendor cards pulled from the BiteHub backend.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Close" : "Add Vendor"}
        </button>
      </section>

      {actionMessage ? (
        <section className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
          {actionMessage}
        </section>
      ) : null}

      {showCreateForm ? (
        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Create vendor account</h3>
              <p className="mt-1 text-sm text-slate-500">Add a vendor directly from the admin panel.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              value={createForm.firstName}
              onChange={(event) => setCreateForm((current) => ({ ...current, firstName: event.target.value }))}
              placeholder="First name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <input
              value={createForm.lastName}
              onChange={(event) => setCreateForm((current) => ({ ...current, lastName: event.target.value }))}
              placeholder="Last name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <input
              value={createForm.businessName}
              onChange={(event) => setCreateForm((current) => ({ ...current, businessName: event.target.value }))}
              placeholder="Business name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <input
              value={createForm.phone}
              onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400"
            />
            <input
              value={createForm.email}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 md:col-span-2"
            />
            <input
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Temporary password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 md:col-span-2"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void createVendor()}
              disabled={creatingVendor}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {creatingVendor ? "Creating..." : "Create vendor"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {vendorCards.length ? (
        <>
          <section className="grid gap-5 xl:grid-cols-2">
            {vendorCards.map((vendor) => (
              <article key={vendor.id} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-sm font-bold text-orange-500">
                      {vendor.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{vendor.displayName}</p>
                      <p className="mt-1 text-sm text-slate-500">{vendor.cuisine}</p>
                      <p className="mt-1 text-xs text-slate-400">{vendor.user?.email ?? "No owner email"}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      vendor.approvalStatus === "APPROVED"
                        ? "bg-emerald-100 text-emerald-600"
                        : vendor.approvalStatus === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {String(vendor.approvalStatus).toLowerCase()}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{vendor.restaurantCount}</p>
                    <p className="mt-1 text-xs text-slate-400">Restaurants</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-2xl font-semibold text-slate-900">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{Number(vendor.averageRating ?? 0).toFixed(1)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{formatCompactCedis(vendor.revenue)}</p>
                    <p className="mt-1 text-xs text-slate-400">Revenue</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVendorId(vendor.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    type="button"
                    disabled={
                      vendor.approvalStatus === "PENDING"
                        ? busyRestaurantId === vendor.id
                        : !vendor.primaryRestaurant || busyRestaurantId === vendor.primaryRestaurant.id
                    }
                    onClick={() => {
                      if (vendor.approvalStatus === "PENDING") {
                        void approveVendor(vendor.id);
                        return;
                      }

                      if (vendor.primaryRestaurant) {
                        void changeRestaurantStatus(vendor.primaryRestaurant.id, vendor.isActive ? "SUSPENDED" : "ACTIVE");
                      }
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                      vendor.approvalStatus === "PENDING"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : vendor.isActive
                        ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                        : vendor.primaryRestaurant
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {vendor.approvalStatus === "PENDING"
                      ? busyRestaurantId === vendor.id
                        ? "Approving..."
                        : "Approve"
                      : !vendor.primaryRestaurant
                      ? "Needs restaurant"
                      : busyRestaurantId === vendor.primaryRestaurant.id
                      ? "Saving..."
                      : vendor.isActive
                        ? "Suspend"
                        : "Activate"}
                  </button>
                </div>
              </article>
            ))}
          </section>

          {selectedVendor ? (
            <section className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Vendor detail</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedVendor.displayName}</h3>
                  <p className="mt-2 text-sm text-slate-500">{selectedVendorDisplayName}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {selectedVendor.approvalStatus}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Primary restaurant</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedVendor.primaryRestaurant?.name ?? "No restaurant created yet"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Restaurants linked</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedVendor.restaurantCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Captured revenue</p>
                  <p className="mt-2 font-semibold text-slate-900">{formatCompactCedis(selectedVendor.revenue)}</p>
                </div>
              </div>

              {selectedVendor.approvalStatus === "PENDING" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void approveVendor(selectedVendor.id)}
                    disabled={busyRestaurantId === selectedVendor.id}
                    className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                  >
                    {busyRestaurantId === selectedVendor.id ? "Approving..." : "Approve vendor"}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : (
        <EmptyCard message="No vendors are available yet." />
      )}
    </DashboardShell>
  );
}
