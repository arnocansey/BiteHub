"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AccessDeniedCard, AuthRequiredCard, ErrorCard, LoadingCard } from "../../components/admin-states";
import { DashboardShell } from "../../components/dashboard-shell";
import { hasAdminAccess } from "../../lib/admin-access";
import { adminRequest, useAdminData, useAdminSessionState } from "../../lib/admin-client";

type SubscriptionPlan = {
  id?: string;
  name: string;
  code: string;
  audienceLabel: string;
  monthlyPrice: number | string;
  yearlyPrice?: number | string | null;
  orderCommissionRate: number | string;
  deliveryCommissionRate: number | string;
  benefitsSummary: string;
  isActive: boolean;
  sortOrder: number;
};

type Settings = {
  paymentMethods: ("CASH" | "CARD" | "MOBILE_MONEY")[];
  dispatchMode: "AUTO" | "MANUAL";
  supportEmail: string;
  vendorCommissionRate: number | string;
  riderCommissionRate: number | string;
  serviceFeeRate: number | string;
  taxRate: number | string;
  rideBaseFare: number | string;
  rideDistanceRatePerKm: number | string;
  rideTimeRatePerMinute: number | string;
  payoutDelayDays: number;
  minimumPayoutAmount: number | string;
  platformSubscriptionEnabled: boolean;
  defaultTrialDays: number;
  subscriptions: SubscriptionPlan[];
};

const paymentMethodOptions = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "MOBILE_MONEY", label: "Mobile money" }
] as const;

const emptyPlan = (sortOrder: number): SubscriptionPlan => ({
  name: "",
  code: "",
  audienceLabel: "",
  monthlyPrice: 0,
  yearlyPrice: null,
  orderCommissionRate: 0,
  deliveryCommissionRate: 0,
  benefitsSummary: "",
  isActive: true,
  sortOrder
});

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export default function SettingsPage() {
  const { session, ready } = useAdminSessionState();
  const query = useAdminData(() => adminRequest<Settings>("/admin/settings"), [session?.accessToken]);
  const [dispatchMode, setDispatchMode] = useState<Settings["dispatchMode"]>("AUTO");
  const [supportEmail, setSupportEmail] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<Settings["paymentMethods"]>(["CASH", "CARD", "MOBILE_MONEY"]);
  const [vendorCommissionRate, setVendorCommissionRate] = useState("15");
  const [riderCommissionRate, setRiderCommissionRate] = useState("2.5");
  const [serviceFeeRate, setServiceFeeRate] = useState("5");
  const [taxRate, setTaxRate] = useState("7.5");
  const [rideBaseFare, setRideBaseFare] = useState("5");
  const [rideDistanceRatePerKm, setRideDistanceRatePerKm] = useState("2");
  const [rideTimeRatePerMinute, setRideTimeRatePerMinute] = useState("0.5");
  const [payoutDelayDays, setPayoutDelayDays] = useState("2");
  const [minimumPayoutAmount, setMinimumPayoutAmount] = useState("5000");
  const [platformSubscriptionEnabled, setPlatformSubscriptionEnabled] = useState(true);
  const [defaultTrialDays, setDefaultTrialDays] = useState("14");
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    setDispatchMode(query.data.dispatchMode);
    setSupportEmail(query.data.supportEmail);
    setPaymentMethods(query.data.paymentMethods);
    setVendorCommissionRate(String(query.data.vendorCommissionRate));
    setRiderCommissionRate(String(query.data.riderCommissionRate));
    setServiceFeeRate(String(query.data.serviceFeeRate));
    setTaxRate(String(query.data.taxRate));
    setRideBaseFare(String(query.data.rideBaseFare));
    setRideDistanceRatePerKm(String(query.data.rideDistanceRatePerKm));
    setRideTimeRatePerMinute(String(query.data.rideTimeRatePerMinute));
    setPayoutDelayDays(String(query.data.payoutDelayDays));
    setMinimumPayoutAmount(String(query.data.minimumPayoutAmount));
    setPlatformSubscriptionEnabled(query.data.platformSubscriptionEnabled);
    setDefaultTrialDays(String(query.data.defaultTrialDays));
    setSubscriptions(
      query.data.subscriptions.map((plan, index) => ({
        ...plan,
        sortOrder: plan.sortOrder ?? index
      }))
    );
  }, [query.data]);

  const pricingSnapshot = useMemo(
    () => [
      { label: "Platform order commission", value: `${vendorCommissionRate}%` },
      { label: "Delivery platform fee", value: `${riderCommissionRate}%` },
      { label: "Customer service fee", value: `${serviceFeeRate}%` },
      { label: "Government tax / VAT", value: `${taxRate}%` },
      { label: "Ride base fare", value: `GHS ${rideBaseFare}` },
      { label: "Ride distance rate", value: `GHS ${rideDistanceRatePerKm}/km` },
      { label: "Ride time rate", value: `GHS ${rideTimeRatePerMinute}/min` }
    ],
    [rideBaseFare, rideDistanceRatePerKm, rideTimeRatePerMinute, riderCommissionRate, serviceFeeRate, taxRate, vendorCommissionRate]
  );

  function togglePaymentMethod(method: Settings["paymentMethods"][number]) {
    setPaymentMethods((current) =>
      current.includes(method) ? current.filter((entry) => entry !== method) : [...current, method]
    );
  }

  function updateSubscription(index: number, patch: Partial<SubscriptionPlan>) {
    setSubscriptions((current) =>
      current.map((plan, planIndex) => (planIndex === index ? { ...plan, ...patch } : plan))
    );
  }

  function addSubscription() {
    setSubscriptions((current) => [...current, emptyPlan(current.length)]);
  }

  function removeSubscription(index: number) {
    setSubscriptions((current) =>
      current
        .filter((_, planIndex) => planIndex !== index)
        .map((plan, planIndex) => ({ ...plan, sortOrder: planIndex }))
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await adminRequest("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          dispatchMode,
          supportEmail,
          paymentMethods,
          vendorCommissionRate: Number(vendorCommissionRate),
          riderCommissionRate: Number(riderCommissionRate),
          serviceFeeRate: Number(serviceFeeRate),
          taxRate: Number(taxRate),
          rideBaseFare: Number(rideBaseFare),
          rideDistanceRatePerKm: Number(rideDistanceRatePerKm),
          rideTimeRatePerMinute: Number(rideTimeRatePerMinute),
          payoutDelayDays: Number(payoutDelayDays),
          minimumPayoutAmount: Number(minimumPayoutAmount),
          platformSubscriptionEnabled,
          defaultTrialDays: Number(defaultTrialDays),
          subscriptions: subscriptions.map((plan, index) => ({
            id: plan.id,
            name: plan.name,
            code: plan.code,
            audienceLabel: plan.audienceLabel,
            monthlyPrice: toNumber(plan.monthlyPrice),
            yearlyPrice:
              plan.yearlyPrice === null || plan.yearlyPrice === "" || plan.yearlyPrice === undefined
                ? null
                : toNumber(plan.yearlyPrice),
            orderCommissionRate: toNumber(plan.orderCommissionRate),
            deliveryCommissionRate: toNumber(plan.deliveryCommissionRate),
            benefitsSummary: plan.benefitsSummary,
            isActive: plan.isActive,
            sortOrder: index
          }))
        })
      });

      setMessage("Platform settings saved.");
      await query.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return <LoadingCard />;
  if (!session) return <AuthRequiredCard message="Sign in with an admin account to manage platform settings." />;
  if (!hasAdminAccess(session, "settings")) {
    return <AccessDeniedCard message="Your manager role does not have access to platform settings." />;
  }
  if (query.loading) return <LoadingCard label="Loading platform settings..." />;
  if (query.error) return <ErrorCard message={query.error} />;

  return (
    <DashboardShell
      title="Platform settings"
      description="Control commissions, payout rules, payment methods, and subscription plans from one operational workspace."
      session={session}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Marketplace controls</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Platform economics, dispatch, and payouts</h2>
              <p className="mt-2 text-sm text-slate-500">
                These settings define BiteHub's platform cut, customer fees, tax defaults, and payout timing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Dispatch mode</span>
                <select
                  value={dispatchMode}
                  onChange={(event) => setDispatchMode(event.target.value as Settings["dispatchMode"])}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                >
                  <option value="AUTO">Automatic dispatch</option>
                  <option value="MANUAL">Manual dispatch</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Support email</span>
                <input
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                  placeholder="ops@bitehub.app"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Platform order commission (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={vendorCommissionRate}
                  onChange={(event) => setVendorCommissionRate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Delivery platform fee (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={riderCommissionRate}
                  onChange={(event) => setRiderCommissionRate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Customer service fee (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={serviceFeeRate}
                  onChange={(event) => setServiceFeeRate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Government tax / VAT (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Ride base fare (GHS)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rideBaseFare}
                  onChange={(event) => setRideBaseFare(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Ride distance rate (GHS / km)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rideDistanceRatePerKm}
                  onChange={(event) => setRideDistanceRatePerKm(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Ride time rate (GHS / min)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rideTimeRatePerMinute}
                  onChange={(event) => setRideTimeRatePerMinute(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Payout delay (days)</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={payoutDelayDays}
                  onChange={(event) => setPayoutDelayDays(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Minimum payout amount</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={minimumPayoutAmount}
                  onChange={(event) => setMinimumPayoutAmount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>
            </div>

            <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50/70 p-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Accepted payments</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {paymentMethodOptions.map((option) => {
                  const active = paymentMethods.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePaymentMethod(option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">Snapshot</p>
              <div className="mt-5 space-y-4">
                {pricingSnapshot.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <span className="text-base font-black">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Subscriptions</p>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Platform subscriptions</p>
                  <p className="text-xs text-slate-500">Enable paid vendor plans and default trials.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlatformSubscriptionEnabled((current) => !current)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${
                    platformSubscriptionEnabled ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {platformSubscriptionEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Default trial days</span>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={defaultTrialDays}
                  onChange={(event) => setDefaultTrialDays(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                />
              </label>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Order commission, delivery platform fee, and customer service fee are BiteHub revenue streams.
                Government tax / VAT is tracked separately and should be remitted, not counted as company profit.
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Subscription plans</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Manage vendor subscription pricing</h2>
              <p className="mt-2 text-sm text-slate-500">
                Define the plans vendors can subscribe to, including pricing, reduced platform fees, and positioning.
              </p>
            </div>
            <button
              type="button"
              onClick={addSubscription}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Add subscription plan
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {subscriptions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No plans yet. Add your first BiteHub subscription plan.
              </div>
            ) : null}

            {subscriptions.map((plan, index) => (
              <div key={`${plan.code || "plan"}-${index}`} className="rounded-3xl border border-slate-200 p-5">
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Plan name</span>
                    <input
                      value={plan.name}
                      onChange={(event) => updateSubscription(index, { name: event.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                      placeholder="Growth"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Code</span>
                    <input
                      value={plan.code}
                      onChange={(event) => updateSubscription(index, { code: event.target.value.toUpperCase() })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                      placeholder="GROWTH"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Audience</span>
                    <input
                      value={plan.audienceLabel}
                      onChange={(event) => updateSubscription(index, { audienceLabel: event.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                      placeholder="Scaling kitchens"
                    />
                  </label>

                  <div className="flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => updateSubscription(index, { isActive: !plan.isActive })}
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold ${
                        plan.isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSubscription(index)}
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600"
                    >
                      Remove
                    </button>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Monthly price</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={plan.monthlyPrice}
                      onChange={(event) => updateSubscription(index, { monthlyPrice: event.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Yearly price</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={plan.yearlyPrice ?? ""}
                      onChange={(event) => updateSubscription(index, { yearlyPrice: event.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Platform order commission (%)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={plan.orderCommissionRate}
                      onChange={(event) => updateSubscription(index, { orderCommissionRate: event.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Delivery platform fee (%)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={plan.deliveryCommissionRate}
                      onChange={(event) => updateSubscription(index, { deliveryCommissionRate: event.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                    />
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Benefits summary</span>
                  <textarea
                    value={plan.benefitsSummary}
                    onChange={(event) => updateSubscription(index, { benefitsSummary: event.target.value })}
                    className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                    placeholder="Featured placement, better analytics, lower commission, and priority support."
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 rounded-[2rem] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Save BiteHub platform settings</p>
            <p className="text-sm text-slate-500">
              This will update live operational defaults for the admin panel and platform economics.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}
