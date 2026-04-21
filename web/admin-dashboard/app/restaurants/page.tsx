"use client";

import { useState } from "react";
import { MapPin, Star, Store } from "lucide-react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { GooglePlacesPanel, type GooglePlaceSelection } from "../../components/google-places-panel";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type RestaurantRecord = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  averageRating?: number | null;
  address?: string | null;
  storyHeadline?: string | null;
  storyBody?: string | null;
  isFeatured?: boolean;
  estimatedDeliveryMins?: number | null;
  category?: { name?: string | null } | null;
  vendorProfile?: {
    businessName?: string | null;
    user?: { firstName?: string; lastName?: string; email?: string } | null;
  } | null;
  menuItems?: Array<{ id: string }>;
  orders?: Array<{
    id: string;
    totalAmount?: number | string;
    payment?: { status?: string | null } | null;
  }>;
  collectionPlacements?: Array<{
    id: string;
    collection?: { name?: string | null } | null;
  }>;
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

export default function RestaurantsPage() {
  const { session, ready } = useAdminSessionState();
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceSelection | null>(null);
  const query = useAdminData(() => adminRequest<RestaurantRecord[]>("/admin/restaurants"), [session?.accessToken]);

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage restaurants." />;
  if (!hasAdminAccess(session, "restaurants")) {
    return <AccessDeniedCard message="Your manager role does not have access to the restaurant workspace." />;
  }
  if (query.loading) return <LoadingCard label="Loading restaurants..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  const restaurants = query.data ?? [];
  const activeRestaurants = restaurants.filter((restaurant) => restaurant.status === "ACTIVE").length;
  const featuredRestaurants = restaurants.filter((restaurant) => restaurant.isFeatured).length;
  const totalMenuItems = restaurants.reduce((sum, restaurant) => sum + (restaurant.menuItems?.length ?? 0), 0);
  const capturedRevenue = restaurants.reduce((sum, restaurant) => {
    const paidOrders = (restaurant.orders ?? []).filter((order) => order.payment?.status === "PAID");
    return sum + paidOrders.reduce((inner, order) => inner + Number(order.totalAmount ?? 0), 0);
  }, 0);

  return (
    <DashboardShell
      title="Restaurants"
      description="This workspace is for the actual restaurant catalog: brand stories, menu depth, category coverage, and collection placement."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Restaurants", restaurants.length],
          ["Active", activeRestaurants],
          ["Featured", featuredRestaurants],
          ["Menu Items", totalMenuItems]
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Restaurant catalog</h2>
          <p className="mt-1 text-sm text-slate-500">Live restaurant records, distinct from the vendor account workspace.</p>

          {restaurants.length ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {restaurants.map((restaurant) => {
                const paidOrders = (restaurant.orders ?? []).filter((order) => order.payment?.status === "PAID");
                const revenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

                return (
                  <article key={restaurant.id} className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{restaurant.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {restaurant.vendorProfile?.businessName ?? "No vendor linked"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          restaurant.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : restaurant.status === "SUSPENDED"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {restaurant.status.toLowerCase()}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {restaurant.category?.name ?? "Uncategorized"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {restaurant.menuItems?.length ?? 0} menu items
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {restaurant.estimatedDeliveryMins ?? 0} min delivery
                      </span>
                      {restaurant.isFeatured ? (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">Featured</span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-400">Revenue</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatCompactCedis(revenue)}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-400">Orders</p>
                        <p className="mt-2 font-semibold text-slate-900">{restaurant.orders?.length ?? 0}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-400">Rating</p>
                        <p className="mt-2 flex items-center gap-1 font-semibold text-slate-900">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>{Number(restaurant.averageRating ?? 0).toFixed(1)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <p className="line-clamp-2">{restaurant.storyHeadline ?? restaurant.storyBody ?? "No restaurant story added yet."}</p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{restaurant.address ?? "No address added yet"}</span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyCard message="No restaurants are available yet." />
            </div>
          )}
        </article>

        <aside className="space-y-4">
          <GooglePlacesPanel
            title="Restaurant location finder"
            description="Look up an address or landmark with Google Places while reviewing the live restaurant catalog."
            onPlaceSelect={setSelectedPlace}
            heightClassName="h-[300px]"
          />

          {selectedPlace ? (
            <article className="rounded-[28px] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Selected place</h3>
              <p className="mt-3 font-medium text-slate-900">{selectedPlace.displayName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedPlace.formattedAddress}</p>
              <p className="mt-3 text-sm font-semibold text-orange-500">
                {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
              </p>
            </article>
          ) : null}

          <article className="rounded-[28px] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Collection coverage</h3>
            <div className="mt-5 space-y-3">
              {restaurants.slice(0, 5).map((restaurant) => (
                <div key={restaurant.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{restaurant.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {restaurant.collectionPlacements?.length
                      ? restaurant.collectionPlacements.map((entry) => entry.collection?.name ?? "Collection").join(", ")
                      : "Not placed in any collection yet"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Catalog revenue</h3>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCompactCedis(capturedRevenue)}</p>
            <p className="mt-2 text-sm text-slate-500">
              This is the captured revenue across restaurant records. Vendor account setup and approvals belong in the Vendors tab.
            </p>
          </article>
        </aside>
      </section>
    </DashboardShell>
  );
}
