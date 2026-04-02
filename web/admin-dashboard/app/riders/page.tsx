"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeDollarSign, Bike, CreditCard, Radio, Search, ShieldBan, Sparkles, UserPlus, Users } from "lucide-react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

const GhanaDispatchMap = dynamic(() => import("../../components/ghana-dispatch-map").then((mod) => mod.GhanaDispatchMap), {
  ssr: false
});

type FleetTrip = {
  id: string;
  riderId?: string;
  riderName?: string;
  status: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  restaurantName: string;
  price: number;
  distanceKm?: number | null;
  createdAt?: string;
};

type FleetCourier = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleType: string;
  isOnline: boolean;
  isActive: boolean;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  metrics: {
    finishedOrders: number;
    activeTrips: number;
    failedTrips: number;
    completionRate: number;
    acceptanceRate: number;
    onlineHours: number;
    earnings: number;
    bonuses: number;
    cashTrips: number;
    cashlessTrips: number;
    qualityScore?: number | null;
  };
  recentTrips: FleetTrip[];
};

type FleetLead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleType?: string;
  createdAt?: string | null;
};

type FleetWorkspace = {
  summary: {
    courierCount: number;
    onlineCouriers: number;
    availableCouriers: number;
    onTripCouriers: number;
    leadsCount: number;
    finishedOrders: number;
    fleetIncome: number;
    cashTrips: number;
    cashlessTrips: number;
    bonusIncome: number;
    averageAcceptanceRate: number;
  };
  couriers: FleetCourier[];
  courierLeads: FleetLead[];
  tripHistory: FleetTrip[];
  liveRoutes: Array<{
    riderId: string;
    riderName: string;
    currentLatitude: number;
    currentLongitude: number;
    activity?: { restaurantName: string; pickupAddress: string; deliveryAddress: string; status: string } | null;
  }>;
  financials: {
    totalFleetIncome: number;
    cashTrips: number;
    cashlessTrips: number;
    bonusIncome: number;
    payoutRequests: {
      pendingAmount: number;
      approvedAmount: number;
      paidAmount: number;
      recent: Array<{ id: string; status: string; approvedAmount: number; createdAt: string; riderName: string }>;
    };
  };
  campaigns: Array<{
    id: string;
    title: string;
    description: string;
    zoneLabel?: string | null;
    bonusAmount: number;
    riderName: string;
  }>;
};

type OperationsIntelligence = {
  heatmap: Array<{ id: string; zoneLabel: string; demandLevel: number; supplyLevel: number; activeOrders: number }>;
};

type RestaurantRecord = { id: string; name: string; address?: string | null; averageRating?: number | null; isFeatured?: boolean };

const currency = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 });
const emptyCourierForm = { firstName: "", lastName: "", email: "", phone: "", password: "", vehicleType: "" };

function formatMoney(value: number) {
  return currency.format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getStatusTone(courier: FleetCourier) {
  if (!courier.isActive) return "border-rose-400/30 bg-rose-500/15 text-rose-200";
  if (courier.metrics.activeTrips > 0) return "border-violet-400/30 bg-violet-500/15 text-violet-200";
  if (courier.isOnline) return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  return "border-slate-500/30 bg-slate-500/15 text-slate-300";
}

function getStatusLabel(courier: FleetCourier) {
  if (!courier.isActive) return "Blocked";
  if (courier.metrics.activeTrips > 0) return "On trip";
  if (courier.isOnline) return "Online";
  return "Offline";
}

export default function RidersPage() {
  const profilePanelRef = useRef<HTMLDivElement | null>(null);
  const { session, ready } = useAdminSessionState();
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [tripSearch, setTripSearch] = useState("");
  const [leadActionLoading, setLeadActionLoading] = useState<string | null>(null);
  const [savingCourier, setSavingCourier] = useState(false);
  const [creatingCourier, setCreatingCourier] = useState(false);
  const [showCreateCourier, setShowCreateCourier] = useState(false);
  const [createCourierForm, setCreateCourierForm] = useState(emptyCourierForm);
  const [messageTitle, setMessageTitle] = useState("Dispatch update");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editCourierForm, setEditCourierForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    vehicleType: "",
    isOnline: false,
    isActive: true
  });

  const fleetQuery = useAdminData(() => adminRequest<FleetWorkspace>("/admin/riders/fleet"), [session?.accessToken]);
  const opsQuery = useAdminData(() => adminRequest<OperationsIntelligence>("/admin/reports/operations"), [session?.accessToken]);
  const restaurantsQuery = useAdminData(() => adminRequest<RestaurantRecord[]>("/admin/restaurants"), [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;
    const interval = window.setInterval(() => {
      void fleetQuery.refresh().catch(() => null);
      void opsQuery.refresh().catch(() => null);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [session?.accessToken, fleetQuery.refresh, opsQuery.refresh]);

  const fleet = fleetQuery.data;
  const couriers = fleet?.couriers ?? [];
  const leads = fleet?.courierLeads ?? [];
  const heatmap = opsQuery.data?.heatmap ?? [];
  const restaurants = restaurantsQuery.data ?? [];
  const selectedCourier = couriers.find((courier) => courier.id === selectedCourierId) ?? couriers[0] ?? null;

  useEffect(() => {
    if (!selectedCourierId && couriers[0]) setSelectedCourierId(couriers[0].id);
  }, [couriers, selectedCourierId]);

  useEffect(() => {
    if (!selectedZoneId && heatmap[0]) setSelectedZoneId(heatmap[0].id);
  }, [heatmap, selectedZoneId]);

  useEffect(() => {
    if (!selectedCourier) return;
    const [firstName = "", ...rest] = selectedCourier.name.split(" ");
    setEditCourierForm({
      firstName,
      lastName: rest.join(" "),
      phone: selectedCourier.phone ?? "",
      vehicleType: selectedCourier.vehicleType === "Not set" ? "" : selectedCourier.vehicleType,
      isOnline: selectedCourier.isOnline,
      isActive: selectedCourier.isActive
    });
    setMessageBody("");
  }, [selectedCourier]);

  const filteredTrips = useMemo(() => {
    const trips = fleet?.tripHistory ?? [];
    if (!tripSearch.trim()) return trips;
    const search = tripSearch.trim().toLowerCase();
    return trips.filter((trip) =>
      [trip.riderName, trip.customerName, trip.restaurantName, trip.pickupAddress, trip.deliveryAddress, trip.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search))
    );
  }, [fleet?.tripHistory, tripSearch]);

  async function refreshAll() {
    await Promise.all([fleetQuery.refresh(), opsQuery.refresh(), restaurantsQuery.refresh()]);
  }

  async function reviewLead(riderId: string, status: "APPROVED" | "REJECTED") {
    setLeadActionLoading(`${riderId}-${status}`);
    try {
      await adminRequest(`/admin/riders/${riderId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await refreshAll();
    } finally {
      setLeadActionLoading(null);
    }
  }

  async function saveCourierChanges() {
    if (!selectedCourier) return;
    setSavingCourier(true);
    try {
      await adminRequest(`/admin/riders/${selectedCourier.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: editCourierForm.firstName,
          lastName: editCourierForm.lastName,
          phone: editCourierForm.phone || null,
          vehicleType: editCourierForm.vehicleType || null,
          isOnline: editCourierForm.isOnline,
          isActive: editCourierForm.isActive
        })
      });
      await refreshAll();
    } finally {
      setSavingCourier(false);
    }
  }

  async function createCourier() {
    setCreatingCourier(true);
    try {
      await adminRequest("/admin/riders", {
        method: "POST",
        body: JSON.stringify(createCourierForm)
      });
      setCreateCourierForm(emptyCourierForm);
      setShowCreateCourier(false);
      await refreshAll();
    } finally {
      setCreatingCourier(false);
    }
  }

  async function sendMessageToCourier() {
    if (!selectedCourier || !messageTitle.trim() || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      await adminRequest(`/admin/riders/${selectedCourier.id}/message`, {
        method: "POST",
        body: JSON.stringify({
          title: messageTitle,
          body: messageBody
        })
      });
      setMessageBody("");
    } finally {
      setSendingMessage(false);
    }
  }

  function focusCourier(courierId: string) {
    setSelectedCourierId(courierId);
    setShowCreateCourier(false);
    window.requestAnimationFrame(() => {
      profilePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage couriers." />;
  if (!hasAdminAccess(session, "riders")) {
    return <AccessDeniedCard message="Your manager role does not have access to courier management." />;
  }
  if (fleetQuery.loading || opsQuery.loading || restaurantsQuery.loading) {
    return <LoadingCard label="Loading courier operations..." />;
  }
  if (fleetQuery.error) return <ErrorCard message={fleetQuery.error} />;
  if (opsQuery.error) return <ErrorCard message={opsQuery.error} />;
  if (restaurantsQuery.error) return <ErrorCard message={restaurantsQuery.error} />;

  return (
    <DashboardShell
      title="Courier management"
      description="Manage your fleet, review courier leads, monitor riders in Ghana in real time, and keep operations moving."
      session={session}
    >
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Fleet couriers", value: fleet?.summary.courierCount ?? 0, icon: Users },
            { label: "Online & available", value: fleet?.summary.availableCouriers ?? 0, icon: Radio },
            { label: "On trip", value: fleet?.summary.onTripCouriers ?? 0, icon: Bike },
            { label: "Finished orders", value: fleet?.summary.finishedOrders ?? 0, icon: Sparkles },
            { label: "Fleet income", value: formatMoney(fleet?.summary.fleetIncome ?? 0), icon: BadgeDollarSign }
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-[0_24px_50px_rgba(2,6,23,0.32)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                <card.icon className="h-4 w-4 text-orange-300" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <article className="rounded-[32px] border border-slate-800 bg-[#07101d] p-5 shadow-[0_28px_70px_rgba(2,6,23,0.4)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Real-time monitoring</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Live Ghana courier map</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Online riders refresh every 10 seconds. Green riders are available, violet riders are already on a trip.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                {fleet?.liveRoutes.length ?? 0} live couriers
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-slate-700 bg-slate-950/60 p-4">
              <GhanaDispatchMap
                zones={heatmap}
                activeRiders={couriers
                  .filter((courier) => courier.isOnline && typeof courier.currentLatitude === "number" && typeof courier.currentLongitude === "number")
                  .map((courier) => ({
                    id: courier.id,
                    isOnline: courier.isOnline,
                    vehicleType: courier.vehicleType,
                    currentLatitude: courier.currentLatitude as number,
                    currentLongitude: courier.currentLongitude as number,
                    user: {
                      firstName: courier.name.split(" ")[0] ?? courier.name,
                      lastName: courier.name.split(" ").slice(1).join(" ")
                    },
                    activeDelivery:
                      courier.metrics.activeTrips > 0
                        ? {
                            id: courier.recentTrips[0]?.id ?? courier.id,
                            status: courier.recentTrips[0]?.status ?? "IN_TRANSIT",
                            orderId: courier.recentTrips[0]?.id ?? courier.id,
                            restaurantName: courier.recentTrips[0]?.restaurantName ?? null
                          }
                        : null
                  }))}
                restaurants={restaurants}
                focusedZoneId={selectedZoneId}
                focusedRiderId={selectedCourier?.id ?? null}
                focusedRestaurantId={null}
                onZoneSelect={setSelectedZoneId}
                onRiderSelect={setSelectedCourierId}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(fleet?.liveRoutes ?? []).slice(0, 3).map((route) => (
                <div key={route.riderId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{route.riderName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {route.activity?.status?.replaceAll("_", " ") ?? "Idle courier"}
                  </p>
                  <p className="mt-3 text-sm text-slate-300">{route.activity?.restaurantName ?? "Waiting near a demand zone"}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {route.activity?.deliveryAddress ?? route.activity?.pickupAddress ?? "No route history yet."}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <article className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Courier leads</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Applications waiting for review</h3>
                </div>
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200">
                  {leads.length} pending
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {leads.length ? (
                  leads.map((lead) => (
                    <div key={lead.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="text-sm font-semibold text-white">{lead.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{lead.email}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {lead.vehicleType || "Vehicle pending"} · {formatDate(lead.createdAt)}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          disabled={leadActionLoading === `${lead.id}-APPROVED`}
                          onClick={() => void reviewLead(lead.id, "APPROVED")}
                          className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={leadActionLoading === `${lead.id}-REJECTED`}
                          onClick={() => void reviewLead(lead.id, "REJECTED")}
                          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyCard message="No courier applications are waiting right now." />
                )}
              </div>
            </article>

            <article className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Campaigns</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Active rider promotions</h3>
                </div>
                <Sparkles className="h-5 w-5 text-orange-300" />
              </div>
              <div className="mt-5 space-y-3">
                {fleet?.campaigns.length ? (
                  fleet.campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{campaign.title}</p>
                        <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-200">
                          {formatMoney(campaign.bonusAmount)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{campaign.description}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {campaign.zoneLabel || "All zones"} · {campaign.riderName}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyCard message="No active rider campaigns yet." />
                )}
              </div>
            </article>
          </aside>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Courier list</p>
                <h3 className="mt-2 text-xl font-semibold text-white">View, edit, and block fleet profiles</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCourier((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                <UserPlus className="h-4 w-4" />
                Add courier
              </button>
            </div>

            {showCreateCourier ? (
              <div className="mt-5 grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2">
                {[
                  { key: "firstName", label: "First name" },
                  { key: "lastName", label: "Last name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "password", label: "Password" },
                  { key: "vehicleType", label: "Vehicle type" }
                ].map((field) => (
                  <label key={field.key} className="space-y-2 text-sm text-slate-300">
                    <span>{field.label}</span>
                    <input
                      type={field.key === "password" ? "password" : "text"}
                      value={(createCourierForm as Record<string, string>)[field.key]}
                      onChange={(event) =>
                        setCreateCourierForm((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                    />
                  </label>
                ))}
                <div className="flex gap-3 md:col-span-2">
                  <button
                    type="button"
                    disabled={creatingCourier}
                    onClick={() => void createCourier()}
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    Create courier
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateCourier(false)}
                    className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-800">
              <div className="grid grid-cols-[1.2fr_1.1fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 bg-slate-900 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Courier</span>
                <span>Vehicle</span>
                <span>Status</span>
                <span>Finished</span>
                <span>Acceptance</span>
                <span>Earnings</span>
              </div>
              <div className="max-h-[460px] overflow-y-auto bg-slate-950/60">
                {couriers.map((courier, index) => (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() => focusCourier(courier.id)}
                    aria-pressed={selectedCourier?.id === courier.id}
                    className={`grid w-full grid-cols-[1.2fr_1.1fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-left text-sm transition ${
                      selectedCourier?.id === courier.id ? "bg-orange-500/10" : index % 2 === 0 ? "bg-white/[0.015]" : ""
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-white">{courier.name}</span>
                      <span className="block text-xs text-slate-500">{courier.email}</span>
                    </span>
                    <span className="text-slate-300">{courier.vehicleType}</span>
                    <span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(courier)}`}>
                        {getStatusLabel(courier)}
                      </span>
                    </span>
                    <span className="text-slate-300">{courier.metrics.finishedOrders}</span>
                    <span className="text-slate-300">{courier.metrics.acceptanceRate}%</span>
                    <span className="text-slate-200">{formatMoney(courier.metrics.earnings)}</span>
                  </button>
                ))}
              </div>
            </div>
          </article>

          <aside ref={profilePanelRef} className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Courier profile</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{selectedCourier?.name ?? "Select a courier"}</h3>
                {selectedCourier ? <p className="mt-1 text-sm text-slate-500">Editing this courier updates the live fleet profile.</p> : null}
              </div>
              {selectedCourier ? (
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(selectedCourier)}`}>
                  {getStatusLabel(selectedCourier)}
                </span>
              ) : null}
            </div>
            {selectedCourier ? (
              <div key={selectedCourier.id} className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { key: "firstName", label: "First name" },
                    { key: "lastName", label: "Last name" },
                    { key: "email", label: "Email", readOnly: true, value: selectedCourier.email },
                    { key: "phone", label: "Phone" },
                    { key: "vehicleType", label: "Vehicle type" }
                  ].map((field) => (
                    <label key={field.key} className="space-y-2 text-sm text-slate-300">
                      <span>{field.label}</span>
                      <input
                        readOnly={field.readOnly}
                        value={
                          field.readOnly
                            ? field.value ?? ""
                            : ((editCourierForm as Record<string, string | boolean>)[field.key] as string)
                        }
                        onChange={(event) =>
                          field.readOnly
                            ? undefined
                            : setEditCourierForm((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                        className={`w-full rounded-2xl border border-slate-700 px-4 py-3 text-white outline-none ${
                          field.readOnly ? "bg-slate-950/70 text-slate-500" : "bg-slate-900"
                        }`}
                      />
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                    <span>Allow rider online</span>
                    <input
                      type="checkbox"
                      checked={editCourierForm.isOnline}
                      onChange={(event) =>
                        setEditCourierForm((current) => ({ ...current, isOnline: event.target.checked }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                    <span>Account active</span>
                    <input
                      type="checkbox"
                      checked={editCourierForm.isActive}
                      onChange={(event) =>
                        setEditCourierForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Finished</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedCourier.metrics.finishedOrders}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Online hours</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedCourier.metrics.onlineHours}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quality score</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedCourier.metrics.qualityScore ?? "N/A"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={savingCourier}
                    onClick={() => void saveCourierChanges()}
                    className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60"
                  >
                    Save courier changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCourierForm((current) => ({ ...current, isActive: !current.isActive }))}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  >
                    <ShieldBan className="h-4 w-4" />
                    {editCourierForm.isActive ? "Block courier" : "Unblock courier"}
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin communication</p>
                  <h4 className="mt-2 text-lg font-semibold text-white">Message this rider</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    Send a direct operational update to {selectedCourier.name}. The message is delivered through the rider notification inbox.
                  </p>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-300">Message title</span>
                      <input
                        value={messageTitle}
                        onChange={(event) => setMessageTitle(event.target.value)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                        placeholder="Dispatch update"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-300">Message body</span>
                      <textarea
                        value={messageBody}
                        onChange={(event) => setMessageBody(event.target.value)}
                        className="min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                        placeholder="Head to East Legon after your current trip. Demand is rising in that zone."
                      />
                    </label>

                    <button
                      type="button"
                      disabled={sendingMessage || !messageTitle.trim() || !messageBody.trim()}
                      onClick={() => void sendMessageToCourier()}
                      className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
                    >
                      {sendingMessage ? "Sending..." : "Send rider message"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyCard message="Select a courier from the fleet list to edit the profile." />
            )}
          </aside>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Trip history</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Analyze past rider activity by name</h3>
              </div>
              <label className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  value={tripSearch}
                  onChange={(event) => setTripSearch(event.target.value)}
                  placeholder="Search driver, restaurant, customer, route..."
                  className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
                />
              </label>
            </div>
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-800">
              <div className="grid grid-cols-[0.9fr_1fr_1fr_1.25fr_1.25fr_0.8fr_0.7fr_0.75fr] gap-3 bg-slate-900 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Driver</span><span>Restaurant</span><span>Customer</span><span>Pickup</span><span>Dropoff</span><span>Status</span><span>Distance</span><span>Price</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto bg-slate-950/60">
                {filteredTrips.length ? (
                  filteredTrips.map((trip, index) => (
                    <div
                      key={trip.id}
                      className={`grid grid-cols-[0.9fr_1fr_1fr_1.25fr_1.25fr_0.8fr_0.7fr_0.75fr] gap-3 px-4 py-4 text-sm ${index % 2 === 0 ? "bg-white/[0.015]" : ""}`}
                    >
                      <span className="text-white">{trip.riderName ?? "Rider"}</span>
                      <span className="text-slate-300">{trip.restaurantName}</span>
                      <span className="text-slate-300">{trip.customerName}</span>
                      <span className="text-slate-500">{trip.pickupAddress}</span>
                      <span className="text-slate-500">{trip.deliveryAddress}</span>
                      <span className="text-slate-300">{trip.status.replaceAll("_", " ")}</span>
                      <span className="text-slate-300">{trip.distanceKm ? `${trip.distanceKm} km` : "N/A"}</span>
                      <span className="text-slate-200">{formatMoney(trip.price)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4">
                    <EmptyCard message="No trip history matches your current search." />
                  </div>
                )}
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <article className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Financials & reports</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Fleet earnings overview</h3>
                </div>
                <CreditCard className="h-5 w-5 text-orange-300" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cashless trips</p><p className="mt-2 text-2xl font-semibold text-white">{fleet?.financials.cashlessTrips ?? 0}</p></div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cash trips</p><p className="mt-2 text-2xl font-semibold text-white">{fleet?.financials.cashTrips ?? 0}</p></div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Campaign bonuses</p><p className="mt-2 text-2xl font-semibold text-white">{formatMoney(fleet?.financials.bonusIncome ?? 0)}</p></div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payouts paid</p><p className="mt-2 text-2xl font-semibold text-white">{formatMoney(fleet?.financials.payoutRequests.paidAmount ?? 0)}</p></div>
              </div>
              <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Recent payout requests</p>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending {formatMoney(fleet?.financials.payoutRequests.pendingAmount ?? 0)}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {fleet?.financials.payoutRequests.recent.length ? (
                    fleet.financials.payoutRequests.recent.slice(0, 6).map((request) => (
                      <div key={request.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{request.riderName}</p>
                          <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-200">{request.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{formatMoney(request.approvedAmount)}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(request.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyCard message="No payout requests yet." />
                  )}
                </div>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </DashboardShell>
  );
}
