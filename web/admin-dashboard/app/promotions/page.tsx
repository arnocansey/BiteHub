"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Gift, Percent, Save } from "lucide-react";
import { AccessDeniedCard, AuthRequiredCard, EmptyCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type PromoCodeRecord = {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  maxUsageCount: number | null;
  usageCount: number;
  minOrderAmount: number;
  isActive: boolean;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));
}

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function PromotionsPage() {
  const { session, ready } = useAdminSessionState();
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountPercent: "10",
    endsAt: "",
    maxUsageCount: "",
    minOrderAmount: "",
    isActive: true
  });

  const query = useAdminData(() => adminRequest<PromoCodeRecord[]>("/admin/promotions"), [session?.accessToken]);

  const promos = query.data ?? [];
  const selectedPromo = useMemo(
    () => promos.find((promo) => promo.id === selectedPromoId) ?? null,
    [promos, selectedPromoId]
  );

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage promotions." />;
  if (!hasAdminAccess(session, "promotions")) {
    return <AccessDeniedCard message="Your manager role does not have access to promotions." />;
  }
  if (query.loading) return <LoadingCard label="Loading promotions..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  function loadPromoIntoForm(promo: PromoCodeRecord | null) {
    if (!promo) {
      setSelectedPromoId(null);
      setForm({
        code: "",
        description: "",
        discountPercent: "10",
        endsAt: "",
        maxUsageCount: "",
        minOrderAmount: "",
        isActive: true
      });
      return;
    }

    setSelectedPromoId(promo.id);
    setForm({
      code: promo.code,
      description: promo.description ?? "",
      discountPercent: String(promo.discountPercent ?? 0),
      endsAt: toDateTimeInput(promo.endsAt),
      maxUsageCount: promo.maxUsageCount == null ? "" : String(promo.maxUsageCount),
      minOrderAmount: promo.minOrderAmount ? String(promo.minOrderAmount) : "",
      isActive: promo.isActive
    });
  }

  async function savePromotion() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discountPercent: Number(form.discountPercent || 0),
        endsAt: new Date(form.endsAt).toISOString(),
        maxUsageCount: form.maxUsageCount ? Number(form.maxUsageCount) : null,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        isActive: form.isActive
      };

      if (selectedPromoId) {
        await adminRequest(`/admin/promotions/${selectedPromoId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        setMessage("Promotion updated.");
      } else {
        await adminRequest("/admin/promotions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Promotion created.");
      }

      await query.refresh();
      if (!selectedPromoId) {
        loadPromoIntoForm(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save promotion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      title="Promotions"
      description="Set expiry date, discount percentage, and maximum usage for real promo codes that customers can apply at checkout."
      session={session}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active promotions</p>
          <p className="mt-2 text-3xl font-semibold text-white">{promos.filter((promo) => promo.isActive).length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average discount</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {promos.length ? `${Math.round(promos.reduce((sum, promo) => sum + promo.discountPercent, 0) / promos.length)}%` : "0%"}
          </p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Promo redemptions</p>
          <p className="mt-2 text-3xl font-semibold text-white">{promos.reduce((sum, promo) => sum + promo.usageCount, 0)}</p>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <article className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Promotion library</h2>
              <p className="mt-2 text-sm text-slate-400">All promo codes here are live records, including their real usage counts from completed orders.</p>
            </div>
            <button
              type="button"
              onClick={() => loadPromoIntoForm(null)}
              className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              New promotion
            </button>
          </div>

          {promos.length ? (
            <div className="mt-6 grid gap-4">
              {promos.map((promo) => (
                <button
                  type="button"
                  key={promo.id}
                  onClick={() => loadPromoIntoForm(promo)}
                  className={`rounded-[24px] border p-5 text-left transition ${
                    promo.id === selectedPromoId
                      ? "border-orange-400/60 bg-orange-500/10"
                      : "border-white/10 bg-slate-900/70 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{promo.code}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{promo.description || "No description yet."}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${promo.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Discount</p>
                      <p className="mt-2 font-semibold text-white">{promo.discountPercent}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expiry</p>
                      <p className="mt-2 font-semibold text-white">{new Date(promo.endsAt).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Max usage</p>
                      <p className="mt-2 font-semibold text-white">{promo.maxUsageCount ?? "Unlimited"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Used</p>
                      <p className="mt-2 font-semibold text-white">{promo.usageCount}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyCard message="No promotions exist yet." />
            </div>
          )}
        </article>

        <aside className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-300">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{selectedPromo ? "Edit promotion" : "Create promotion"}</h2>
              <p className="mt-1 text-sm text-slate-400">Finance manager controls expiry, discount percentage, and maximum usage here.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Promo code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                placeholder="BITE10"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Weekend food promo"
                rows={3}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Percent className="h-4 w-4" />
                  Discount percentage
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={(event) => setForm((current) => ({ ...current, discountPercent: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Maximum usage</span>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsageCount}
                  onChange={(event) => setForm((current) => ({ ...current, maxUsageCount: event.target.value }))}
                  placeholder="Unlimited"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <CalendarClock className="h-4 w-4" />
                  Expiry date
                </span>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">Minimum order amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: event.target.value }))}
                  placeholder="Optional"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
              <span className="text-sm font-medium text-slate-300">Promotion active</span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 accent-orange-500"
              />
            </label>

            <button
              type="button"
              onClick={() => void savePromotion()}
              disabled={saving || !form.code.trim() || !form.endsAt}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : selectedPromo ? "Update promotion" : "Create promotion"}
            </button>
          </div>

          {message ? <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">{message}</div> : null}

          {selectedPromo ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Current performance</h3>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3 text-sm">
                  <span className="text-slate-400">Usage so far</span>
                  <span className="font-semibold text-white">{selectedPromo.usageCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3 text-sm">
                  <span className="text-slate-400">Usage cap</span>
                  <span className="font-semibold text-white">{selectedPromo.maxUsageCount ?? "Unlimited"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3 text-sm">
                  <span className="text-slate-400">Min order</span>
                  <span className="font-semibold text-white">{selectedPromo.minOrderAmount ? formatMoney(selectedPromo.minOrderAmount) : "None"}</span>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </DashboardShell>
  );
}
