import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiteHubSplash } from "./components/BiteHubSplash";

type Tab = "dashboard" | "orders" | "menu" | "analytics" | "settings";
type AuthMode = "signin" | "signup" | "forgot";
type OrderFilter = "all" | "pending" | "accepted" | "preparing" | "ready" | "rejected" | "delivered";
type Session = { accessToken: string; refreshToken: string; user: { role: string; firstName: string; lastName: string; email?: string } };
type VendorDataBundle = {
  dashboardData: any;
  orderData: any[];
  restaurantData: any[];
  menuData: any[];
  forecastData: any;
  notificationData: any[];
};
const sessionStorageKey = "bitehub_vendor_session";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured;

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any)?.manifest?.debuggerHost;
  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : null;

  if (host) {
    return `http://${host}:4000/api/v1`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/api/v1";
  }

  return "http://127.0.0.1:4000/api/v1";
}

const apiBaseUrl = resolveApiBaseUrl();
const vendorLogo = require("./assets/bitehub-icon.png");
const currencyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 2
});

function formatMoney(value: number) {
  return currencyFormatter.format(Number(value ?? 0));
}

const statusAccent: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "#dbeafe", text: "#1d4ed8", label: "New" },
  ACCEPTED: { bg: "#fef3c7", text: "#b45309", label: "Accepted" },
  PREPARING: { bg: "#ffedd5", text: "#c2410c", label: "Preparing" },
  READY_FOR_PICKUP: { bg: "#dcfce7", text: "#15803d", label: "Ready" },
  REJECTED: { bg: "#fee2e2", text: "#dc2626", label: "Rejected" },
  DELIVERED: { bg: "#f3f4f6", text: "#6b7280", label: "Delivered" }
};

const orderFilters: Array<{ id: OrderFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "New" },
  { id: "accepted", label: "Accepted" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "rejected", label: "Rejected" },
  { id: "delivered", label: "Delivered" }
];

const openingHoursTemplate = [
  { label: "Mon - Fri", open: "", close: "", isClosed: false },
  { label: "Saturday", open: "", close: "", isClosed: false },
  { label: "Sunday", open: "", close: "", isClosed: true }
];

function normalizeOpeningHours(input: any) {
  if (!Array.isArray(input) || !input.length) {
    return openingHoursTemplate.map((row) => ({ ...row }));
  }

  return openingHoursTemplate.map((row, index) => {
    const match = input.find((entry: any) => entry?.label === row.label) ?? input[index];
    return {
      label: row.label,
      open: String(match?.open ?? row.open),
      close: String(match?.close ?? row.close),
      isClosed: Boolean(match?.isClosed ?? row.isClosed)
    };
  });
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const tanstackQueryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [editingPayout, setEditingPayout] = useState(false);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [restaurantFormOpen, setRestaurantFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [settingsDraft, setSettingsDraft] = useState({
    autoAcceptOrders: false,
    notifyOnNewOrders: true,
    notifyOnPromotions: false,
    isOpen: true,
    openingHours: normalizeOpeningHours(null),
    payoutBankName: "",
    payoutAccountNumber: "",
    payoutAccountName: "",
    payoutVerified: false,
    payoutAccount: ""
  });
  const [menuDraft, setMenuDraft] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    preparationMins: "20",
    badgeText: "",
    spiceLevel: "",
    calories: "",
    isSignature: false,
    isFeatured: false
  });
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [restaurantDraft, setRestaurantDraft] = useState({
    name: "",
    address: "",
    description: "",
    deliveryFee: "12",
    minimumOrderAmount: "25",
    estimatedDeliveryMins: "25",
    priceBand: "Mid-range",
    storyHeadline: "",
    storyBody: ""
  });
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyRestaurantId, setBusyRestaurantId] = useState<string | null>(null);

  async function refreshSessionTokens(activeSession: Session) {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: activeSession.refreshToken })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Session refresh failed.");
    }

    const nextSession: Session = {
      ...activeSession,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken
    };
    setSession(nextSession);
    return nextSession;
  }

  async function request<T>(path: string, init: RequestInit = {}, activeSession: Session | null = session, allowRefresh = true) {
    const makeRequest = (accessToken?: string) =>
      fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(init.headers ?? {})
        }
      });

    let response: Response;

    try {
      response = await makeRequest(activeSession?.accessToken);
    } catch {
      throw new Error(`Network request failed. Make sure the BiteHub backend is running at ${apiBaseUrl}.`);
    }

    if ((response.status === 401 || response.status === 403) && allowRefresh && activeSession?.refreshToken) {
      try {
        const refreshedSession = await refreshSessionTokens(activeSession);
        response = await makeRequest(refreshedSession.accessToken);
      } catch {
        setSession(null);
        throw new Error("Your session has expired. Please sign in again.");
      }
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message ?? "Request failed.");
    return payload as T;
  }

  function clearAuthFeedback() {
    setError(null);
    setAuthMessage(null);
  }

  function resetMenuDraft() {
    setMenuDraft({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      preparationMins: "20",
      badgeText: "",
      spiceLevel: "",
      calories: "",
      isSignature: false,
      isFeatured: false
    });
    setEditingItemId(null);
    setMenuFormOpen(false);
  }

  async function fetchVendorDataBundle(activeSession: Session): Promise<VendorDataBundle> {
    const [dashboardData, orderData, restaurantData, menuData, forecastData, notificationData] = await Promise.all([
      request<any>("/vendors/dashboard", {}, activeSession),
      request<any[]>("/vendors/orders", {}, activeSession),
      request<any[]>("/vendors/restaurants/me", {}, activeSession),
      request<any[]>("/vendors/menu-items", {}, activeSession),
      request<any>("/vendors/forecasts", {}, activeSession),
      request<any[]>("/notifications", {}, activeSession)
    ]);

    return { dashboardData, orderData, restaurantData, menuData, forecastData, notificationData };
  }

  function applyVendorBundle(bundle: VendorDataBundle) {
    setDashboard(bundle.dashboardData);
    setOrders(bundle.orderData);
    setRestaurants(bundle.restaurantData);
    setMenuItems(bundle.menuData);
    setForecasts(bundle.forecastData);
    setNotifications(bundle.notificationData);
    setSelectedRestaurantId((current) => current || bundle.restaurantData[0]?.id || "");
  }

  const vendorDataQuery = useQuery({
    queryKey: ["vendor-data", session?.user?.email ?? "guest"],
    queryFn: () => fetchVendorDataBundle(session!),
    enabled: Boolean(session)
  });

  async function loadVendorData(activeSession: Session) {
    const bundle = await tanstackQueryClient.fetchQuery({
      queryKey: ["vendor-data", activeSession.user.email ?? activeSession.user.firstName ?? "vendor"],
      queryFn: () => fetchVendorDataBundle(activeSession)
    });
    applyVendorBundle(bundle);
  }

  useEffect(() => {
    if (vendorDataQuery.data) {
      applyVendorBundle(vendorDataQuery.data);
    }
  }, [vendorDataQuery.data]);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(sessionStorageKey);
        if (!raw) {
          setSessionReady(true);
          return;
        }

        const restored = JSON.parse(raw) as Session;
        if (!restored?.accessToken || !restored?.refreshToken) {
          await AsyncStorage.removeItem(sessionStorageKey);
          setSessionReady(true);
          return;
        }
        setSession(restored);
        await loadVendorData(restored);
      } catch (err) {
        await AsyncStorage.removeItem(sessionStorageKey);
        setError(err instanceof Error ? err.message : "Unable to restore your session.");
      } finally {
        setSessionReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sessionReady) return;

    void (session
      ? AsyncStorage.setItem(sessionStorageKey, JSON.stringify(session))
      : AsyncStorage.removeItem(sessionStorageKey));
  }, [session, sessionReady]);

  async function handleSignIn() {
    clearAuthFeedback();
    setLoading(true);
    try {
      const payload = await request<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (payload.user?.role !== "VENDOR") throw new Error("This account does not have vendor access.");
      const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
      setSession(nextSession);
      await loadVendorData(nextSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    clearAuthFeedback();
    setLoading(true);
    try {
      const payload = await request<any>("/auth/register/vendor", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          businessName,
          phone: phone.trim() || undefined,
          email,
          password,
          role: "VENDOR"
        })
      });
      const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
      setSession(nextSession);
      setAuthMode("signin");
      await loadVendorData(nextSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create vendor account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    clearAuthFeedback();
    setLoading(true);
    try {
      const payload = await request<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setAuthMessage(payload.resetToken ? `Reset token: ${payload.resetToken}` : payload.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare password reset.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    clearAuthFeedback();
    setLoading(true);
    try {
      const payload = await request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password: resetPasswordValue })
      });
      setAuthMessage(payload.message);
      setResetToken("");
      setResetPasswordValue("");
      setPassword("");
      setAuthMode("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRestaurantMode(restaurantId: string, operatingMode: "LIVE" | "BUSY" | "PAUSED") {
    if (!session) return;
    setBusyRestaurantId(restaurantId);
    setError(null);
    try {
      await request(
        "/vendors/operating-state",
        {
          method: "PATCH",
          body: JSON.stringify({
            restaurantId,
            operatingMode,
            pauseReason: operatingMode === "PAUSED" ? "Paused from vendor app" : undefined
          })
        },
        session
      );
      await loadVendorData(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update operating state.");
    } finally {
      setBusyRestaurantId(null);
    }
  }

  async function updateOrderStatus(orderId: string, status: "ACCEPTED" | "PREPARING" | "READY_FOR_PICKUP" | "REJECTED") {
    if (!session) return;
    setBusyOrderId(orderId);
    setError(null);
    try {
      await request(`/vendors/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, session);
      await loadVendorData(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order status.");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function saveVendorSettings(nextDraft = settingsDraft) {
    if (!session || !selectedSettingsRestaurant) return;
    setSettingsSaving(true);
    setError(null);
    try {
      const refreshed = await request<any>(
        "/vendors/settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            restaurantId: selectedSettingsRestaurant.id,
            isOpen: nextDraft.isOpen,
            autoAcceptOrders: nextDraft.autoAcceptOrders,
            notifyOnNewOrders: nextDraft.notifyOnNewOrders,
            notifyOnPromotions: nextDraft.notifyOnPromotions,
            openingHours: nextDraft.openingHours.map((entry) => ({
              label: entry.label,
              open: entry.open.trim() || undefined,
              close: entry.close.trim() || undefined,
              isClosed: entry.isClosed
            })),
            payoutAccount: nextDraft.payoutAccount.trim() || undefined,
            payoutBankName: nextDraft.payoutBankName.trim() || undefined,
            payoutAccountNumber: nextDraft.payoutAccountNumber.trim() || undefined,
            payoutAccountName: nextDraft.payoutAccountName.trim() || undefined,
            payoutVerified: nextDraft.payoutVerified
          })
        },
        session
      );

      setDashboard(refreshed);
      setRestaurants(refreshed?.restaurants ?? []);
      const refreshedRestaurant =
        (refreshed?.restaurants ?? []).find((restaurant: any) => restaurant.id === selectedSettingsRestaurant.id) ??
        refreshed?.restaurants?.[0] ??
        null;

      if (refreshedRestaurant && refreshedRestaurant.id !== selectedRestaurantId) {
        setSelectedRestaurantId(refreshedRestaurant.id);
      }

      setSettingsDraft({
        autoAcceptOrders: Boolean(refreshed?.autoAcceptOrders),
        notifyOnNewOrders: refreshed?.notifyOnNewOrders !== false,
        notifyOnPromotions: Boolean(refreshed?.notifyOnPromotions),
        isOpen: refreshedRestaurant ? refreshedRestaurant.operatingMode !== "PAUSED" : true,
        openingHours: normalizeOpeningHours(refreshedRestaurant?.openingHours),
        payoutBankName: refreshed?.payoutBankName ?? "",
        payoutAccountNumber: refreshed?.payoutAccountNumber ?? "",
        payoutAccountName: refreshed?.payoutAccountName ?? "",
        payoutVerified: Boolean(refreshed?.payoutVerified),
        payoutAccount: refreshed?.payoutAccount ?? ""
      });
      setEditingPayout(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save vendor settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  function startCreateItem() {
    setEditingItemId(null);
    setMenuFormOpen(true);
    setMenuDraft({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      preparationMins: "20",
      badgeText: "",
      spiceLevel: "",
      calories: "",
      isSignature: false,
      isFeatured: false
    });
  }

  function resetRestaurantDraft() {
    setRestaurantDraft({
      name: "",
      address: "",
      description: "",
      deliveryFee: "12",
      minimumOrderAmount: "25",
      estimatedDeliveryMins: "25",
      priceBand: "Mid-range",
      storyHeadline: "",
      storyBody: ""
    });
    setEditingRestaurantId(null);
    setRestaurantFormOpen(false);
  }

  function startEditItem(item: any) {
    setEditingItemId(item.id);
    setSelectedRestaurantId(item.restaurantId);
    setMenuFormOpen(true);
    setMenuDraft({
      name: item.name ?? "",
      description: item.description ?? "",
      price: String(Number(item.price ?? 0)),
      imageUrl: item.imageUrl ?? "",
      preparationMins: String(item.preparationMins ?? 20),
      badgeText: item.badgeText ?? "",
      spiceLevel: item.spiceLevel ? String(item.spiceLevel) : "",
      calories: item.calories ? String(item.calories) : "",
      isSignature: Boolean(item.isSignature),
      isFeatured: Boolean(item.isFeatured)
    });
  }

  function startEditRestaurant(restaurant: any) {
    setEditingRestaurantId(restaurant.id);
    setRestaurantFormOpen(true);
    setSelectedRestaurantId(restaurant.id);
    setRestaurantDraft({
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      description: restaurant.description ?? "",
      deliveryFee: String(Number(restaurant.deliveryFee ?? 12)),
      minimumOrderAmount: String(Number(restaurant.minimumOrderAmount ?? 25)),
      estimatedDeliveryMins: String(restaurant.estimatedDeliveryMins ?? 25),
      priceBand: restaurant.priceBand ?? "Mid-range",
      storyHeadline: restaurant.storyHeadline ?? "",
      storyBody: restaurant.storyBody ?? ""
    });
  }

  async function submitMenuItem() {
    if (!session || !selectedRestaurantId) {
      setError("Choose a restaurant before saving a menu item.");
      return;
    }

    setBusyItemId(editingItemId ?? "new");
    setError(null);
    try {
      const payload = {
        restaurantId: selectedRestaurantId,
        name: menuDraft.name.trim(),
        description: menuDraft.description.trim() || undefined,
        price: Number(menuDraft.price),
        imageUrl: menuDraft.imageUrl.trim() || undefined,
        preparationMins: Number(menuDraft.preparationMins || "20"),
        badgeText: menuDraft.badgeText.trim() || undefined,
        spiceLevel: menuDraft.spiceLevel ? Number(menuDraft.spiceLevel) : undefined,
        calories: menuDraft.calories ? Number(menuDraft.calories) : undefined,
        isSignature: menuDraft.isSignature,
        isFeatured: menuDraft.isFeatured
      };

      if (!payload.name || Number.isNaN(payload.price) || payload.price <= 0) {
        throw new Error("Add a valid item name and price.");
      }

      if (editingItemId) {
        await request(`/vendors/menu-items/${editingItemId}`, { method: "PATCH", body: JSON.stringify(payload) }, session);
      } else {
        await request("/vendors/menu-items", { method: "POST", body: JSON.stringify(payload) }, session);
      }

      await loadVendorData(session);
      resetMenuDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save menu item.");
    } finally {
      setBusyItemId(null);
    }
  }

  async function pickMenuImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Allow photo library access to attach menu images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const nextImage =
      asset.base64 && asset.mimeType ? `data:${asset.mimeType};base64,${asset.base64}` : asset.uri;

    setMenuDraft((current) => ({
      ...current,
      imageUrl: nextImage
    }));
  }

  async function toggleItemAvailability(item: any) {
    if (!session) return;
    setBusyItemId(item.id);
    setError(null);
    try {
      await request(
        `/vendors/menu-items/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: item.status === "AVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE" })
        },
        session
      );
      await loadVendorData(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update item availability.");
    } finally {
      setBusyItemId(null);
    }
  }

  async function deleteItem(itemId: string) {
    if (!session) return;
    setBusyItemId(itemId);
    setError(null);
    try {
      await request(`/vendors/menu-items/${itemId}`, { method: "DELETE" }, session);
      await loadVendorData(session);
      if (editingItemId === itemId) resetMenuDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete item.");
    } finally {
      setBusyItemId(null);
    }
  }

  async function submitRestaurant() {
    if (!session) return;
    setBusyRestaurantId(editingRestaurantId ?? "create");
    setError(null);
    try {
      const payload = {
        name: restaurantDraft.name.trim(),
        address: restaurantDraft.address.trim(),
        description: restaurantDraft.description.trim() || undefined,
        deliveryFee: Number(restaurantDraft.deliveryFee),
        minimumOrderAmount: Number(restaurantDraft.minimumOrderAmount),
        estimatedDeliveryMins: Number(restaurantDraft.estimatedDeliveryMins),
        priceBand: restaurantDraft.priceBand.trim() || undefined,
        storyHeadline: restaurantDraft.storyHeadline.trim() || undefined,
        storyBody: restaurantDraft.storyBody.trim() || undefined
      };

      if (!payload.name || !payload.address) {
        throw new Error("Add the restaurant name and address before saving.");
      }

      if (editingRestaurantId) {
        await request(`/vendors/restaurants/${editingRestaurantId}`, { method: "PATCH", body: JSON.stringify(payload) }, session);
      } else {
        await request("/vendors/restaurants", { method: "POST", body: JSON.stringify(payload) }, session);
      }
      await loadVendorData(session);
      resetRestaurantDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save restaurant.");
    } finally {
      setBusyRestaurantId(null);
    }
  }

  function signOut() {
    Alert.alert("Logout", "Do you want to logout", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          setSession(null);
          setActiveTab("dashboard");
          setAuthMode("signin");
          setOrderFilter("all");
          setDashboard(null);
          setOrders([]);
          setRestaurants([]);
          setMenuItems([]);
          setNotifications([]);
          setForecasts(null);
          setMenuFormOpen(false);
          setEditingItemId(null);
          setSelectedRestaurantId("");
        }
      }
    ]);
  }

  async function markNotificationRead(notificationId: string) {
    if (!session) return;
    try {
      await request(`/notifications/${notificationId}/read`, { method: "PATCH" }, session);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update notification.");
    }
  }

  async function markAllNotificationsRead() {
    if (!session) return;
    try {
      await request("/notifications/read-all", { method: "PATCH" }, session);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark all notifications as read.");
    }
  }

  async function clearReadNotifications() {
    if (!session) return;
    try {
      await request("/notifications/clear-read", { method: "DELETE" }, session);
      setNotifications((current) => current.filter((item) => !item.isRead));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear read notifications.");
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadVendorData(session).catch((err) => setError(err instanceof Error ? err.message : "Unable to refresh vendor data."));
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2300);
    return () => clearTimeout(timer);
  }, []);

  const selectedSettingsRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? restaurants[0] ?? null,
    [restaurants, selectedRestaurantId]
  );
  const vendorName = dashboard?.businessName ?? (businessName || "BiteHub Vendor");
  const vendorDisplayName = session ? `${session.user.firstName} ${session.user.lastName}`.trim() : "Vendor";
  const liveRestaurants = restaurants.filter((restaurant) => restaurant.operatingMode === "LIVE");
  const unreadNotifications = notifications.filter((notification) => !notification.isRead);
  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const vendorPayoutForOrder = (order: any) => Number(order?.settlement?.vendorPayoutAmount ?? order?.subtotalAmount ?? 0);
  const grossSalesForOrder = (order: any) => Number(order?.settlement?.vendorGrossSales ?? order?.subtotalAmount ?? order?.totalAmount ?? 0);
  const averageRating = restaurants.length
    ? restaurants.reduce((sum, restaurant) => sum + Number(restaurant.averageRating ?? 0), 0) / restaurants.length
    : 0;
  const payoutDue = useMemo(() => orders.reduce((sum, order) => sum + vendorPayoutForOrder(order), 0), [orders]);
  const grossSales = useMemo(() => orders.reduce((sum, order) => sum + grossSalesForOrder(order), 0), [orders]);
  const topItems = useMemo(
    () => [...menuItems].sort((a, b) => Number(b?._count?.orderItems ?? 0) - Number(a?._count?.orderItems ?? 0)).slice(0, 5),
    [menuItems]
  );
  const groupedMenuItems = useMemo(() => {
    return menuItems.reduce<Record<string, any[]>>((groups, item) => {
      const key = item.category?.name ?? item.restaurant?.name ?? "Menu";
      groups[key] = [...(groups[key] ?? []), item];
      return groups;
    }, {});
  }, [menuItems]);
  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    const statusMap: Record<OrderFilter, string | null> = {
      all: null,
      pending: "PENDING",
      accepted: "ACCEPTED",
      preparing: "PREPARING",
      ready: "READY_FOR_PICKUP",
      rejected: "REJECTED",
      delivered: "DELIVERED"
    };
    return orders.filter((order) => order.status === statusMap[orderFilter]);
  }, [orderFilter, orders]);
  const restaurantCreator = (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{editingRestaurantId ? "Edit Restaurant" : restaurants.length ? "Add Restaurant" : "Create Your First Restaurant"}</Text>
        {!restaurantFormOpen ? (
          <Pressable style={styles.primarySmallButton} onPress={() => setRestaurantFormOpen(true)}>
            <Ionicons name="add" size={14} color="#ffffff" />
            <Text style={styles.primaryMiniButtonText}>New</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.cardMeta}>Each vendor account can manage multiple restaurants. Add or update one here to keep your dashboard and menu tools current.</Text>
      {restaurantFormOpen ? (
        <>
          <TextInput value={restaurantDraft.name} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, name: value }))} placeholder="Restaurant name" placeholderTextColor="#9ca3af" style={styles.input} />
          <TextInput value={restaurantDraft.address} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, address: value }))} placeholder="Restaurant address" placeholderTextColor="#9ca3af" style={styles.input} />
          <TextInput value={restaurantDraft.description} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, description: value }))} placeholder="Short description" placeholderTextColor="#9ca3af" style={styles.input} multiline />
          <TextInput value={restaurantDraft.storyHeadline} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, storyHeadline: value }))} placeholder="Story headline" placeholderTextColor="#9ca3af" style={styles.input} />
          <TextInput value={restaurantDraft.storyBody} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, storyBody: value }))} placeholder="Story body" placeholderTextColor="#9ca3af" style={styles.input} multiline />
          <View style={styles.inlineInputs}>
            <TextInput value={restaurantDraft.deliveryFee} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, deliveryFee: value }))} placeholder="Delivery fee" placeholderTextColor="#9ca3af" style={[styles.input, styles.halfInput]} keyboardType="numeric" />
            <TextInput value={restaurantDraft.minimumOrderAmount} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, minimumOrderAmount: value }))} placeholder="Minimum order" placeholderTextColor="#9ca3af" style={[styles.input, styles.halfInput]} keyboardType="numeric" />
          </View>
          <View style={styles.inlineInputs}>
            <TextInput value={restaurantDraft.estimatedDeliveryMins} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, estimatedDeliveryMins: value }))} placeholder="Delivery mins" placeholderTextColor="#9ca3af" style={[styles.input, styles.halfInput]} keyboardType="numeric" />
            <TextInput value={restaurantDraft.priceBand} onChangeText={(value) => setRestaurantDraft((current) => ({ ...current, priceBand: value }))} placeholder="Price band" placeholderTextColor="#9ca3af" style={[styles.input, styles.halfInput]} />
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryMiniButton} onPress={() => void submitRestaurant()}>
              <Text style={styles.primaryMiniButtonText}>{busyRestaurantId === (editingRestaurantId ?? "create") ? "Saving..." : editingRestaurantId ? "Save restaurant" : "Create restaurant"}</Text>
            </Pressable>
            <Pressable style={styles.outlineButton} onPress={resetRestaurantDraft}>
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
  const weeklyRevenue = useMemo(() => {
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const totals = Array.from({ length: 7 }, () => 0);
    orders.forEach((order) => {
      const placedAt = new Date(order.placedAt);
      if (placedAt >= start) {
        const diff = Math.floor((placedAt.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (diff >= 0 && diff < 7) totals[diff] += vendorPayoutForOrder(order);
      }
    });
    const max = Math.max(...totals, 1);
    return totals.map((value, index) => ({ label: labels[index], value, height: Math.max(12, Math.round((value / max) * 100)) }));
  }, [orders]);

  useEffect(() => {
    if (!dashboard) return;
    setSettingsDraft({
      autoAcceptOrders: Boolean(dashboard.autoAcceptOrders),
      notifyOnNewOrders: dashboard.notifyOnNewOrders !== false,
      notifyOnPromotions: Boolean(dashboard.notifyOnPromotions),
      isOpen: selectedSettingsRestaurant ? selectedSettingsRestaurant.operatingMode !== "PAUSED" : true,
      openingHours: normalizeOpeningHours(selectedSettingsRestaurant?.openingHours),
      payoutBankName: dashboard.payoutBankName ?? "",
      payoutAccountNumber: dashboard.payoutAccountNumber ?? "",
      payoutAccountName: dashboard.payoutAccountName ?? "",
      payoutVerified: Boolean(dashboard.payoutVerified),
      payoutAccount: dashboard.payoutAccount ?? ""
    });
  }, [dashboard, selectedSettingsRestaurant]);

  if (showSplash || !sessionReady) {
    return <BiteHubSplash accentColor="#cc0000" label="BiteHub Vendor" logoSource={vendorLogo} subtitle="Own the rush with confidence." />;
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.authScrollContent}>
        <View style={styles.authShell}>
          <Image source={vendorLogo} style={styles.authLogo} resizeMode="contain" />
          <Text style={styles.heroTitle}>Run a restaurant brand, not just an order queue.</Text>
          <Text style={styles.body}>Create a vendor account, recover access, or sign in to manage live BiteHub restaurants.</Text>
          <View style={styles.authCard}>
            <Text style={styles.label}>VENDOR APP</Text>
            <Text style={styles.cardTitle}>
              {authMode === "signin" ? "Sign in to manage your store." : authMode === "signup" ? "Create your vendor account." : "Reset your vendor password."}
            </Text>
            {authMode === "signup" ? (
              <>
                <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={businessName} onChangeText={setBusinessName} placeholder="Business name" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#9ca3af" style={styles.input} />
              </>
            ) : null}
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9ca3af" style={styles.input} autoCapitalize="none" />
            {authMode !== "forgot" ? <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#9ca3af" style={styles.input} secureTextEntry /> : null}
            {authMode === "forgot" ? (
              <>
                <TextInput value={resetToken} onChangeText={setResetToken} placeholder="Reset token" placeholderTextColor="#9ca3af" style={styles.input} autoCapitalize="none" />
                <TextInput value={resetPasswordValue} onChangeText={setResetPasswordValue} placeholder="New password" placeholderTextColor="#9ca3af" style={styles.input} secureTextEntry />
              </>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {authMessage ? <Text style={styles.success}>{authMessage}</Text> : null}
            {authMode === "signin" ? <Pressable style={styles.primaryButton} onPress={() => void handleSignIn()} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Sign in"}</Text></Pressable> : null}
            {authMode === "signup" ? <Pressable style={styles.primaryButton} onPress={() => void handleSignUp()} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? "Creating..." : "Create account"}</Text></Pressable> : null}
            {authMode === "forgot" ? <>
              <Pressable style={styles.primaryButton} onPress={() => void handleForgotPassword()} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? "Preparing..." : "Send reset token"}</Text></Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => void handleResetPassword()} disabled={loading}><Text style={styles.secondaryButtonText}>{loading ? "Updating..." : "Reset password"}</Text></Pressable>
            </> : null}
            <View style={styles.authLinks}>
              <Pressable onPress={() => { clearAuthFeedback(); setAuthMode("signin"); }}><Text style={[styles.authLink, authMode === "signin" && styles.authLinkActive]}>Sign in</Text></Pressable>
              <Pressable onPress={() => { clearAuthFeedback(); setAuthMode("signup"); }}><Text style={[styles.authLink, authMode === "signup" && styles.authLinkActive]}>Sign up</Text></Pressable>
              <Pressable onPress={() => { clearAuthFeedback(); setAuthMode("forgot"); }}><Text style={[styles.authLink, authMode === "forgot" && styles.authLinkActive]}>Forgot password</Text></Pressable>
            </View>
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={vendorLogo} style={styles.logoBadge} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>{vendorDisplayName}</Text>
            <Text style={styles.subtle}>{vendorName} · {liveRestaurants.length ? `${liveRestaurants.length} live restaurant${liveRestaurants.length > 1 ? "s" : ""}` : "No restaurant connected yet"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={18} color="#6b7280" />
            {unreadNotifications.length ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{unreadNotifications.length}</Text></View> : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {activeTab === "dashboard" ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Estimated payout</Text>
              <Text style={styles.heroValue}>{formatMoney(payoutDue)}</Text>
              <Text style={styles.heroSub}>Net vendor earnings after BiteHub commission across {orders.length} orders</Text>
            </View>

            <View style={styles.statGrid}>
              {[
                { label: "Orders Today", value: String(orders.length), sub: `${pendingOrders.length} pending`, icon: "receipt-outline", color: "#3b82f6" },
                { label: "Avg. Rating", value: averageRating ? averageRating.toFixed(1) : "--", sub: `${restaurants.length} restaurants`, icon: "star-outline", color: "#f59e0b" },
                { label: "Menu Items", value: String(menuItems.length), sub: `${topItems.length} active leaders`, icon: "restaurant-outline", color: "#f97316" },
                { label: "Delivered", value: String(deliveredOrders.length), sub: "Completed fulfillment", icon: "checkmark-circle-outline", color: "#22c55e" }
              ].map((card) => (
                <View key={card.label} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: card.color }]}>
                    <Ionicons name={card.icon as any} size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                  <Text style={styles.statSub}>{card.sub}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>New Orders</Text>
                <Pressable onPress={() => setActiveTab("orders")}><Text style={styles.inlineAction}>View all</Text></Pressable>
              </View>
              {pendingOrders.length ? pendingOrders.slice(0, 4).map((order) => (
                <View key={order.id} style={styles.orderCardCompact}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{order.id}</Text>
                    <Text style={styles.cardMeta}>{order.customer?.firstName ?? "Customer"} {order.customer?.lastName ?? ""}</Text>
                    <Text style={styles.cardMeta}>{(order.items ?? []).map((item: any) => `${item.menuItem?.name ?? "Item"} x${item.quantity}`).join(", ") || "No order items"}</Text>
                    <Text style={styles.metric}>{formatMoney(Number(order.totalAmount ?? 0))}</Text>
                  </View>
                  <Pressable style={styles.primaryMiniButton} onPress={() => void updateOrderStatus(order.id, "ACCEPTED")}>
                    <Text style={styles.primaryMiniButtonText}>{busyOrderId === order.id ? "..." : "Accept"}</Text>
                  </Pressable>
                </View>
              )) : <Text style={styles.emptyText}>No new orders right now.</Text>}
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Alerts</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={styles.inlineAction}>{unreadNotifications.length} unread</Text>
                  <Pressable onPress={() => void markAllNotificationsRead()}>
                    <Text style={styles.inlineAction}>Mark all read</Text>
                  </Pressable>
                  <Pressable onPress={() => void clearReadNotifications()}>
                    <Text style={styles.inlineAction}>Clear read</Text>
                  </Pressable>
                </View>
              </View>
              {notifications.length ? notifications.slice(0, 4).map((notification) => (
                <Pressable key={notification.id} style={styles.listRow} onPress={() => void markNotificationRead(notification.id)}>
                  <View style={styles.settingIcon}><Ionicons name="notifications-outline" size={16} color="#f97316" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{notification.title}</Text>
                    <Text style={styles.cardMeta}>{notification.body}</Text>
                  </View>
                </Pressable>
              )) : <Text style={styles.emptyText}>Order alerts will appear here as customers place new orders.</Text>}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Top Selling Items</Text>
              {topItems.length ? topItems.map((item, index) => (
                <View key={item.id} style={styles.listRow}>
                  <Text style={styles.rankChip}>#{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.cardMeta}>{item.restaurant?.name ?? "Restaurant"} | {item._count?.orderItems ?? 0} orders</Text>
                  </View>
                  <Text style={styles.metric}>{formatMoney(Number(item.price ?? 0))}</Text>
                </View>
              )) : <Text style={styles.emptyText}>No menu sales yet. Add your first item to start tracking demand.</Text>}
            </View>

            {restaurantCreator}
          </>
        ) : null}

        {activeTab === "orders" ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {orderFilters.map((filter) => (
                <Pressable key={filter.id} style={[styles.filterChip, orderFilter === filter.id && styles.filterChipActive]} onPress={() => setOrderFilter(filter.id)}>
                  <Text style={[styles.filterChipText, orderFilter === filter.id && styles.filterChipTextActive]}>{filter.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {filteredOrders.length ? filteredOrders.map((order) => {
              const accent = statusAccent[order.status] ?? statusAccent.PENDING;
              return (
                <View key={order.id} style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <View>
                      <Text style={styles.rowTitle}>{order.id}</Text>
                      <Text style={styles.cardMeta}>{order.customer?.firstName ?? "Customer"} {order.customer?.lastName ?? ""} | {order.restaurant?.name ?? "Restaurant"}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: accent.bg }]}>
                      <Text style={[styles.statusPillText, { color: accent.text }]}>{accent.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>{(order.items ?? []).map((item: any) => `${item.menuItem?.name ?? "Item"} x${item.quantity}`).join(", ") || "No order items"}</Text>
                  <Text style={styles.cardMeta}>{order.deliveryAddress?.fullAddress ?? "No delivery address available"}</Text>
                  <Text style={styles.metric}>{formatMoney(Number(order.totalAmount ?? 0))}</Text>
                  <View style={styles.actionRow}>
                    {order.status === "PENDING" ? <Pressable style={styles.chipButton} onPress={() => void updateOrderStatus(order.id, "ACCEPTED")}><Text style={styles.chipText}>{busyOrderId === order.id ? "..." : "Accept"}</Text></Pressable> : null}
                    {order.status === "PENDING" ? <Pressable style={styles.outlineButton} onPress={() => void updateOrderStatus(order.id, "REJECTED")}><Text style={styles.outlineButtonText}>Reject</Text></Pressable> : null}
                    {order.status === "ACCEPTED" ? <Pressable style={styles.chipButton} onPress={() => void updateOrderStatus(order.id, "PREPARING")}><Text style={styles.chipText}>{busyOrderId === order.id ? "..." : "Start Prep"}</Text></Pressable> : null}
                    {order.status === "PREPARING" ? <Pressable style={styles.chipButton} onPress={() => void updateOrderStatus(order.id, "READY_FOR_PICKUP")}><Text style={styles.chipText}>{busyOrderId === order.id ? "..." : "Mark Ready"}</Text></Pressable> : null}
                  </View>
                </View>
              );
            }) : <Text style={styles.emptyText}>No orders match this filter yet.</Text>}
          </>
        ) : null}

        {activeTab === "menu" ? (
          <>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Menu Items</Text>
              <Pressable style={styles.primarySmallButton} onPress={startCreateItem}>
                <Ionicons name="add" size={14} color="#ffffff" />
                <Text style={styles.primarySmallButtonText}>Add Item</Text>
              </Pressable>
            </View>

            {!restaurants.length ? restaurantCreator : null}

            {menuFormOpen ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>{editingItemId ? "Edit Item" : "Add New Item"}</Text>
                <Text style={styles.cardMeta}>Everything saved here goes straight to your real vendor menu.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantChoiceRow}>
                  {restaurants.map((restaurant) => (
                    <Pressable key={restaurant.id} style={[styles.restaurantChoice, selectedRestaurantId === restaurant.id && styles.restaurantChoiceActive]} onPress={() => setSelectedRestaurantId(restaurant.id)}>
                      <Text style={[styles.restaurantChoiceText, selectedRestaurantId === restaurant.id && styles.restaurantChoiceTextActive]}>{restaurant.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <TextInput value={menuDraft.name} onChangeText={(value) => setMenuDraft((current) => ({ ...current, name: value }))} placeholder="Item name" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={menuDraft.description} onChangeText={(value) => setMenuDraft((current) => ({ ...current, description: value }))} placeholder="Description" placeholderTextColor="#9ca3af" style={styles.input} multiline />
                <View style={styles.imagePickerRow}>
                  {menuDraft.imageUrl ? <Image source={{ uri: menuDraft.imageUrl }} style={styles.menuPreviewImage} resizeMode="cover" /> : <View style={styles.menuPreviewPlaceholder}><Ionicons name="image-outline" size={20} color="#9ca3af" /></View>}
                  <View style={{ flex: 1 }}>
                    <Pressable style={styles.primaryMiniButton} onPress={() => void pickMenuImage()}>
                      <Text style={styles.primaryMiniButtonText}>{menuDraft.imageUrl ? "Change image" : "Pick image"}</Text>
                    </Pressable>
                    <Text style={styles.cardMeta}>Image is stored with the menu item and can be reused across BiteHub surfaces.</Text>
                  </View>
                </View>
                <TextInput value={menuDraft.imageUrl} onChangeText={(value) => setMenuDraft((current) => ({ ...current, imageUrl: value }))} placeholder="Image URL (optional)" placeholderTextColor="#9ca3af" style={styles.input} autoCapitalize="none" />
                <TextInput value={menuDraft.price} onChangeText={(value) => setMenuDraft((current) => ({ ...current, price: value }))} placeholder="Price (GHS)" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="numeric" />
                <TextInput value={menuDraft.preparationMins} onChangeText={(value) => setMenuDraft((current) => ({ ...current, preparationMins: value }))} placeholder="Preparation minutes" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="numeric" />
                <TextInput value={menuDraft.badgeText} onChangeText={(value) => setMenuDraft((current) => ({ ...current, badgeText: value }))} placeholder="Badge text (optional)" placeholderTextColor="#9ca3af" style={styles.input} />
                <View style={styles.inlineInputs}>
                  <TextInput value={menuDraft.spiceLevel} onChangeText={(value) => setMenuDraft((current) => ({ ...current, spiceLevel: value }))} placeholder="Spice" placeholderTextColor="#9ca3af" style={[styles.input, styles.halfInput]} keyboardType="numeric" />
                  <TextInput value={menuDraft.calories} onChangeText={(value) => setMenuDraft((current) => ({ ...current, calories: value }))} placeholder="Calories" placeholderTextColor="#9ca3af" style={[styles.input, styles.halfInput]} keyboardType="numeric" />
                </View>
                <View style={styles.actionRow}>
                  <Pressable style={[styles.toggleChip, menuDraft.isSignature && styles.toggleChipActive]} onPress={() => setMenuDraft((current) => ({ ...current, isSignature: !current.isSignature }))}>
                    <Text style={[styles.toggleChipText, menuDraft.isSignature && styles.toggleChipTextActive]}>Signature</Text>
                  </Pressable>
                  <Pressable style={[styles.toggleChip, menuDraft.isFeatured && styles.toggleChipActive]} onPress={() => setMenuDraft((current) => ({ ...current, isFeatured: !current.isFeatured }))}>
                    <Text style={[styles.toggleChipText, menuDraft.isFeatured && styles.toggleChipTextActive]}>Featured</Text>
                  </Pressable>
                </View>
                <View style={styles.actionRow}>
                  <Pressable style={styles.primaryMiniButton} onPress={() => void submitMenuItem()}>
                    <Text style={styles.primaryMiniButtonText}>{busyItemId === (editingItemId ?? "new") ? "Saving..." : editingItemId ? "Save changes" : "Create item"}</Text>
                  </Pressable>
                  <Pressable style={styles.outlineButton} onPress={resetMenuDraft}>
                    <Text style={styles.outlineButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {Object.entries(groupedMenuItems).length ? Object.entries(groupedMenuItems).map(([group, items]) => (
              <View key={group} style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>{group}</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.menuItemCard}>
                    <View style={styles.menuThumb}><Ionicons name="restaurant-outline" size={20} color="#f97316" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      <Text style={styles.metric}>{formatMoney(Number(item.price ?? 0))}</Text>
                      <Text style={styles.cardMeta}>{item._count?.orderItems ?? 0} orders total</Text>
                      <Text style={styles.cardMeta}>{item.description ?? "No description yet."}</Text>
                    </View>
                    <View style={styles.iconActionColumn}>
                      <Pressable onPress={() => void toggleItemAvailability(item)}>
                        <Ionicons name={item.status === "AVAILABLE" ? "eye-outline" : "eye-off-outline"} size={20} color={item.status === "AVAILABLE" ? "#16a34a" : "#9ca3af"} />
                      </Pressable>
                      <Pressable onPress={() => startEditItem(item)}>
                        <Ionicons name="create-outline" size={18} color="#6b7280" />
                      </Pressable>
                      <Pressable onPress={() => void deleteItem(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#f87171" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )) : <Text style={styles.emptyText}>No menu items yet. Add your first item to start taking orders.</Text>}
          </>
        ) : null}

        {activeTab === "analytics" ? (
          <>
            <View style={styles.analyticsGrid}>
              {[
                { label: "Vendor Payout", value: formatMoney(payoutDue), sub: "Net amount due after BiteHub commission" },
                { label: "Total Orders", value: String(orders.length), sub: `${deliveredOrders.length} delivered` },
                { label: "Gross Sales", value: formatMoney(grossSales), sub: "Customer food spend before platform deductions" },
                { label: "Avg. Order Value", value: orders.length ? formatMoney(Math.round(grossSales / orders.length)) : formatMoney(0), sub: "Average gross food value per order" },
                { label: "Menu Reach", value: String(menuItems.length), sub: "Active menu items tracked" }
              ].map((item) => (
                <View key={item.label} style={styles.panel}>
                  <Text style={styles.cardMeta}>{item.label}</Text>
                  <Text style={styles.analyticsValue}>{item.value}</Text>
                  <Text style={styles.cardMeta}>{item.sub}</Text>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Revenue by Day</Text>
              <View style={styles.barRow}>
                {weeklyRevenue.map((day, index) => (
                  <View key={`${day.label}-${index}`} style={styles.barItem}>
                    <View style={[styles.barFill, index === weeklyRevenue.length - 2 ? styles.barFillActive : null, { height: `${day.height}%` }]} />
                    <Text style={styles.barLabel}>{day.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Forecasts</Text>
              {(forecasts?.forecasts ?? []).length ? (forecasts?.forecasts ?? []).map((forecast: any) => (
                <View key={forecast.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{forecast.restaurant?.name ?? "Restaurant"}</Text>
                    <Text style={styles.cardMeta}>{forecast.windowLabel ?? String(forecast.forecastDate).slice(0, 10)}</Text>
                  </View>
                  <Text style={styles.metric}>{forecast.expectedOrders ?? 0} orders</Text>
                </View>
              )) : <Text style={styles.emptyText}>No forecast snapshots yet.</Text>}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Quality Signals</Text>
              {(forecasts?.qualityScores ?? []).length ? (forecasts?.qualityScores ?? []).map((score: any) => (
                <View key={score.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{score.scoreType}</Text>
                    <Text style={styles.cardMeta}>{score.notes ?? "Latest vendor quality snapshot"}</Text>
                  </View>
                  <Text style={styles.metric}>{Number(score.scoreValue ?? 0).toFixed(1)}</Text>
                </View>
              )) : <Text style={styles.emptyText}>No quality scores yet.</Text>}
            </View>
          </>
        ) : null}

        {activeTab === "settings" ? (
          <>
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Restaurant Profile</Text>
                  <Pressable onPress={() => setRestaurantFormOpen((current) => !current)}>
                    <Text style={styles.inlineAction}>{restaurantFormOpen ? "Hide form" : "Add restaurant"}</Text>
                </Pressable>
              </View>
              {restaurants.length ? restaurants.map((restaurant) => (
                <View key={restaurant.id} style={styles.restaurantProfileCard}>
                  <View style={styles.restaurantAvatar}><Ionicons name="restaurant" size={22} color="#ffffff" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{restaurant.name}</Text>
                    <Text style={styles.cardMeta}>{restaurant.category?.name ?? "Restaurant"}</Text>
                    <Text style={styles.cardMeta}>{restaurant.address}</Text>
                    <Text style={styles.cardMeta}>Delivery fee {formatMoney(Number(restaurant.deliveryFee ?? 0))} | Min. order {formatMoney(Number(restaurant.minimumOrderAmount ?? 0))}</Text>
                  </View>
                  <Pressable style={styles.inlineIconButton} onPress={() => startEditRestaurant(restaurant)}>
                    <Ionicons name="create-outline" size={18} color="#f97316" />
                  </Pressable>
                </View>
              )) : <Text style={styles.emptyText}>No restaurant profile is connected to this vendor yet.</Text>}
            </View>

            {restaurantFormOpen ? restaurantCreator : null}

            {restaurants.length ? (
              <>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Settings Scope</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantChoiceRow}>
                    {restaurants.map((restaurant) => (
                      <Pressable
                        key={restaurant.id}
                        style={[styles.restaurantChoice, selectedSettingsRestaurant?.id === restaurant.id && styles.restaurantChoiceActive]}
                        onPress={() => setSelectedRestaurantId(restaurant.id)}
                      >
                        <Text style={[styles.restaurantChoiceText, selectedSettingsRestaurant?.id === restaurant.id && styles.restaurantChoiceTextActive]}>
                          {restaurant.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Operations</Text>
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>Restaurant Status</Text>
                      <Text style={styles.cardMeta}>Toggle open/closed</Text>
                    </View>
                    <Pressable
                      style={[styles.switchTrack, settingsDraft.isOpen && styles.switchTrackActive]}
                      onPress={() => {
                        const nextDraft = { ...settingsDraft, isOpen: !settingsDraft.isOpen };
                        setSettingsDraft(nextDraft);
                        void saveVendorSettings(nextDraft);
                      }}
                    >
                      <View style={[styles.switchThumb, settingsDraft.isOpen && styles.switchThumbActive]} />
                    </Pressable>
                  </View>
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>Auto-accept Orders</Text>
                      <Text style={styles.cardMeta}>Skip manual approval</Text>
                    </View>
                    <Pressable
                      style={[styles.switchTrack, settingsDraft.autoAcceptOrders && styles.switchTrackActive]}
                      onPress={() => {
                        const nextDraft = { ...settingsDraft, autoAcceptOrders: !settingsDraft.autoAcceptOrders };
                        setSettingsDraft(nextDraft);
                        void saveVendorSettings(nextDraft);
                      }}
                    >
                      <View style={[styles.switchThumb, settingsDraft.autoAcceptOrders && styles.switchThumbActive]} />
                    </Pressable>
                  </View>
                  <View style={styles.hoursBlock}>
                    <Text style={styles.rowTitle}>Opening Hours</Text>
                    {settingsDraft.openingHours.map((entry, index) => (
                      <View key={entry.label} style={styles.hoursRow}>
                        <View style={styles.hoursRowHeader}>
                          <Text style={styles.cardMetaStrong}>{entry.label}</Text>
                          <Text style={[styles.hoursValue, entry.isClosed && styles.hoursClosed]}>
                            {entry.isClosed ? "Closed" : `${entry.open || "--"} - ${entry.close || "--"}`}
                          </Text>
                        </View>
                        <View style={styles.inlineInputs}>
                          <TextInput
                            value={entry.open}
                            onChangeText={(value) =>
                              setSettingsDraft((current) => ({
                                ...current,
                                openingHours: current.openingHours.map((hour, hourIndex) =>
                                  hourIndex === index ? { ...hour, open: value, isClosed: false } : hour
                                )
                              }))
                            }
                            placeholder="8:00 AM"
                            placeholderTextColor="#9ca3af"
                            style={[styles.input, styles.halfInput]}
                          />
                          <TextInput
                            value={entry.close}
                            onChangeText={(value) =>
                              setSettingsDraft((current) => ({
                                ...current,
                                openingHours: current.openingHours.map((hour, hourIndex) =>
                                  hourIndex === index ? { ...hour, close: value, isClosed: false } : hour
                                )
                              }))
                            }
                            placeholder="10:00 PM"
                            placeholderTextColor="#9ca3af"
                            style={[styles.input, styles.halfInput]}
                          />
                        </View>
                        <Pressable
                          style={[styles.outlineButton, styles.closedToggle]}
                          onPress={() =>
                            setSettingsDraft((current) => ({
                              ...current,
                              openingHours: current.openingHours.map((hour, hourIndex) =>
                                hourIndex === index ? { ...hour, isClosed: !hour.isClosed } : hour
                              )
                            }))
                          }
                        >
                          <Text style={styles.outlineButtonText}>{entry.isClosed ? "Re-open day" : "Mark closed"}</Text>
                        </Pressable>
                      </View>
                    ))}
                    <Pressable style={styles.primaryMiniButton} onPress={() => void saveVendorSettings()}>
                      <Text style={styles.primaryMiniButtonText}>{settingsSaving ? "Saving..." : "Save hours"}</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Notifications</Text>
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>New Orders</Text>
                      <Text style={styles.cardMeta}>Alert for every incoming order</Text>
                    </View>
                    <Pressable
                      style={[styles.switchTrack, settingsDraft.notifyOnNewOrders && styles.switchTrackActive]}
                      onPress={() => {
                        const nextDraft = { ...settingsDraft, notifyOnNewOrders: !settingsDraft.notifyOnNewOrders };
                        setSettingsDraft(nextDraft);
                        void saveVendorSettings(nextDraft);
                      }}
                    >
                      <View style={[styles.switchThumb, settingsDraft.notifyOnNewOrders && styles.switchThumbActive]} />
                    </Pressable>
                  </View>
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>Promotions</Text>
                      <Text style={styles.cardMeta}>Platform deals and campaigns</Text>
                    </View>
                    <Pressable
                      style={[styles.switchTrack, settingsDraft.notifyOnPromotions && styles.switchTrackActive]}
                      onPress={() => {
                        const nextDraft = { ...settingsDraft, notifyOnPromotions: !settingsDraft.notifyOnPromotions };
                        setSettingsDraft(nextDraft);
                        void saveVendorSettings(nextDraft);
                      }}
                    >
                      <View style={[styles.switchThumb, settingsDraft.notifyOnPromotions && styles.switchThumbActive]} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Payout Details</Text>
                    <Pressable onPress={() => {
                      if (editingPayout) {
                        void saveVendorSettings();
                      } else {
                        setEditingPayout(true);
                      }
                    }}>
                      <Text style={styles.inlineAction}>{editingPayout ? (settingsSaving ? "Saving..." : "Save") : "Edit"}</Text>
                    </Pressable>
                  </View>
                  {editingPayout ? (
                    <>
                      <TextInput value={settingsDraft.payoutBankName} onChangeText={(value) => setSettingsDraft((current) => ({ ...current, payoutBankName: value }))} placeholder="Bank name" placeholderTextColor="#9ca3af" style={styles.input} />
                      <TextInput value={settingsDraft.payoutAccountNumber} onChangeText={(value) => setSettingsDraft((current) => ({ ...current, payoutAccountNumber: value }))} placeholder="Account number" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="number-pad" />
                      <TextInput value={settingsDraft.payoutAccountName} onChangeText={(value) => setSettingsDraft((current) => ({ ...current, payoutAccountName: value }))} placeholder="Account name" placeholderTextColor="#9ca3af" style={styles.input} />
                    </>
                  ) : (
                    <View style={styles.payoutCard}>
                      <View style={styles.settingIcon}><Ionicons name="card-outline" size={18} color="#6b7280" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>
                          {settingsDraft.payoutBankName ? `${settingsDraft.payoutBankName} · ${settingsDraft.payoutAccountNumber || "No account number"}` : "No payout account set"}
                        </Text>
                        <Text style={styles.cardMeta}>{settingsDraft.payoutAccountName || vendorName}</Text>
                      </View>
                      <View style={[styles.verificationBadge, settingsDraft.payoutVerified ? styles.verificationBadgeActive : null]}>
                        <Text style={[styles.verificationBadgeText, settingsDraft.payoutVerified ? styles.verificationBadgeTextActive : null]}>
                          {settingsDraft.payoutVerified ? "Verified" : "Pending"}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>No restaurant operations to configure yet.</Text>
            )}

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Account</Text>
              <View style={styles.listRow}>
                <View style={styles.settingIcon}><Ionicons name="person-outline" size={16} color="#6b7280" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{session.user.firstName} {session.user.lastName}</Text>
                  <Text style={styles.cardMeta}>{session.user.email ?? email}</Text>
                </View>
              </View>
              <View style={styles.listRow}>
                <View style={styles.settingIcon}><Ionicons name="business-outline" size={16} color="#6b7280" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{vendorName}</Text>
                  <Text style={styles.cardMeta}>{restaurants.length} restaurants linked</Text>
                </View>
              </View>
              <Pressable style={styles.primaryButton} onPress={signOut}>
                <Text style={styles.primaryButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.nav}>
        {[
          { id: "dashboard", label: "Dashboard", icon: "grid-outline", activeIcon: "grid" },
          { id: "orders", label: "Orders", icon: "receipt-outline", activeIcon: "receipt" },
          { id: "menu", label: "Menu", icon: "restaurant-outline", activeIcon: "restaurant" },
          { id: "analytics", label: "Analytics", icon: "bar-chart-outline", activeIcon: "bar-chart" },
          { id: "settings", label: "Settings", icon: "settings-outline", activeIcon: "settings" }
        ].map((item) => (
          <Pressable key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id as Tab)}>
            <Ionicons name={(activeTab === item.id ? item.activeIcon : item.icon) as any} size={18} color={activeTab === item.id ? "#f97316" : "#9ca3af"} />
            <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  authScrollContent: { flexGrow: 1 },
  authShell: { flexGrow: 1, justifyContent: "flex-start", paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  authLogo: { width: 152, height: 152, marginBottom: 16, alignSelf: "center" },
  heroTitle: { marginTop: 8, fontSize: 34, lineHeight: 40, fontWeight: "800", color: "#111827" },
  body: { marginTop: 12, fontSize: 16, lineHeight: 24, color: "#6b7280" },
  authCard: { marginTop: 28, borderRadius: 28, backgroundColor: "#ffffff", padding: 22 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: "#f97316", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  cardMeta: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#6b7280" },
  input: { marginTop: 12, borderRadius: 18, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 12, color: "#111827" },
  error: { marginTop: 10, color: "#e11d48", fontSize: 13 },
  success: { marginTop: 10, color: "#15803d", fontSize: 13 },
  primaryButton: { marginTop: 18, borderRadius: 20, backgroundColor: "#f97316", paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  secondaryButton: { marginTop: 12, borderRadius: 20, borderWidth: 1, borderColor: "#fdba74", paddingVertical: 14, alignItems: "center" },
  secondaryButtonText: { color: "#c2410c", fontSize: 14, fontWeight: "800" },
  authLinks: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 18 },
  authLink: { color: "#9a3412", fontSize: 13, fontWeight: "700" },
  authLinkActive: { color: "#f97316" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerRight: { alignItems: "flex-end" },
  logoBadge: { width: 40, height: 40, borderRadius: 16 },
  notificationIcon: { position: "relative", width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  notificationBadge: { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  notificationBadgeText: { color: "#ffffff", fontSize: 9, fontWeight: "800" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  subtle: { marginTop: 4, fontSize: 12, color: "#6b7280" },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  heroCard: { marginBottom: 14, borderRadius: 28, backgroundColor: "#111827", padding: 22 },
  heroLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: "#fdba74" },
  heroValue: { marginTop: 8, fontSize: 34, fontWeight: "800", color: "#fff" },
  heroSub: { marginTop: 8, fontSize: 13, color: "#d1d5db" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  statCard: { width: "47%", borderRadius: 22, backgroundColor: "#fff", padding: 16 },
  statIcon: { width: 36, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { marginTop: 4, fontSize: 12, color: "#9ca3af" },
  statSub: { marginTop: 4, fontSize: 11, color: "#16a34a" },
  panel: { marginBottom: 14, borderRadius: 26, backgroundColor: "#fff", padding: 16 },
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  panelTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  inlineAction: { color: "#f97316", fontSize: 12, fontWeight: "700" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  switchTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: "#e5e7eb", padding: 3, justifyContent: "center" },
  switchTrackActive: { backgroundColor: "#ffedd5" },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff" },
  switchThumbActive: { alignSelf: "flex-end", backgroundColor: "#f97316" },
  orderCardCompact: { borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 18, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  primaryMiniButton: { borderRadius: 16, backgroundColor: "#f97316", paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  primaryMiniButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  rowTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  cardMetaStrong: { fontSize: 12, lineHeight: 18, color: "#111827", fontWeight: "700" },
  metric: { marginTop: 6, fontSize: 14, fontWeight: "800", color: "#f97316" },
  rankChip: { width: 28, textAlign: "center", color: "#9ca3af", fontSize: 11, fontWeight: "800" },
  filterRow: { gap: 8, paddingBottom: 10 },
  filterChip: { borderRadius: 16, backgroundColor: "#ffffff", paddingHorizontal: 14, paddingVertical: 9 },
  filterChipActive: { backgroundColor: "#f97316" },
  filterChipText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#ffffff" },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: "800" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  chipButton: { borderRadius: 16, backgroundColor: "#fff7ed", paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { color: "#c2410c", fontSize: 12, fontWeight: "800" },
  outlineButton: { borderRadius: 16, borderWidth: 1, borderColor: "#fed7aa", paddingHorizontal: 14, paddingVertical: 10 },
  outlineButtonText: { color: "#c2410c", fontSize: 12, fontWeight: "700" },
  primarySmallButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 16, backgroundColor: "#f97316", paddingHorizontal: 12, paddingVertical: 10 },
  primarySmallButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  restaurantChoiceRow: { gap: 8, paddingBottom: 8, marginTop: 12 },
  restaurantChoice: { borderRadius: 16, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 9 },
  restaurantChoiceActive: { backgroundColor: "#fff7ed" },
  restaurantChoiceText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  restaurantChoiceTextActive: { color: "#c2410c" },
  imagePickerRow: { marginTop: 12, flexDirection: "row", gap: 12, alignItems: "center" },
  menuPreviewImage: { width: 72, height: 72, borderRadius: 18, backgroundColor: "#f3f4f6" },
  menuPreviewPlaceholder: { width: 72, height: 72, borderRadius: 18, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  inlineInputs: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  toggleChip: { borderRadius: 16, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 10 },
  toggleChipActive: { backgroundColor: "#fff7ed" },
  toggleChipText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  toggleChipTextActive: { color: "#c2410c" },
  menuSection: { marginBottom: 16 },
  menuSectionTitle: { marginBottom: 10, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: "#9ca3af" },
  menuItemCard: { borderRadius: 22, backgroundColor: "#fff", padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  menuThumb: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
  iconActionColumn: { gap: 12, alignItems: "center", justifyContent: "center" },
  analyticsGrid: { gap: 12 },
  analyticsValue: { marginTop: 6, fontSize: 24, fontWeight: "800", color: "#111827" },
  barRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 110, marginTop: 14 },
  barItem: { flex: 1, alignItems: "center", gap: 6, height: 100 },
  barFill: { width: "100%", borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#fdba74", minHeight: 12 },
  barFillActive: { backgroundColor: "#f97316" },
  barLabel: { fontSize: 10, color: "#9ca3af" },
  restaurantProfileCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  restaurantAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  inlineIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
  operationCard: { paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  hoursBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 14 },
  hoursRow: { paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  hoursRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  hoursValue: { fontSize: 12, fontWeight: "700", color: "#111827" },
  hoursClosed: { color: "#ef4444" },
  closedToggle: { alignSelf: "flex-start", marginTop: 10 },
  payoutCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 20, backgroundColor: "#f9fafb", padding: 14 },
  verificationBadge: { borderRadius: 999, backgroundColor: "#e5e7eb", paddingHorizontal: 10, paddingVertical: 5 },
  verificationBadgeActive: { backgroundColor: "#dcfce7" },
  verificationBadgeText: { color: "#6b7280", fontSize: 11, fontWeight: "800" },
  verificationBadgeTextActive: { color: "#15803d" },
  settingIcon: { width: 36, height: 36, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9ca3af", fontSize: 13, lineHeight: 20, paddingVertical: 18, textAlign: "center" },
  nav: { borderTopWidth: 1, borderTopColor: "#f3f4f6", backgroundColor: "#fff", paddingVertical: 10, flexDirection: "row", justifyContent: "space-around" },
  navItem: { alignItems: "center", gap: 4, flex: 1 },
  navLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af" },
  navLabelActive: { color: "#f97316" }
});
