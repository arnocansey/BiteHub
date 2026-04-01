"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { adminRequest, clearAdminSession, type AdminSession, useAdminData } from "../lib/admin-client";
import { getAdminNavigation, getAdminWorkspaceLabel, isSuperAdmin } from "../lib/admin-access";
import {
  adminDateRangeOptions,
  getAdminDateRangeLabel,
  parseAdminDateRange,
  type AdminDateRange
} from "../lib/admin-date-range";

export function DashboardShell({
  title,
  description,
  session,
  children
}: {
  title: string;
  description: string;
  session: AdminSession;
  children: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const managerTitle = getAdminWorkspaceLabel(session);
  const managerName = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ").trim();
  const navigation = getAdminNavigation(session);
  const superAdmin = isSuperAdmin(session);
  const [showInbox, setShowInbox] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [activeRange, setActiveRange] = useState<AdminDateRange>("today");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setActiveRange(parseAdminDateRange(params.get("range")));
  }, [pathname]);

  const inboxQuery = useAdminData(
    async () => {
      const [vendors, riders, tickets, notifications] = await Promise.all([
        adminRequest<Array<{ id: string; businessName: string; user?: { firstName?: string; lastName?: string } }>>(
          "/admin/vendors/pending"
        ),
        adminRequest<Array<{ id: string; user?: { firstName?: string; lastName?: string } }>>("/admin/riders/pending"),
        adminRequest<Array<{ id: string; subject: string; severity: string }>>("/admin/support-tickets"),
        adminRequest<Array<{ id: string; title: string; body: string; isRead: boolean }>>("/notifications")
      ]);

      return {
        vendors,
        riders,
        tickets: tickets.filter((ticket) => ticket.severity !== "LOW").slice(0, 4),
        notifications
      };
    },
    [session.accessToken]
  );

  const inboxItems = useMemo(() => {
    const vendorItems = (inboxQuery.data?.vendors ?? []).slice(0, 2).map((vendor) => ({
      href: "/approvals",
      tone: "amber" as const,
      title: vendor.businessName,
      subtitle: "Vendor awaiting approval"
    }));
    const riderItems = (inboxQuery.data?.riders ?? []).slice(0, 2).map((rider) => ({
      href: "/approvals",
      tone: "sky" as const,
      title: `${rider.user?.firstName ?? "Rider"} ${rider.user?.lastName ?? ""}`.trim(),
      subtitle: "Rider awaiting approval"
    }));
    const ticketItems = (inboxQuery.data?.tickets ?? []).map((ticket) => ({
      href: "/compliance",
      tone: "rose" as const,
      title: ticket.subject,
      subtitle: `${ticket.severity} support issue`
    }));
    const notificationItems = (inboxQuery.data?.notifications ?? [])
      .filter((notification) => !notification.isRead)
      .slice(0, 3)
      .map((notification) => ({
        href: "/orders",
        tone: "emerald" as const,
        title: notification.title,
        subtitle: notification.body
      }));

    return [...notificationItems, ...vendorItems, ...riderItems, ...ticketItems].slice(0, 6);
  }, [inboxQuery.data]);

  const unreadCount =
    (inboxQuery.data?.notifications.filter((notification) => !notification.isRead).length ?? 0) +
    (inboxQuery.data?.vendors.length ?? 0) +
    (inboxQuery.data?.riders.length ?? 0) +
    (inboxQuery.data?.tickets.length ?? 0);

  async function markInboxNotificationsRead() {
    await adminRequest("/notifications/read-all", { method: "PATCH" });
    await inboxQuery.refresh();
  }

  function handleLogout() {
    setShowLogoutPrompt(true);
  }

  function confirmLogout() {
    setShowLogoutPrompt(false);
    clearAdminSession();
    router.replace("/login");
  }

  function handleRangeChange(nextRange: AdminDateRange) {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    params.set("range", nextRange);
    setActiveRange(nextRange);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bitehub-admin-range-change", { detail: nextRange }));
    }
    router.replace(`${pathname}?${params.toString()}`);
    setShowDateMenu(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f6f7] p-4 md:p-6">
      {showLogoutPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Logout</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">Do you want to log out?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You’ll be signed out of the BiteHub admin workspace and returned to the login screen.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutPrompt(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                No, stay here
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[260px_1fr]">
        <aside className="self-start rounded-[30px] bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          <div className="flex items-center gap-4 px-2">
            <div className="flex h-16 w-16 items-center justify-center">
              <Image src="/bitehub-icon.png" alt="BiteHub" width={64} height={64} className="h-16 w-16 object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">BiteHub</h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500">
                {superAdmin ? "Super Admin Panel" : "Admin Panel"}
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.primary.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-8 border-t border-slate-100" />

          <nav className="space-y-2">
            {navigation.secondary.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="space-y-5">
          {superAdmin ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] bg-white px-6 py-4 shadow-sm">
              <label className="flex min-w-[320px] flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search orders, vendors, riders..."
                  className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInbox((current) => !current);
                      setShowDateMenu(false);
                    }}
                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition hover:bg-orange-50 hover:text-orange-500"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 ? (
                      <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {showInbox ? (
                    <div className="absolute right-0 z-20 mt-3 w-[320px] rounded-[24px] border border-slate-100 bg-white p-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900">Action inbox</p>
                          <p className="text-xs text-slate-500">Approvals and high-priority support items</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void markInboxNotificationsRead()}
                            className="text-xs font-semibold text-slate-500 hover:text-orange-600"
                          >
                            Mark all read
                          </button>
                          <Link href="/notifications" className="text-xs font-semibold text-orange-500 hover:text-orange-600">
                            Notifications
                          </Link>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {inboxQuery.loading ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Loading inbox...</div>
                        ) : inboxItems.length ? (
                          inboxItems.map((item, index) => (
                            <Link
                              key={`${item.href}-${item.title}-${index}`}
                              href={item.href}
                              onClick={() => setShowInbox(false)}
                              className="block rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-orange-50"
                            >
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p
                                className={`mt-1 text-xs font-semibold ${
                                  item.tone === "rose"
                                    ? "text-rose-500"
                                    : item.tone === "emerald"
                                      ? "text-emerald-500"
                                    : item.tone === "sky"
                                      ? "text-sky-500"
                                      : "text-amber-500"
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            </Link>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            No urgent items right now.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDateMenu((current) => !current);
                      setShowInbox(false);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
                  >
                    <span>{getAdminDateRangeLabel(activeRange)}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showDateMenu ? (
                    <div className="absolute right-0 z-20 mt-3 w-44 rounded-[24px] border border-slate-100 bg-white p-2 shadow-xl">
                      {adminDateRangeOptions.map((option) => {
                        const active = option.value === activeRange;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleRangeChange(option.value)}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                              active ? "bg-orange-500 font-semibold text-white" : "text-slate-600 hover:bg-orange-50"
                            }`}
                          >
                            <span>{option.label}</span>
                            {active ? <span className="text-[10px] uppercase tracking-[0.18em]">Live</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : null}

          <header className="rounded-[30px] bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500">Manager Workspace</p>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Signed in as</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{managerTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">{managerName || session.user.email}</p>
                </div>
                {!superAdmin ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                ) : null}
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
