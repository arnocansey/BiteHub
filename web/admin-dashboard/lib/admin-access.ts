"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  Bell,
  Bike,
  ClipboardCheck,
  FileText,
  Gift,
  LayoutDashboard,
  PackageCheck,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Users,
  Wallet
} from "lucide-react";
import type { AdminSession } from "./admin-client";

export type AdminManagerTitle =
  | "Admin User Manager"
  | "Admin Rider Manager"
  | "Admin Finance Manager"
  | "Admin Customer Service Manager"
  | "Admin Vendor Manager"
  | "Platform Administrator";

export type AdminArea =
  | "overview"
  | "users"
  | "orders"
  | "vendors"
  | "riders"
  | "analytics"
  | "compliance"
  | "approvals"
  | "restaurants"
  | "reports"
  | "finance"
  | "promotions"
  | "notifications"
  | "settings";

type NavigationItem = {
  area: AdminArea;
  href: string;
  label: string;
  icon: LucideIcon;
  section: "primary" | "secondary";
};

const allNavigationItems: NavigationItem[] = [
  { area: "overview", href: "/", label: "Dashboard", icon: LayoutDashboard, section: "primary" },
  { area: "orders", href: "/orders", label: "Orders", icon: ShoppingBag, section: "primary" },
  { area: "vendors", href: "/vendors", label: "Vendors", icon: Store, section: "primary" },
  { area: "riders", href: "/riders", label: "Riders", icon: Bike, section: "primary" },
  { area: "users", href: "/users", label: "Customers", icon: Users, section: "primary" },
  { area: "approvals", href: "/approvals", label: "Approvals", icon: ClipboardCheck, section: "primary" },
  { area: "restaurants", href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed, section: "primary" },
  { area: "finance", href: "/finance", label: "Finance", icon: Wallet, section: "primary" },
  { area: "promotions", href: "/promotions", label: "Promotions", icon: Gift, section: "primary" },
  { area: "analytics", href: "/analytics", label: "Analytics", icon: BarChart2, section: "secondary" },
  { area: "reports", href: "/reports", label: "Reports", icon: FileText, section: "secondary" },
  { area: "notifications", href: "/notifications", label: "Notifications", icon: Bell, section: "secondary" },
  { area: "compliance", href: "/compliance", label: "Compliance", icon: Shield, section: "secondary" },
  { area: "settings", href: "/settings", label: "Settings", icon: Settings, section: "secondary" }
];

const allowedAreasByTitle: Record<AdminManagerTitle, AdminArea[]> = {
  "Platform Administrator": [
    "overview",
    "users",
    "orders",
    "vendors",
    "riders",
    "analytics",
    "compliance",
    "approvals",
    "restaurants",
    "reports",
    "finance",
    "promotions",
    "notifications",
    "settings"
  ],
  "Admin User Manager": ["overview", "users", "analytics", "reports", "settings"],
  "Admin Rider Manager": ["overview", "riders", "approvals", "analytics", "reports", "settings"],
  "Admin Finance Manager": ["overview", "orders", "vendors", "riders", "users", "finance", "promotions", "reports", "settings"],
  "Admin Customer Service Manager": ["overview", "orders", "compliance", "notifications", "analytics", "reports", "settings"],
  "Admin Vendor Manager": ["overview", "vendors", "restaurants", "compliance", "approvals", "analytics", "reports", "settings"]
};

export function getAdminManagerTitle(session: AdminSession | null | undefined): AdminManagerTitle {
  const title = session?.user.adminProfile?.title;

  if (
    title === "Admin User Manager" ||
    title === "Admin Rider Manager" ||
    title === "Admin Finance Manager" ||
    title === "Admin Customer Service Manager" ||
    title === "Admin Vendor Manager" ||
    title === "Platform Administrator"
  ) {
    return title;
  }

  return "Platform Administrator";
}

export function isSuperAdmin(session: AdminSession | null | undefined) {
  return Boolean(session?.user.adminProfile?.isSuperAdmin);
}

export function hasAdminAccess(session: AdminSession | null | undefined, area: AdminArea) {
  if (isSuperAdmin(session)) {
    return true;
  }

  const title = getAdminManagerTitle(session);
  return allowedAreasByTitle[title].includes(area);
}

export function getAdminNavigation(session: AdminSession | null | undefined) {
  const title = getAdminManagerTitle(session);

  if (!isSuperAdmin(session) && title === "Admin Finance Manager") {
    const financeMenuOrder: AdminArea[] = [
      "overview",
      "orders",
      "vendors",
      "riders",
      "users",
      "finance",
      "promotions",
      "reports",
      "settings"
    ];

    const items = financeMenuOrder
      .map((area) => allNavigationItems.find((item) => item.area === area))
      .filter((item): item is NavigationItem => Boolean(item));

    return {
      primary: items.filter((item) => item.area !== "reports" && item.area !== "settings"),
      secondary: items.filter((item) => item.area === "reports" || item.area === "settings")
    };
  }

  const items = isSuperAdmin(session)
    ? allNavigationItems
    : allNavigationItems.filter((item) => {
        return allowedAreasByTitle[title].includes(item.area);
      });

  return {
    primary: items.filter((item) => item.section === "primary"),
    secondary: items.filter((item) => item.section === "secondary")
  };
}

export function getAdminWorkspaceLabel(session: AdminSession | null | undefined) {
  return isSuperAdmin(session) ? "Super Admin Panel" : getAdminManagerTitle(session);
}

export const superAdminOverviewCards = [
  { area: "overview", label: "Overview", icon: LayoutDashboard },
  { area: "orders", label: "Orders", icon: ShoppingBag },
  { area: "vendors", label: "Vendors", icon: Store },
  { area: "riders", label: "Riders", icon: Bike },
  { area: "users", label: "Customers", icon: Users },
  { area: "approvals", label: "Approvals", icon: ClipboardCheck },
  { area: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { area: "analytics", label: "Analytics", icon: BarChart2 },
  { area: "reports", label: "Reports", icon: FileText },
  { area: "notifications", label: "Notifications", icon: Bell },
  { area: "finance", label: "Finance", icon: Wallet },
  { area: "promotions", label: "Promotions", icon: Gift },
  { area: "compliance", label: "Compliance", icon: Shield },
  { area: "settings", label: "Settings", icon: PackageCheck }
] as const;
