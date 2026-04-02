import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiteHubSplash } from "./components/BiteHubSplash";

type Tab = "home" | "orders" | "saved" | "profile";
type Screen = "browse" | "menu" | "cart" | "tracking" | "confirmation";
type AuthMode = "signin" | "signup" | "forgot";
type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY";
type Session = { accessToken: string; refreshToken: string; user: { role: string; firstName: string; lastName: string; email: string } };
type PublicDataBundle = { restaurantData: any[]; collectionData: any[] };
type CartLine = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note: string;
  selectedOptions: Array<{
    id: string;
    name: string;
    priceDelta: number;
    groupId: string;
    groupName: string;
  }>;
};
type PrivateDataBundle = {
  orderData: any[];
  favoriteData: any[];
  profileData: any;
  retentionData: any;
  addressData: any[];
  notificationData: any[];
};
const sessionStorageKey = "bitehub_customer_session";
const productionApiBaseUrl = "https://bitehub-backend.up.railway.app/api/v1";
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

  if (!__DEV__) {
    return productionApiBaseUrl;
  }

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
const customerLogo = require("./assets/bitehub-icon.png");
const currencyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 2
});

function formatMoney(value: number) {
  return currencyFormatter.format(Number(value ?? 0));
}

function buildLocationLabel(places: Location.LocationGeocodedAddress[]) {
  const place = places[0];
  if (!place) return null;
  return [place.district, place.city, place.region, place.country].filter(Boolean).slice(0, 3).join(", ");
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
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [activeScreen, setActiveScreen] = useState<Screen>("browse");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [selectedHighlights, setSelectedHighlights] = useState<any | null>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [retentionOverview, setRetentionOverview] = useState<any>(null);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [trackingDelivery, setTrackingDelivery] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [eta, setEta] = useState<any | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [customizingItem, setCustomizingItem] = useState<any | null>(null);
  const [customizationSelections, setCustomizationSelections] = useState<Record<string, string[]>>({});
  const [customizationNote, setCustomizationNote] = useState("");
  const [customizationQuantity, setCustomizationQuantity] = useState(1);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [addressLabelInput, setAddressLabelInput] = useState("Home");
  const [addressInput, setAddressInput] = useState("");
  const [addressInstructions, setAddressInstructions] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentAuthorizationUrl, setPaymentAuthorizationUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

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

  function resetAuthFeedback() {
    setError(null);
    setAuthMessage(null);
  }

  async function fetchPublicDataBundle(): Promise<PublicDataBundle> {
    const [restaurantData, collectionData] = await Promise.all([request<any[]>("/restaurants"), request<any[]>("/collections")]);
    return { restaurantData, collectionData };
  }

  async function applyPublicBundle(bundle: PublicDataBundle) {
    setRestaurants(bundle.restaurantData);
    setCollections(bundle.collectionData);
    if (!selectedRestaurant && bundle.restaurantData[0]) {
      await openRestaurant(bundle.restaurantData[0], false);
    }
  }

  async function fetchPrivateDataBundle(activeSession: Session): Promise<PrivateDataBundle> {
    const [orderData, favoriteData, profileData, retentionData, addressData, notificationData] = await Promise.all([
      request<any[]>("/customers/orders", {}, activeSession),
      request<any[]>("/customers/favorites", {}, activeSession),
      request<any>("/customers/profile", {}, activeSession),
      request<any>("/customers/retention-overview", {}, activeSession),
      request<any[]>("/customers/addresses", {}, activeSession),
      request<any[]>("/notifications", {}, activeSession)
    ]);

    return { orderData, favoriteData, profileData, retentionData, addressData, notificationData };
  }

  function applyPrivateBundle(bundle: PrivateDataBundle) {
    setOrders(bundle.orderData);
    setFavorites(bundle.favoriteData);
    setProfile(bundle.profileData);
    setRetentionOverview(bundle.retentionData);
    setAddresses(bundle.addressData);
    setNotifications(bundle.notificationData);
    setSelectedAddressId((current) => current || bundle.addressData[0]?.id || "");
    setAddressInput(
      (current) => current || bundle.addressData[0]?.fullAddress || bundle.profileData?.customerProfile?.defaultAddress || ""
    );
  }

  const publicDataQuery = useQuery({
    queryKey: ["customer-public-data"],
    queryFn: fetchPublicDataBundle
  });

  const privateDataQuery = useQuery({
    queryKey: ["customer-private-data", session?.user?.email ?? "guest"],
    queryFn: () => fetchPrivateDataBundle(session!),
    enabled: Boolean(session)
  });

  async function loadPublicData() {
    const bundle = await tanstackQueryClient.fetchQuery({
      queryKey: ["customer-public-data"],
      queryFn: fetchPublicDataBundle
    });
    await applyPublicBundle(bundle);
  }

  async function loadPrivateData(activeSession: Session) {
    const bundle = await tanstackQueryClient.fetchQuery({
      queryKey: ["customer-private-data", activeSession.user.email],
      queryFn: () => fetchPrivateDataBundle(activeSession)
    });
    applyPrivateBundle(bundle);
  }

  async function loadTracking(orderId: string) {
    if (!session) return;
    const [etaData, timelineData, trackData] = await Promise.all([
      request<any>(`/orders/${orderId}/eta`, {}, session),
      request<any[]>(`/orders/${orderId}/timeline`, {}, session),
      request<any>(`/orders/${orderId}/track`, {}, session)
    ]);
    setEta(etaData);
    setTimeline(timelineData);
    setTrackingDelivery(trackData);
  }

  async function refreshTrackedOrderStatus(orderId: string) {
    if (!session) return;
    const providerRef = paymentReference ?? trackedOrder?.payment?.providerRef;

    if (paymentMethod !== "CASH" && providerRef) {
      const verification = await request<any>(
        "/payments/verify",
        {
          method: "POST",
          body: JSON.stringify({ reference: providerRef })
        },
        session
      );

      if (verification?.payment?.providerRef) {
        setPaymentReference(verification.payment.providerRef);
      }
    }

    const order = await request<any>(`/orders/${orderId}`, {}, session);
    setTrackedOrder(order);
    setPaymentReference(order?.payment?.providerRef ?? providerRef ?? null);

    const paymentStatus = order?.payment?.status;
    if (paymentStatus === "PAID") {
      setCheckoutStatus("Payment confirmed. Your order is fully locked in.");
    } else if (paymentStatus === "FAILED") {
      setCheckoutStatus("Payment failed. Reopen the payment page and try again.");
    } else if (paymentMethod !== "CASH") {
      setCheckoutStatus("Order created. Payment is still pending confirmation.");
    }
  }

  async function callRider() {
    const riderPhone = trackingDelivery?.riderProfile?.user?.phone;
    if (!riderPhone) {
      setSupportStatus("Rider phone number is not available yet.");
      return;
    }

    const url = `tel:${riderPhone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setSupportStatus("Phone calling is not available on this device.");
      return;
    }

    await Linking.openURL(url);
  }

  async function openRiderLocation() {
    const latitude = trackingDelivery?.riderProfile?.currentLatitude;
    const longitude = trackingDelivery?.riderProfile?.currentLongitude;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      setSupportStatus("Rider location is not available yet.");
      return;
    }

    const label = encodeURIComponent(
      `${trackingDelivery?.riderProfile?.user?.firstName ?? "Rider"} ${trackingDelivery?.riderProfile?.user?.lastName ?? ""}`.trim()
    );
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setSupportStatus("Unable to open maps on this device.");
      return;
    }

    await Linking.openURL(url);
  }

  useEffect(() => {
    if (publicDataQuery.data) {
      void applyPublicBundle(publicDataQuery.data);
    }
  }, [publicDataQuery.data]);

  useEffect(() => {
    if (privateDataQuery.data) {
      applyPrivateBundle(privateDataQuery.data);
    }
  }, [privateDataQuery.data]);

  async function createSupportTicket() {
    if (!session || !trackedOrder || !supportMessage.trim()) return;
    setSupportStatus(null);
    try {
      await request(
        `/orders/${trackedOrder.id}/support`,
        {
          method: "POST",
          body: JSON.stringify({ severity: "MEDIUM", subject: "Need help with my order", message: supportMessage, source: "CUSTOMER" })
        },
        session
      );
      setSupportStatus("Support request sent.");
      setSupportMessage("");
      await loadTracking(trackedOrder.id);
    } catch (err) {
      setSupportStatus(err instanceof Error ? err.message : "Unable to send support request.");
    }
  }

  async function refreshLocation() {
    setLocating(true);
    setLocationStatus(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationStatus("Enable location access to personalize nearby delivery.");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const nextCoords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude
      };
      setLocationCoords(nextCoords);

      const places = await Location.reverseGeocodeAsync(nextCoords);
      setLocationLabel(buildLocationLabel(places) ?? "Live location ready");
      setLocationStatus("Live location is active.");
    } catch (err) {
      setLocationStatus(err instanceof Error ? err.message : "Unable to load live location.");
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    void loadPublicData().catch((err) => setError(err instanceof Error ? err.message : "Unable to load restaurants."));
    void refreshLocation();
  }, []);

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
        await loadPrivateData(restored);
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

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!session || !trackedOrder || activeScreen !== "tracking") return;

    const timer = setInterval(() => {
      void loadTracking(trackedOrder.id).catch((err) =>
        setSupportStatus(err instanceof Error ? err.message : "Unable to refresh rider tracking.")
      );
    }, 15000);

    return () => clearInterval(timer);
  }, [activeScreen, session, trackedOrder]);

  useEffect(() => {
    if (!session || !trackedOrder || activeScreen !== "confirmation" || paymentMethod === "CASH") return;

    const timer = setInterval(() => {
      void refreshTrackedOrderStatus(trackedOrder.id).catch((err) =>
        setCheckoutStatus(err instanceof Error ? err.message : "Unable to refresh payment status.")
      );
    }, 12000);

    return () => clearInterval(timer);
  }, [activeScreen, paymentMethod, paymentReference, session, trackedOrder]);

  async function openRestaurant(restaurant: any, switchScreen = true) {
    setSelectedRestaurant(restaurant);
    if (switchScreen) setActiveScreen("menu");
    try {
      const [menuData, highlightData] = await Promise.all([
        request<any[]>(`/restaurants/${restaurant.id}/menu`),
        request<any>(`/restaurants/${restaurant.id}/highlights`)
      ]);
      setMenu(menuData);
      setSelectedHighlights(highlightData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load menu.");
    }
  }

  function getItemBasePrice(item: any) {
    return Number(item?.effectivePrice ?? item?.price ?? 0);
  }

  function getSelectedOptionsForItem(item: any) {
    if (!item) return [];

    return (item.modifierGroups ?? []).flatMap((group: any) =>
      (customizationSelections[group.id] ?? []).map((optionId) => {
        const option = (group.options ?? []).find((entry: any) => entry.id === optionId);
        if (!option) return null;
        return {
          id: option.id,
          name: option.name,
          priceDelta: Number(option.priceDelta ?? 0),
          groupId: group.id,
          groupName: group.name
        };
      }).filter(Boolean)
    );
  }

  function getCustomizationPrice(item: any) {
    return getSelectedOptionsForItem(item).reduce((sum: number, option: any) => sum + Number(option.priceDelta ?? 0), 0);
  }

  function openCustomization(item: any) {
    const defaults = Object.fromEntries(
      (item.modifierGroups ?? []).map((group: any) => [
        group.id,
        (group.options ?? []).filter((option: any) => option.isDefault).map((option: any) => option.id)
      ])
    );
    setCustomizingItem(item);
    setCustomizationSelections(defaults);
    setCustomizationNote("");
    setCustomizationQuantity(1);
  }

  function closeCustomization() {
    setCustomizingItem(null);
    setCustomizationSelections({});
    setCustomizationNote("");
    setCustomizationQuantity(1);
  }

  function toggleCustomizationOption(group: any, optionId: string) {
    setCustomizationSelections((current) => {
      const existing = current[group.id] ?? [];
      const hasOption = existing.includes(optionId);

      if (group.selectionType === "SINGLE") {
        return {
          ...current,
          [group.id]: hasOption ? [] : [optionId]
        };
      }

      const next = hasOption ? existing.filter((id) => id !== optionId) : [...existing, optionId];
      const maxSelect = typeof group.maxSelect === "number" ? group.maxSelect : null;
      return {
        ...current,
        [group.id]: maxSelect && next.length > maxSelect ? next.slice(next.length - maxSelect) : next
      };
    });
  }

  function validateCustomization(item: any) {
    for (const group of item?.modifierGroups ?? []) {
      const selected = customizationSelections[group.id] ?? [];
      const minRequired = group.isRequired ? Math.max(group.minSelect ?? 1, 1) : group.minSelect ?? 0;
      const maxAllowed = group.selectionType === "SINGLE" ? 1 : group.maxSelect ?? Number.POSITIVE_INFINITY;

      if (selected.length < minRequired) {
        return `Select ${group.name} before adding this item.`;
      }

      if (selected.length > maxAllowed) {
        return `You selected too many options for ${group.name}.`;
      }
    }

    return null;
  }

  function addCustomizedItemToCart() {
    if (!customizingItem) return;
    const validationError = validateCustomization(customizingItem);

    if (validationError) {
      setCheckoutStatus(validationError);
      return;
    }

    const selectedOptions = getSelectedOptionsForItem(customizingItem);
    const unitPrice = getItemBasePrice(customizingItem) + getCustomizationPrice(customizingItem);

    setCartLines((current) => [
      ...current,
      {
        id: `${customizingItem.id}-${Date.now()}`,
        menuItemId: customizingItem.id,
        menuItemName: customizingItem.name,
        quantity: customizationQuantity,
        unitPrice,
        note: customizationNote.trim(),
        selectedOptions
      }
    ]);
    closeCustomization();
    setCheckoutStatus(null);
  }

  function updateCartLineQuantity(lineId: string, nextQuantity: number) {
    if (nextQuantity <= 0) {
      setCartLines((current) => current.filter((line) => line.id !== lineId));
      return;
    }

    setCartLines((current) =>
      current.map((line) => (line.id === lineId ? { ...line, quantity: nextQuantity } : line))
    );
  }

  async function handleSignIn() {
    resetAuthFeedback();
    setLoadingAuth(true);
    try {
      const payload = await request<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (payload.user?.role !== "CUSTOMER") throw new Error("This account does not have customer access.");
      const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
      setSession(nextSession);
      await loadPrivateData(nextSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleSignUp() {
    resetAuthFeedback();
    setLoadingAuth(true);
    try {
      const payload = await request<any>("/auth/register/customer", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, phone: phone.trim() || undefined, password, role: "CUSTOMER" })
      });
      const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
      setSession(nextSession);
      setAuthMode("signin");
      await loadPrivateData(nextSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleForgotPassword() {
    resetAuthFeedback();
    setLoadingAuth(true);
    try {
      const payload = await request<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setAuthMessage(payload.resetToken ? `Reset token: ${payload.resetToken}` : payload.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare password reset.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleResetPassword() {
    resetAuthFeedback();
    setLoadingAuth(true);
    try {
      const payload = await request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password: resetPasswordValue })
      });
      setAuthMessage(payload.message);
      setPassword("");
      setResetPasswordValue("");
      setResetToken("");
      setAuthMode("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function createGroupOrder() {
    if (!session || !selectedRestaurant) return;
    try {
      await request(
        "/customers/group-orders",
        {
          method: "POST",
          body: JSON.stringify({
            restaurantId: selectedRestaurant.id,
            title: `${selectedRestaurant.name} squad order`,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          })
        },
        session
      );
      await loadPrivateData(session);
      setSupportStatus("Group order created.");
    } catch (err) {
      setSupportStatus(err instanceof Error ? err.message : "Unable to create group order.");
    }
  }

  async function createScheduledOrder() {
    if (!session || !selectedRestaurant || !menu.length) return;
    const defaultAddressId = orders[0]?.deliveryAddressId;
    if (!defaultAddressId) {
      setSupportStatus("Add a delivery address before scheduling orders.");
      return;
    }

    try {
      await request(
        "/customers/scheduled-orders",
        {
          method: "POST",
          body: JSON.stringify({
            restaurantId: selectedRestaurant.id,
            addressId: defaultAddressId,
            title: `${selectedRestaurant.name} weekly reorder`,
            cadenceLabel: "Every Friday evening",
            nextRunAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            itemSummary: menu.slice(0, 2).map((item) => ({ menuItemId: item.id, quantity: 1, name: item.name }))
          })
        },
        session
      );
      await loadPrivateData(session);
      setSupportStatus("Scheduled order created.");
    } catch (err) {
      setSupportStatus(err instanceof Error ? err.message : "Unable to create scheduled order.");
    }
  }

  async function createMealPlan() {
    if (!session) return;
    try {
      await request(
        "/customers/meal-plans",
        {
          method: "POST",
          body: JSON.stringify({
            title: "Balanced workweek plan",
            goal: "Reliable lunches without overthinking it",
            weeklyBudget: 25000,
            mealsPerWeek: 5,
            cuisineFocus: "Mixed favorites"
          })
        },
        session
      );
      await loadPrivateData(session);
      setSupportStatus("Meal plan created.");
    } catch (err) {
      setSupportStatus(err instanceof Error ? err.message : "Unable to create meal plan.");
    }
  }

  async function initializePayment(orderId: string, amount: number) {
    if (!session) return null;

    const paymentResponse = await request<any>(
      "/payments/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          orderId,
          email: session.user.email,
          amount,
          paymentMethod
        })
      },
      session
    );

    return paymentResponse;
  }

  async function openPaymentAuthorization(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error("Unable to open the payment page on this device.");
    }

    await Linking.openURL(url);
  }

  async function placeOrder() {
    if (!session || !selectedRestaurant) {
      setCheckoutStatus("Open a restaurant menu before checking out.");
      return;
    }

    const cartItems = cartLines.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      selectedOptionIds: line.selectedOptions.map((option) => option.id),
      note: line.note || undefined
    }));

    if (!cartItems.length) {
      setCheckoutStatus("Add at least one item to continue.");
      return;
    }

    const orderSubtotal = cartLines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const orderDeliveryFee = Number(selectedRestaurant.deliveryFee ?? 0);
    const orderTotal = orderSubtotal + orderDeliveryFee;

    setCheckoutLoading(true);
    setCheckoutStatus(null);

    try {
      let deliveryAddressId = selectedAddressId;

      if (!deliveryAddressId) {
        if (!addressInput.trim() || !locationCoords) {
          throw new Error("Add a delivery address and enable location before placing the order.");
        }

        const createdAddress = await request<any>(
          "/customers/addresses",
          {
            method: "POST",
            body: JSON.stringify({
              label: addressLabelInput.trim() || "Delivery address",
              fullAddress: addressInput.trim(),
              latitude: locationCoords.latitude,
              longitude: locationCoords.longitude,
              instructions: addressInstructions.trim() || undefined
            })
          },
          session
        );
        deliveryAddressId = createdAddress.id;
      }

      const order = await request<any>(
        "/orders/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            restaurantId: selectedRestaurant.id,
            deliveryAddressId,
            subtotalAmount: orderSubtotal,
            deliveryFee: orderDeliveryFee,
            discountAmount: 0,
            totalAmount: orderTotal,
            customerNotes: addressInstructions.trim() || undefined,
            paymentMethod,
            items: cartItems
          })
        },
        session
      );

      await loadPrivateData(session);
      setTrackedOrder(order);
      setTrackingDelivery(null);
      setTimeline([]);
      setEta(null);
      setPaymentAuthorizationUrl(null);
      setPaymentReference(order?.payment?.providerRef ?? null);
      setCartLines([]);

      if (paymentMethod === "CASH") {
        setCheckoutStatus("Order placed successfully. Pay cash when your order arrives.");
      } else {
        const paymentResponse = await initializePayment(order.id, Number(order.totalAmount ?? orderTotal));
        const authorizationUrl = paymentResponse?.authorizationUrl ?? null;
        const providerRef = paymentResponse?.payment?.providerRef ?? order?.payment?.providerRef ?? null;

        setPaymentAuthorizationUrl(authorizationUrl);
        setPaymentReference(providerRef);
        setCheckoutStatus(
          paymentMethod === "CARD"
            ? "Order placed. Complete your card payment to lock it in."
            : "Order placed. Complete your mobile money payment to continue."
        );

        if (authorizationUrl) {
          await openPaymentAuthorization(authorizationUrl);
        }
      }

      setActiveScreen("confirmation");
      void loadTracking(order.id);
    } catch (err) {
      setCheckoutStatus(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function signOut() {
    Alert.alert("Logout", "Do you want to logout", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          setSession(null);
          setTrackedOrder(null);
          setTrackingDelivery(null);
          setTimeline([]);
          setEta(null);
          setSupportMessage("");
          setSupportStatus(null);
          setActiveTab("home");
          setActiveScreen("browse");
          setAuthMode("signin");
          setCartLines([]);
          closeCustomization();
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

  const cartCount = useMemo(() => cartLines.reduce((sum, line) => sum + line.quantity, 0), [cartLines]);
  const total = useMemo(() => cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [cartLines]);
  const favoriteIds = favorites.map((item) => item.restaurantId ?? item.restaurant?.id);
  const featuredRestaurants = useMemo(() => restaurants.filter((restaurant) => restaurant.isFeatured).slice(0, 5), [restaurants]);
  const promoRestaurant = featuredRestaurants[0] ?? restaurants[0] ?? null;
  const displayedLocation = locationLabel ?? profile?.customerProfile?.defaultAddress ?? "Accra, Ghana";
  const unreadNotificationCount = notifications.filter((item) => !item.isRead).length;
  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.category?.name, restaurant.storyHeadline, restaurant.storyBody]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [restaurants, searchQuery]);
  const categoryChips = useMemo(() => {
    const names = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.category?.name)
          .filter((value): value is string => Boolean(value))
      )
    );
    return names.slice(0, 4);
  }, [restaurants]);
  const popularItems = useMemo(() => {
    if (!selectedRestaurant || !menu.length) return [];
    return menu.slice(0, 4);
  }, [menu, selectedRestaurant]);
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const nav = (
    <View style={styles.bottomNavWrap}>
    <View style={styles.bottomNav}>
      {[
        { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
        { id: "orders", label: "Orders", icon: "receipt-outline", activeIcon: "receipt" },
        { id: "saved", label: "Saved", icon: "heart-outline", activeIcon: "heart" },
        { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" }
      ].map((item) => (
        <Pressable
          key={item.id}
          style={styles.navItem}
          onPress={() => {
            setActiveTab(item.id as Tab);
            if (item.id === "home") setActiveScreen("browse");
          }}
        >
          <Ionicons name={activeTab === item.id ? item.activeIcon as any : item.icon as any} size={18} color={activeTab === item.id ? "#ffffff" : "#9ca3af"} />
          <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable
        style={styles.navItem}
        onPress={() => {
          setActiveTab("home");
          setActiveScreen("cart");
        }}
      >
        <Ionicons name={activeScreen === "cart" ? "bag" : "bag-outline"} size={18} color={activeScreen === "cart" ? "#ffffff" : "#9ca3af"} />
        <Text style={[styles.navLabel, activeScreen === "cart" && styles.navLabelActive]}>Cart</Text>
        {cartCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View> : null}
      </Pressable>
    </View>
    </View>
  );

  const authForm = (
    <View style={styles.authInline}>
      <Text style={styles.cardTitle}>Access your BiteHub account.</Text>
      <Text style={styles.cardMeta}>
        {authMode === "signin"
          ? "Sign in to load your live BiteHub orders, favorites, and profile."
          : authMode === "signup"
            ? "Create a new customer account and start ordering."
            : "Request a reset token, then set a new password right here."}
      </Text>
      {authMode === "signup" ? (
        <>
          <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#9ca3af" style={styles.input} />
          <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#9ca3af" style={styles.input} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="phone-pad" />
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
      {authMode === "signin" ? (
        <Pressable style={styles.primaryButton} onPress={() => void handleSignIn()} disabled={loadingAuth}>
          <Text style={styles.primaryButtonText}>{loadingAuth ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
      ) : null}
      {authMode === "signup" ? (
        <Pressable style={styles.primaryButton} onPress={() => void handleSignUp()} disabled={loadingAuth}>
          <Text style={styles.primaryButtonText}>{loadingAuth ? "Creating account..." : "Create account"}</Text>
        </Pressable>
      ) : null}
      {authMode === "forgot" ? (
        <>
          <Pressable style={styles.primaryButton} onPress={() => void handleForgotPassword()} disabled={loadingAuth}>
            <Text style={styles.primaryButtonText}>{loadingAuth ? "Preparing..." : "Send reset token"}</Text>
          </Pressable>
          <Pressable style={styles.secondaryGhostButton} onPress={() => void handleResetPassword()} disabled={loadingAuth}>
            <Text style={styles.secondaryGhostText}>{loadingAuth ? "Updating..." : "Reset password"}</Text>
          </Pressable>
        </>
      ) : null}
      <View style={styles.authLinks}>
        <Pressable onPress={() => { resetAuthFeedback(); setAuthMode("signin"); }}><Text style={[styles.authLink, authMode === "signin" && styles.authLinkActive]}>Sign in</Text></Pressable>
        <Pressable onPress={() => { resetAuthFeedback(); setAuthMode("signup"); }}><Text style={[styles.authLink, authMode === "signup" && styles.authLinkActive]}>Sign up</Text></Pressable>
        <Pressable onPress={() => { resetAuthFeedback(); setAuthMode("forgot"); }}><Text style={[styles.authLink, authMode === "forgot" && styles.authLinkActive]}>Forgot password</Text></Pressable>
      </View>
    </View>
  );

  const authGateScreen = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.authGateScrollContent}>
    <View style={styles.authGateShell}>
      <View style={styles.authGateHero}>
        <Image source={customerLogo} style={styles.brandLogoLarge} resizeMode="contain" />
        <Text style={styles.authGateTitle}>Access your BiteHub account.</Text>
        <Text style={styles.authGateCopy}>
          Sign in to load your live BiteHub orders, favorites, profile, and personalized delivery flows.
        </Text>
      </View>
      <View style={styles.authGateCard}>{authForm}</View>
    </View>
    </ScrollView>
  );

  if (showSplash || !sessionReady) {
    return <BiteHubSplash accentColor="#cc0000" label="BiteHub Customer" logoSource={customerLogo} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {activeTab === "home" && activeScreen === "browse" ? (
        <View style={[styles.shell, styles.darkShell]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.darkBrowseScroll}>
            <View style={styles.darkBrowseHeader}>
              <View>
                <View style={styles.darkLocationRow}>
                  <Ionicons name="location" size={16} color="#f8de68" />
                  <View>
                    <Text style={styles.darkLocationTitle}>Current location</Text>
                    <Text style={styles.darkLocationMeta}>{displayedLocation}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.darkSearchWrap}>
                <Ionicons name="search-outline" size={18} color="#7c7c7c" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.darkSearchInput}
                  placeholder="Search anything..."
                  placeholderTextColor="#7c7c7c"
                />
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.restaurantGrid}>
              {filteredRestaurants.map((restaurant: any) => {
                const isClosed = restaurant.operatingMode && restaurant.operatingMode !== "LIVE";
                const hasPromo = restaurant.isFeatured;
                const mins = restaurant.estimatedDeliveryMins ?? 25;
                return (
                  <Pressable key={restaurant.id} style={styles.restaurantGridCard} onPress={() => void openRestaurant(restaurant)}>
                    <View style={styles.restaurantGridImageWrap}>
                      {restaurant.coverImageUrl ? (
                        <Image source={{ uri: restaurant.coverImageUrl }} style={styles.restaurantGridImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.restaurantGridImageFallback}>
                          <Ionicons name="restaurant" size={38} color="#f8de68" />
                        </View>
                      )}
                      {isClosed ? (
                        <View style={styles.closedOverlay}>
                          <Text style={styles.closedOverlayText}>Closed</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.restaurantGridMeta}>
                      <Text numberOfLines={1} style={styles.restaurantGridTitle}>{restaurant.name}</Text>
                      <View style={styles.restaurantGridInfoRow}>
                        <Ionicons name="time-outline" size={12} color="#d7c94c" />
                        <Text style={styles.restaurantGridInfoText}>10-{mins}mins</Text>
                      </View>
                      {hasPromo ? <View style={styles.offerBadge}><Text style={styles.offerBadgeText}>20%</Text></View> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          {cartCount > 0 ? (
            <View style={styles.footer}>
              <Pressable style={styles.checkout} onPress={() => setActiveScreen("cart")}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkoutBadge}>{cartCount} item{cartCount > 1 ? "s" : ""}</Text>
                  <Text style={styles.checkoutText}>Continue to payment</Text>
                  <Text style={styles.checkoutSubtext}>Review customizations, address, and payment details.</Text>
                </View>
                <Text style={styles.checkoutAmount}>{formatMoney(total + Number(selectedRestaurant?.deliveryFee ?? 0))}</Text>
              </Pressable>
            </View>
          ) : null}
          {nav}
        </View>
      ) : null}
      {activeTab === "home" && activeScreen === "menu" ? (
        <View style={[styles.shell, styles.darkShell]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.restaurantMenuScroll}>
            <View style={styles.restaurantHero}>
              {selectedRestaurant?.coverImageUrl ? (
                <Image source={{ uri: selectedRestaurant.coverImageUrl }} style={styles.restaurantHeroImage} resizeMode="cover" />
              ) : (
                <View style={styles.restaurantHeroFallback}>
                  <Ionicons name="restaurant" size={88} color="#f8de68" />
                </View>
              )}
              <Pressable style={styles.restaurantHeroButton} onPress={() => setActiveScreen("browse")}>
                <Ionicons name="chevron-back" size={18} color="#f8de68" />
              </Pressable>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={14} color="#f8de68" />
                <Text style={styles.ratingPillText}>{Number(selectedRestaurant?.averageRating ?? 3.8).toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.restaurantTitleBand}>
              <Text style={styles.restaurantTitleBandText}>{selectedRestaurant?.name ?? "Restaurant"}</Text>
            </View>

            <View style={styles.menuTabRow}>
              <Text style={styles.menuTabTextActive}>MAIN MENU</Text>
            </View>

            <View style={styles.restaurantMenuSection}>
              <Text style={styles.restaurantMenuSectionTitle}>MAIN MENU</Text>
              {menu.map((item) => (
                <Pressable key={item.id} style={styles.restaurantMenuItem} onPress={() => openCustomization(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.restaurantMenuItemTitle}>{item.name}</Text>
                    <Text style={styles.restaurantMenuItemPrice}>
                      From {formatMoney(Number(item.effectivePrice ?? item.price ?? 0))}
                      {item.originalPrice ? `  •  was ${formatMoney(Number(item.originalPrice ?? 0))}` : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#d7c94c" />
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {cartCount > 0 ? (
            <View style={styles.detailFooter}>
              <View style={styles.detailCheckoutWrap}>
                <Text style={styles.detailCheckoutHint}>Basket ready</Text>
                <Pressable style={styles.detailAddButton} onPress={() => setActiveScreen("cart")}>
                  <Text style={styles.detailAddButtonText}>Go to Basket</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {activeTab === "home" && activeScreen === "cart" ? (
        <View style={styles.shell}>
          <View style={styles.headerRow}>
            <Pressable style={styles.iconButton} onPress={() => setActiveScreen("menu")}>
              <Text style={styles.iconButtonText}>Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Checkout</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {cartLines.map((line) => (
              <View key={line.id} style={styles.card}>
                <View style={styles.thumb}><Text style={styles.thumbText}>{line.menuItemName?.slice(0, 1) ?? "M"}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{line.menuItemName}</Text>
                  {line.selectedOptions.length ? (
                    <Text style={styles.cardMeta}>
                      {line.selectedOptions.map((option) => option.name).join(", ")}
                    </Text>
                  ) : null}
                  {line.note ? <Text style={styles.cardMeta}>Note: {line.note}</Text> : null}
                  <Text style={styles.price}>{formatMoney(line.unitPrice * line.quantity)}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyAlt} onPress={() => updateCartLineQuantity(line.id, line.quantity - 1)}>
                    <Text style={styles.qtyAltText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyCount}>{line.quantity}</Text>
                  <Pressable style={styles.qty} onPress={() => updateCartLineQuantity(line.id, line.quantity + 1)}>
                    <Text style={styles.qtyText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <View style={styles.summary}>
              <Text style={styles.cardTitle}>Delivery Address</Text>
              {addresses.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantChoiceRow}>{addresses.map((address) => <Pressable key={address.id} style={[styles.restaurantChoice, selectedAddressId === address.id && styles.restaurantChoiceActive]} onPress={() => { setSelectedAddressId(address.id); setAddressInput(address.fullAddress ?? ""); setAddressInstructions(address.instructions ?? ""); }}><Text style={[styles.restaurantChoiceText, selectedAddressId === address.id && styles.restaurantChoiceTextActive]}>{address.label}</Text></Pressable>)}</ScrollView> : <Text style={styles.cardMeta}>No saved addresses yet. Add one below.</Text>}
              <TextInput value={addressLabelInput} onChangeText={setAddressLabelInput} placeholder="Address label" placeholderTextColor="#9ca3af" style={styles.input} />
              <TextInput value={addressInput} onChangeText={(value) => { setSelectedAddressId(""); setAddressInput(value); }} placeholder="Full delivery address" placeholderTextColor="#9ca3af" style={styles.input} multiline />
              <TextInput value={addressInstructions} onChangeText={setAddressInstructions} placeholder="Delivery instructions" placeholderTextColor="#9ca3af" style={styles.input} multiline />
            </View>
            <View style={styles.summary}>
              <Text style={styles.cardTitle}>Payment Method</Text>
              <View style={styles.actionRow}>{(["CASH", "CARD", "MOBILE_MONEY"] as PaymentMethod[]).map((method) => <Pressable key={method} style={[styles.toggleChip, paymentMethod === method && styles.toggleChipActive]} onPress={() => setPaymentMethod(method)}><Text style={[styles.toggleChipText, paymentMethod === method && styles.toggleChipTextActive]}>{method.replaceAll("_", " ")}</Text></Pressable>)}</View>
              <Text style={styles.checkoutHelperText}>{paymentMethod === "CASH" ? "Cash orders are confirmed now and paid on delivery." : paymentMethod === "CARD" ? "Card orders will open a secure payment page after you confirm." : "Mobile money orders will open a secure payment page after you confirm."}</Text>
            </View>
            <View style={styles.summary}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              <Text style={styles.cardMeta}>Items total: {formatMoney(total)}</Text>
              <Text style={styles.cardMeta}>Delivery fee: {formatMoney(Number(selectedRestaurant?.deliveryFee ?? 0))}</Text>
              <Text style={styles.price}>Total: {formatMoney(total + Number(selectedRestaurant?.deliveryFee ?? 0))}</Text>
              {checkoutStatus ? <Text style={styles.cardMeta}>{checkoutStatus}</Text> : null}
              <Pressable style={styles.primaryButton} onPress={() => void placeOrder()} disabled={checkoutLoading}>
                <Text style={styles.primaryButtonText}>{checkoutLoading ? "Processing..." : paymentMethod === "CASH" ? "Place Cash Order" : paymentMethod === "CARD" ? "Continue to Card Payment" : "Continue to Mobile Money"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      ) : null}
      {customizingItem ? (
        <View style={styles.customizationBackdrop}>
          <View style={styles.customizationSheet}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.customizationSheetContent}>
              <View style={styles.customizationHeader}>
                <Text style={styles.customizationTitle}>{customizingItem.name}</Text>
                <Text style={styles.customizationSubtitle}>
                  From {formatMoney(Number(customizingItem.effectivePrice ?? customizingItem.price ?? 0))}
                </Text>
              </View>

              {(customizingItem.modifierGroups ?? []).map((group: any) => {
                const selectedIds = customizationSelections[group.id] ?? [];
                return (
                  <View key={group.id} style={styles.customizationGroup}>
                    <View style={styles.customizationGroupHeader}>
                      <Text style={styles.customizationGroupTitle}>{group.name}</Text>
                      {group.isRequired ? <Text style={styles.requiredBadge}>Required</Text> : null}
                    </View>
                    {group.description ? <Text style={styles.customizationGroupCopy}>{group.description}</Text> : null}
                    {(group.options ?? []).map((option: any) => {
                      const selected = selectedIds.includes(option.id);
                      return (
                        <Pressable key={option.id} style={styles.customizationOptionRow} onPress={() => toggleCustomizationOption(group, option.id)}>
                          <View style={[styles.optionSelector, selected && styles.optionSelectorActive]}>
                            {group.selectionType === "SINGLE" ? (
                              <View style={[styles.optionSelectorInner, selected && styles.optionSelectorInnerActive]} />
                            ) : selected ? (
                              <Ionicons name="checkmark" size={14} color="#111111" />
                            ) : null}
                          </View>
                          <Text style={styles.customizationOptionText}>{option.name}</Text>
                          <Text style={styles.customizationOptionPrice}>
                            {Number(option.priceDelta ?? 0) > 0 ? `+${formatMoney(Number(option.priceDelta ?? 0))}` : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              <TextInput
                value={customizationNote}
                onChangeText={setCustomizationNote}
                placeholder="Tap here to add a note to the vendor..."
                placeholderTextColor="#8a8a8a"
                style={styles.customizationNoteInput}
                multiline
              />
            </ScrollView>

            <View style={styles.customizationFooter}>
              <View style={styles.customizationQuantityRow}>
                <Pressable style={styles.customizationQuantityButton} onPress={() => setCustomizationQuantity((current) => Math.max(1, current - 1))}>
                  <Text style={styles.customizationQuantitySymbol}>-</Text>
                </Pressable>
                <Text style={styles.customizationQuantityValue}>{customizationQuantity}</Text>
                <Pressable style={styles.customizationQuantityButton} onPress={() => setCustomizationQuantity((current) => current + 1)}>
                  <Text style={styles.customizationQuantitySymbol}>+</Text>
                </Pressable>
              </View>
              <Pressable style={styles.customizationAddButton} onPress={addCustomizedItemToCart}>
                <Text style={styles.customizationAddButtonText}>Add</Text>
              </Pressable>
            </View>
            <Pressable style={styles.customizationClose} onPress={closeCustomization}>
              <Ionicons name="close" size={18} color="#f8de68" />
            </Pressable>
          </View>
        </View>
      ) : null}
      {activeTab === "home" && activeScreen === "confirmation" ? (
        <View style={styles.shell}>
          <View style={styles.headerRow}>
            <Pressable style={styles.iconButton} onPress={() => setActiveScreen("browse")}>
              <Text style={styles.iconButtonText}>Home</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Order Confirmed</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.confirmationHero}>
              <View style={styles.confirmationIcon}>
                <Ionicons
                  name={paymentMethod === "CASH" ? "checkmark-done" : "card-outline"}
                  size={34}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.confirmationTitle}>
                {paymentMethod === "CASH" ? "Your order is on the way into the kitchen." : "Your order has been created."}
              </Text>
              <Text style={styles.confirmationCopy}>
                {paymentMethod === "CASH"
                  ? "You can track the order now and pay cash when it arrives."
                  : paymentMethod === "CARD"
                    ? "Complete the card payment to finish checkout. You can reopen the payment page below if needed."
                    : "Complete the mobile money payment to finish checkout. You can reopen the payment page below if needed."}
              </Text>
            </View>

            <View style={styles.summary}>
              <Text style={styles.cardTitle}>Order details</Text>
              <Text style={styles.cardMeta}>{trackedOrder?.restaurant?.name ?? selectedRestaurant?.name ?? "BiteHub order"}</Text>
              <Text style={styles.cardMeta}>Order ID: {trackedOrder?.id ?? "Pending"}</Text>
              <Text style={styles.cardMeta}>Payment status: {String(trackedOrder?.payment?.status ?? (paymentMethod === "CASH" ? "PAY_ON_DELIVERY" : "PENDING")).replaceAll("_", " ")}</Text>
              <Text style={styles.price}>Total: {formatMoney(Number(trackedOrder?.totalAmount ?? total + Number(selectedRestaurant?.deliveryFee ?? 0)))}</Text>
              {paymentReference ? <Text style={styles.cardMeta}>Payment reference: {paymentReference}</Text> : null}
              {checkoutStatus ? <Text style={styles.cardMeta}>{checkoutStatus}</Text> : null}
            </View>

            <View style={styles.summary}>
              <Text style={styles.cardTitle}>What next?</Text>
              <View style={styles.confirmationSteps}>
                <Text style={styles.cardMeta}>1. Review your order status in live tracking.</Text>
                <Text style={styles.cardMeta}>
                  {paymentMethod === "CASH"
                    ? "2. Keep your phone nearby so your rider can reach you."
                    : "2. Complete your payment using the secure payment page."}
                </Text>
                <Text style={styles.cardMeta}>3. Watch for vendor and rider updates as your order moves.</Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={() => setActiveScreen("tracking")}>
                <Text style={styles.primaryButtonText}>Track Order</Text>
              </Pressable>
              {paymentMethod !== "CASH" && trackedOrder?.id ? (
                <Pressable style={styles.secondaryButton} onPress={() => void refreshTrackedOrderStatus(trackedOrder.id)}>
                  <Text style={styles.secondaryButtonText}>Refresh payment status</Text>
                </Pressable>
              ) : null}
              {paymentAuthorizationUrl ? (
                <Pressable style={styles.secondaryGhostButton} onPress={() => void openPaymentAuthorization(paymentAuthorizationUrl)}>
                  <Text style={styles.secondaryGhostText}>
                    {paymentMethod === "CARD" ? "Open payment page" : "Open mobile money payment"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      ) : null}
      {activeTab === "orders" ? <View style={styles.shell}>{!session ? authGateScreen : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ordersScroll}><Text style={styles.ordersPageTitle}>Orders</Text>{recentOrders.map((order, index) => <Pressable key={order.id} style={[styles.orderShowcaseCard, index % 2 === 0 ? styles.orderShowcaseGreen : styles.orderShowcaseBlue]} onPress={() => { setTrackedOrder(order); setActiveTab("home"); setActiveScreen("tracking"); void loadTracking(order.id); }}><View style={styles.orderShowcaseHeader}><View style={styles.orderBadge}><Text style={styles.orderBadgeText}>{order.restaurant?.name?.slice(0, 1) ?? "B"}</Text></View><View style={{ flex: 1 }}><Text style={styles.orderShowcaseTitle}>{order.restaurant?.name ?? "BiteHub Kitchen"}</Text><Text style={styles.cardMeta}>{String(order.status).replaceAll("_", " ")}</Text></View><View style={styles.orderPriceChip}><Text style={styles.orderPriceChipText}>{formatMoney(Number(order.totalAmount ?? 0))}</Text></View></View><View style={styles.orderFoodHero}><Ionicons name={index % 2 === 0 ? "fast-food" : "pizza"} size={92} color="#8d2d00" /></View><View style={styles.orderCourierRow}><View style={styles.orderCourierAvatar}><Text style={styles.orderCourierInitial}>{order.rider?.user?.firstName?.slice(0, 1) ?? "A"}</Text></View><View style={{ flex: 1 }}><Text style={styles.detailOwnerName}>{order.rider?.user?.firstName ?? "Assigned"} {order.rider?.user?.lastName ?? "Rider"}</Text><Text style={styles.cardMeta}>{order.deliveryAddress?.label ?? "Pickup and delivery in progress"}</Text></View><View style={styles.orderActions}><Ionicons name="location-outline" size={18} color="#111827" /><Ionicons name="call-outline" size={18} color="#111827" /></View></View></Pressable>)}{!recentOrders.length ? <View style={styles.summary}><Text style={styles.cardTitle}>No orders yet</Text><Text style={styles.cardMeta}>Once you place an order, it will appear here in the cleaner card stack.</Text></View> : null}</ScrollView>}{nav}</View> : null}
      {activeTab === "saved" ? <View style={styles.shell}>{!session ? authGateScreen : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}><Text style={styles.headerTitle}>Saved Restaurants</Text>{favorites.map((favorite) => <View key={favorite.id} style={styles.card}><View style={styles.thumb}><Text style={styles.thumbText}>{favorite.restaurant?.name?.slice(0, 1) ?? "S"}</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{favorite.restaurant?.name ?? "Restaurant"}</Text><Text style={styles.cardMeta}>{favorite.restaurant?.address ?? ""}</Text></View></View>)}</ScrollView>}{nav}</View> : null}
      {activeTab === "profile" ? <View style={styles.shell}>{!session ? authGateScreen : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}><Text style={styles.headerTitle}>My Profile</Text><View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{profile?.firstName?.[0] ?? session.user.firstName[0]}{profile?.lastName?.[0] ?? session.user.lastName[0]}</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{profile?.firstName ?? session.user.firstName} {profile?.lastName ?? session.user.lastName}</Text><Text style={styles.cardMeta}>{profile?.email ?? session.user.email}</Text><Text style={styles.cardMeta}>{profile?.customerProfile?.defaultAddress ?? "No default address set"}</Text></View></View><View style={styles.summary}><Text style={styles.cardTitle}>Notifications</Text><Text style={styles.cardMeta}>{unreadNotificationCount} unread notification(s)</Text><View style={styles.actionRow}><Pressable style={styles.secondaryButton} onPress={() => void markAllNotificationsRead()}><Text style={styles.secondaryButtonText}>Mark all read</Text></Pressable><Pressable style={styles.secondaryButton} onPress={() => void clearReadNotifications()}><Text style={styles.secondaryButtonText}>Clear read</Text></Pressable></View>{notifications.length ? notifications.slice(0, 5).map((notification) => <Pressable key={notification.id} style={styles.collectionReason} onPress={() => void markNotificationRead(notification.id)}><Text style={styles.cardTitleSmall}>{notification.title}</Text><Text style={styles.cardMeta}>{notification.body}</Text><Text style={styles.cardMeta}>{notification.isRead ? "Read" : "Tap to mark as read"}</Text></Pressable>) : <Text style={styles.cardMeta}>No notifications yet.</Text>}</View><View style={styles.summary}><Text style={styles.cardTitle}>Loyalty</Text><Text style={styles.cardMeta}>Tier: {retentionOverview?.loyaltyWallet?.tier ?? profile?.customerProfile?.loyaltyWallet?.tier ?? "CORE"}</Text><Text style={styles.price}>{retentionOverview?.loyaltyWallet?.pointsBalance ?? profile?.customerProfile?.loyaltyWallet?.pointsBalance ?? 0} points</Text><View style={styles.actionRow}><Pressable style={styles.secondaryButton} onPress={() => void createMealPlan()}><Text style={styles.secondaryButtonText}>Create meal plan</Text></Pressable></View>{supportStatus ? <Text style={styles.cardMeta}>{supportStatus}</Text> : null}</View>{retentionOverview?.subscriptions?.length ? <View style={styles.summary}><Text style={styles.cardTitle}>Subscriptions</Text>{retentionOverview.subscriptions.map((subscription: any) => <View key={subscription.id} style={styles.collectionReason}><Text style={styles.cardTitleSmall}>{subscription.name}</Text><Text style={styles.cardMeta}>{subscription.benefitsSummary}</Text></View>)}</View> : null}{retentionOverview?.mealPlans?.length ? <View style={styles.summary}><Text style={styles.cardTitle}>Meal plans</Text>{retentionOverview.mealPlans.map((plan: any) => <View key={plan.id} style={styles.collectionReason}><Text style={styles.cardTitleSmall}>{plan.title}</Text><Text style={styles.cardMeta}>{plan.goal ?? "Personal plan"} | {plan.mealsPerWeek} meals/week</Text></View>)}</View> : null}{retentionOverview?.scheduledOrders?.length ? <View style={styles.summary}><Text style={styles.cardTitle}>Scheduled orders</Text>{retentionOverview.scheduledOrders.map((scheduled: any) => <View key={scheduled.id} style={styles.collectionReason}><Text style={styles.cardTitleSmall}>{scheduled.title}</Text><Text style={styles.cardMeta}>{scheduled.restaurant?.name ?? "Restaurant"} | {scheduled.cadenceLabel}</Text></View>)}</View> : null}{retentionOverview?.reorderSuggestions?.length ? <View style={styles.summary}><Text style={styles.cardTitle}>Reorder suggestions</Text>{retentionOverview.reorderSuggestions.map((suggestion: any) => <View key={suggestion.orderId} style={styles.collectionReason}><Text style={styles.cardTitleSmall}>{suggestion.restaurantName}</Text><Text style={styles.cardMeta}>{(suggestion.topItems ?? []).join(", ")}</Text></View>)}</View> : null}<View style={styles.summary}><Text style={styles.cardTitle}>Account</Text><Text style={styles.cardMeta}>Sign out of your BiteHub customer session on this device.</Text><Pressable style={styles.primaryButton} onPress={signOut}><Text style={styles.primaryButtonText}>Sign Out</Text></Pressable></View></ScrollView>}{nav}</View> : null}
        {activeTab === "home" && activeScreen === "tracking" ? <View style={styles.shell}><View style={styles.headerRow}><Pressable style={styles.iconButton} onPress={() => setActiveScreen("browse")}><Text style={styles.iconButtonText}>Back</Text></Pressable><Text style={styles.headerTitle}>Track Order</Text></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}><View style={styles.summary}><Text style={styles.cardTitle}>{trackedOrder?.restaurant?.name ?? selectedRestaurant?.name ?? "BiteHub order"}</Text><Text style={styles.cardMeta}>{trackedOrder?.id ?? "Live tracking"}</Text><Text style={styles.price}>ETA {eta?.etaMinutes ?? "--"} min | {eta?.confidencePercent ?? "--"}% confidence</Text>{eta?.delayReason ? <Text style={styles.cardMeta}>{eta.delayReason}</Text> : null}</View>{trackingDelivery?.riderProfile ? <View style={styles.summary}><Text style={styles.cardTitle}>Live rider location</Text><View style={styles.locationSignalCard}><View style={styles.locationSignalHeader}><View style={styles.locationSignalBadge}><Ionicons name="navigate" size={16} color="#c2410c" /></View><View style={{ flex: 1 }}><Text style={styles.locationSignalTitle}>Rider route is active</Text><Text style={styles.locationSignalCopy}>{typeof trackingDelivery.riderProfile.currentLatitude === "number" && typeof trackingDelivery.riderProfile.currentLongitude === "number" ? `Last known coordinates: ${trackingDelivery.riderProfile.currentLatitude.toFixed(5)}, ${trackingDelivery.riderProfile.currentLongitude.toFixed(5)}` : "We will show the rider's last known location as soon as they start moving."}</Text></View></View><View style={styles.locationSignalFooter}><Text style={styles.locationSignalMeta}>{trackedOrder?.deliveryAddress?.label ?? trackingDelivery?.order?.deliveryAddress?.label ?? "Delivery destination"}</Text><Pressable style={styles.secondaryButton} onPress={() => void openRiderLocation()}><Text style={styles.secondaryButtonText}>Open live location</Text></Pressable></View></View></View> : null}{trackingDelivery?.riderProfile ? <View style={styles.summary}><Text style={styles.cardTitle}>Your rider</Text><Text style={styles.cardMeta}>{trackingDelivery.riderProfile.user?.firstName ?? "Rider"} {trackingDelivery.riderProfile.user?.lastName ?? ""}{trackingDelivery.riderProfile.vehicleType ? ` | ${trackingDelivery.riderProfile.vehicleType}` : ""}</Text><Text style={styles.cardMeta}>{typeof trackingDelivery.riderProfile.currentLatitude === "number" && typeof trackingDelivery.riderProfile.currentLongitude === "number" ? `Last known location: ${trackingDelivery.riderProfile.currentLatitude.toFixed(5)}, ${trackingDelivery.riderProfile.currentLongitude.toFixed(5)}` : "Live rider location will appear once the rider is active."}</Text><View style={styles.actionRow}><Pressable style={styles.secondaryButton} onPress={() => void callRider()}><Text style={styles.secondaryButtonText}>Call rider</Text></Pressable><Pressable style={styles.secondaryButton} onPress={() => void openRiderLocation()}><Text style={styles.secondaryButtonText}>Open rider location</Text></Pressable></View></View> : null}<View style={styles.summary}><Text style={styles.cardTitle}>Timeline</Text>{timeline.length ? timeline.map((event) => <View key={event.id} style={styles.timelineRow}><View style={styles.timelineDot} /><View style={{ flex: 1 }}><Text style={styles.cardTitleSmall}>{event.title}</Text>{event.description ? <Text style={styles.cardMeta}>{event.description}</Text> : null}</View></View>) : <Text style={styles.cardMeta}>Tracking data will appear here when the order moves.</Text>}</View>{session && trackedOrder ? <View style={styles.summary}><Text style={styles.cardTitle}>Need help?</Text><TextInput value={supportMessage} onChangeText={setSupportMessage} placeholder="Describe the issue with this order" placeholderTextColor="#9ca3af" style={styles.input} />{supportStatus ? <Text style={styles.cardMeta}>{supportStatus}</Text> : null}<Pressable style={styles.primaryButton} onPress={() => void createSupportTicket()}><Text style={styles.primaryButtonText}>Contact Support</Text></Pressable></View> : null}</ScrollView></View> : null}
    </SafeAreaView>
  );
}

const pill = { borderRadius: 999, overflow: "hidden" } as const;
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" }, shell: { flex: 1, backgroundColor: "#f9fafb" }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 18 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" }, headerBrandWrap: { flexDirection: "row", alignItems: "center", gap: 10 }, headerChip: { ...pill, backgroundColor: "#fff7ed", paddingHorizontal: 12, paddingVertical: 8 }, headerChipText: { color: "#c2410c", fontWeight: "800" }, caption: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  brandLogoLarge: { width: 152, height: 152, alignSelf: "center" }, brandLogoSmall: { width: 42, height: 42 },
  search: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }, searchInput: { flex: 1, fontSize: 14, color: "#374151" }, filterChip: { borderRadius: 14, backgroundColor: "#f97316", paddingHorizontal: 12, paddingVertical: 8 }, filterChipText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  locationCard: { marginBottom: 14, borderRadius: 28, backgroundColor: "#fff7ed", padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 }, locationIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }, locationEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: "#c2410c" }, locationTitle: { marginTop: 6, fontSize: 16, fontWeight: "800", color: "#111827" }, locationMeta: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#6b7280" }, locationHint: { marginTop: 6, fontSize: 12, lineHeight: 18, color: "#9a3412" }, locationButton: { borderRadius: 16, backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 10 }, locationButtonText: { color: "#c2410c", fontSize: 12, fontWeight: "800" },
  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 26 }, heroCard: { borderRadius: 30, backgroundColor: "#111827", padding: 22, marginBottom: 18 }, heroLabel: { fontSize: 11, fontWeight: "800", color: "#fdba74", textTransform: "uppercase", letterSpacing: 0.8 }, heroTitle: { marginTop: 10, fontSize: 28, lineHeight: 34, color: "#fff", fontWeight: "800" }, heroCopy: { marginTop: 12, fontSize: 14, lineHeight: 22, color: "#d1d5db" },
  sectionTitle: { marginTop: 8, marginBottom: 12, fontSize: 18, fontWeight: "800", color: "#111827" }, horizontalList: { gap: 12, paddingBottom: 4 }, featureCard: { width: 260, borderRadius: 28, backgroundColor: "#fb923c", padding: 18, marginBottom: 18 }, featureEyebrow: { color: "#ffedd5", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }, featureTitle: { color: "#fff", fontSize: 22, lineHeight: 28, fontWeight: "800", marginTop: 10 }, featureCopy: { color: "#fff7ed", fontSize: 13, lineHeight: 20, marginTop: 10 }, featureMeta: { color: "#7c2d12", fontSize: 12, fontWeight: "800", marginTop: 14 },
  collectionCard: { marginBottom: 14, borderRadius: 28, backgroundColor: "#fff7ed", padding: 16 }, collectionTitle: { fontSize: 16, fontWeight: "800", color: "#9a3412" }, collectionPill: { minWidth: 180, borderRadius: 22, backgroundColor: "#fff", padding: 14 }, collectionPillTitle: { fontSize: 14, fontWeight: "800", color: "#111827" }, collectionPillMeta: { marginTop: 6, fontSize: 12, lineHeight: 18, color: "#6b7280" },
  card: { marginBottom: 14, borderRadius: 28, backgroundColor: "#fff", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }, cardTitle: { fontSize: 15, fontWeight: "800", color: "#111827" }, cardMeta: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#6b7280" }, thumb: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" }, thumbText: { fontSize: 24, color: "#c2410c", fontWeight: "800" }, heart: { fontSize: 12, fontWeight: "800", color: "#f97316" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 18 }, iconButton: { minWidth: 56, height: 40, borderRadius: 16, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, iconButtonText: { fontSize: 13, color: "#374151", fontWeight: "700" }, storyCard: { marginBottom: 14, borderRadius: 30, backgroundColor: "#1f2937", padding: 20 }, storyEyebrow: { color: "#fdba74", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }, storyTitle: { color: "#fff", fontSize: 26, lineHeight: 32, fontWeight: "800", marginTop: 10 }, storyCopy: { color: "#e5e7eb", fontSize: 14, lineHeight: 22, marginTop: 12 }, storyNote: { color: "#fed7aa", fontSize: 13, lineHeight: 20, marginTop: 12, fontWeight: "700" }, storyMeta: { color: "#d1d5db", fontSize: 12, lineHeight: 18, marginTop: 10 },
  price: { marginTop: 8, fontSize: 14, fontWeight: "800", color: "#f97316" }, inlineMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }, inlineBadge: { ...pill, backgroundColor: "#fed7aa", color: "#9a3412", paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "800" }, inlineBadgeMuted: { ...pill, backgroundColor: "#ffedd5", color: "#c2410c", paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700" }, inlineTag: { ...pill, backgroundColor: "#f3f4f6", color: "#4b5563", paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" }, secondaryButton: { borderRadius: 18, backgroundColor: "#fff7ed", paddingHorizontal: 14, paddingVertical: 12 }, secondaryButtonText: { color: "#c2410c", fontSize: 12, fontWeight: "800" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 }, qty: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" }, qtyText: { color: "#fff", fontSize: 18, fontWeight: "800" }, qtyAlt: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" }, qtyAltText: { color: "#c2410c", fontSize: 18, fontWeight: "800" }, qtyCount: { minWidth: 18, textAlign: "center", fontSize: 14, fontWeight: "800", color: "#111827" },
  footer: { paddingHorizontal: 20, paddingBottom: 12 }, checkout: { borderRadius: 22, backgroundColor: "#f97316", paddingHorizontal: 18, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, checkoutBadge: { ...pill, alignSelf: "flex-start", backgroundColor: "#fb923c", color: "#fff", paddingHorizontal: 10, paddingVertical: 5, fontWeight: "800" }, checkoutText: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 8 }, checkoutSubtext: { color: "#ffedd5", fontSize: 12, lineHeight: 18, marginTop: 4, maxWidth: 220 }, checkoutAmount: { color: "#ffffff", fontSize: 16, fontWeight: "900" }, summary: { marginBottom: 14, borderRadius: 28, backgroundColor: "#fff", padding: 16 },
  checkoutHelperText: { marginTop: 12, color: "#6b7280", fontSize: 12, lineHeight: 18 },
  authInline: { paddingHorizontal: 20, paddingTop: 24 }, input: { marginTop: 12, borderRadius: 18, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 12, color: "#111827" }, error: { color: "#e11d48", marginBottom: 10, fontSize: 13 }, success: { color: "#15803d", marginBottom: 10, marginTop: 10, fontSize: 13 }, primaryButton: { marginTop: 18, borderRadius: 20, backgroundColor: "#f97316", paddingVertical: 16, alignItems: "center" }, primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryGhostButton: { marginTop: 12, borderRadius: 20, borderWidth: 1, borderColor: "#fdba74", paddingVertical: 14, alignItems: "center" }, secondaryGhostText: { color: "#c2410c", fontSize: 14, fontWeight: "800" }, authLinks: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 18 }, authLink: { color: "#9a3412", fontSize: 13, fontWeight: "700" }, authLinkActive: { color: "#f97316" },
  authGateScrollContent: { flexGrow: 1 }, authGateShell: { flexGrow: 1, justifyContent: "flex-start", paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32, backgroundColor: "#f9fafb" }, authGateHero: { marginBottom: 22 }, authGateTitle: { marginTop: 12, fontSize: 32, lineHeight: 38, fontWeight: "800", color: "#111827" }, authGateCopy: { marginTop: 10, fontSize: 15, lineHeight: 22, color: "#6b7280" }, authGateCard: { borderRadius: 30, backgroundColor: "#ffffff", paddingVertical: 8, shadowColor: "#111827", shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  profileCard: { marginTop: 18, borderRadius: 28, backgroundColor: "#fff", padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }, avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" }, avatarText: { color: "#c2410c", fontSize: 20, fontWeight: "800" }, timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 14 }, timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#f97316", marginTop: 4 }, cardTitleSmall: { fontSize: 14, fontWeight: "800", color: "#111827" }, tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, tagPill: { ...pill, backgroundColor: "#fff7ed", paddingHorizontal: 12, paddingVertical: 7 }, tagText: { color: "#c2410c", fontSize: 12, fontWeight: "800" }, collectionReason: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  bottomNavWrap: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#f9fafb" },
  bottomNav: { borderRadius: 26, backgroundColor: "#111827", paddingVertical: 12, paddingHorizontal: 6, flexDirection: "row", justifyContent: "space-around" }, navItem: { minWidth: 58, alignItems: "center", gap: 4, borderRadius: 18, paddingVertical: 8 }, navLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af" }, navLabelActive: { color: "#ffffff" }, badge: { position: "absolute", right: -2, top: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }, badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  shopScroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  shopHeader: { marginBottom: 16 },
  shopHeaderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shopLocationPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 18, backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 9 },
  shopLocationText: { maxWidth: 210, color: "#111827", fontSize: 12, fontWeight: "700" },
  shopCartButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  shopCartBadge: { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#fb923c", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  shopHeroTitle: { marginTop: 18, maxWidth: 260, fontSize: 31, lineHeight: 38, fontWeight: "900", color: "#111827" },
  shopSearchBar: { marginBottom: 18, borderRadius: 22, backgroundColor: "#ffffff", paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  shopSearchInput: { flex: 1, fontSize: 14, color: "#111827" },
  promoCard: { marginBottom: 22, borderRadius: 28, backgroundColor: "#fde68a", paddingHorizontal: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  promoTextWrap: { flex: 1, paddingRight: 12 },
  promoTitle: { fontSize: 22, lineHeight: 27, fontWeight: "900", color: "#111827" },
  promoButton: { alignSelf: "flex-start", marginTop: 16, borderRadius: 18, backgroundColor: "#111827", paddingHorizontal: 14, paddingVertical: 10 },
  promoButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  promoArt: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  foodOrbLarge: { position: "absolute", width: 112, height: 112, borderRadius: 56, backgroundColor: "rgba(255,255,255,0.22)" },
  foodOrbSmall: { position: "absolute", width: 82, height: 82, borderRadius: 41, backgroundColor: "rgba(255,255,255,0.16)" },
  sectionRow: { marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shopSectionTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  sectionLink: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  categoryRow: { gap: 12, paddingBottom: 4 },
  categoryChipCard: { width: 82, borderRadius: 24, backgroundColor: "#ffffff", paddingHorizontal: 8, paddingVertical: 12, alignItems: "center", gap: 8 },
  categoryChipCardActive: { backgroundColor: "#fff7ed" },
  categoryChipIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  categoryChipIconActive: { backgroundColor: "#ffedd5" },
  categoryChipText: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  categoryChipTextActive: { color: "#111827" },
  popularGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 14 },
  foodCard: { width: "47%", borderRadius: 28, padding: 14, marginBottom: 6 },
  foodCardMint: { backgroundColor: "#d9f99d" },
  foodCardBlue: { backgroundColor: "#bfdbfe" },
  foodPlate: { width: 92, height: 92, borderRadius: 46, backgroundColor: "rgba(255,255,255,0.5)", alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  foodCardTitle: { fontSize: 15, fontWeight: "900", color: "#111827" },
  foodCardFooter: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  foodCardMeta: { flex: 1, color: "#374151", fontSize: 12, fontWeight: "700" },
  foodCardCart: { minWidth: 30, height: 30, borderRadius: 15, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 3, paddingHorizontal: 8 },
  foodCardCartCount: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  detailScroll: { paddingBottom: 122, backgroundColor: "#f9fafb" },
  detailHero: { height: 310, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, backgroundColor: "#d9f99d", paddingHorizontal: 18, paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailTopButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" },
  detailHeroPlate: { position: "absolute", left: 0, right: 0, top: 74, alignItems: "center", justifyContent: "center" },
  detailContent: { marginTop: -22, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: "#f9fafb", paddingHorizontal: 20, paddingTop: 24 },
  detailTitle: { fontSize: 28, fontWeight: "900", color: "#111827" },
  detailSubhead: { marginTop: 6, color: "#6b7280", fontSize: 13, lineHeight: 19 },
  detailPriceRow: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailPrice: { fontSize: 28, fontWeight: "900", color: "#111827" },
  detailFavButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  detailMetaRow: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailMetaPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 16, backgroundColor: "#ffffff", paddingHorizontal: 10, paddingVertical: 8 },
  detailMetaText: { color: "#111827", fontSize: 12, fontWeight: "700" },
  detailOwnerRow: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  detailOwnerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  detailOwnerInitial: { color: "#c2410c", fontSize: 18, fontWeight: "900" },
  detailOwnerName: { color: "#111827", fontSize: 14, fontWeight: "800" },
  detailOwnerSubtext: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  detailOwnerActions: { flexDirection: "row", gap: 10 },
  detailSectionTitle: { marginTop: 20, fontSize: 16, fontWeight: "900", color: "#111827" },
  detailDescription: { marginTop: 8, color: "#6b7280", fontSize: 13, lineHeight: 20 },
  detailMenuRow: { marginTop: 14, borderRadius: 24, backgroundColor: "#ffffff", padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  detailMenuIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
  detailMenuTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  detailFooter: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 22, backgroundColor: "rgba(249,250,251,0.96)", flexDirection: "row", alignItems: "center", gap: 12 },
  detailQuantityBar: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, backgroundColor: "#ffffff", paddingHorizontal: 14, paddingVertical: 14 },
  detailQuantityButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
  detailQuantityValue: { minWidth: 24, textAlign: "center", color: "#111827", fontSize: 16, fontWeight: "800" },
  detailCheckoutWrap: { flex: 1 },
  detailCheckoutHint: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, paddingLeft: 4 },
  detailAddButton: { flex: 1, borderRadius: 24, backgroundColor: "#111827", paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  detailAddButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  confirmationHero: { marginBottom: 14, borderRadius: 30, backgroundColor: "#111827", paddingVertical: 26, paddingHorizontal: 22, alignItems: "center" },
  confirmationIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center" },
  confirmationTitle: { marginTop: 16, textAlign: "center", fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#ffffff" },
  confirmationCopy: { marginTop: 10, textAlign: "center", fontSize: 13, lineHeight: 20, color: "#d1d5db" },
  confirmationSteps: { marginTop: 10, gap: 6 },
  locationSignalCard: { marginTop: 12, borderRadius: 22, backgroundColor: "#fff7ed", padding: 16, borderWidth: 1, borderColor: "#fed7aa", gap: 14 },
  locationSignalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locationSignalBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  locationSignalTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  locationSignalCopy: { marginTop: 4, color: "#6b7280", fontSize: 12, lineHeight: 18 },
  locationSignalFooter: { gap: 10 },
  locationSignalMeta: { color: "#9a3412", fontSize: 12, fontWeight: "700" },
  ordersScroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18 },
  ordersPageTitle: { marginBottom: 16, fontSize: 28, fontWeight: "900", color: "#111827", alignSelf: "center" },
  orderShowcaseCard: { marginBottom: 16, borderRadius: 30, padding: 16, overflow: "hidden" },
  orderShowcaseGreen: { backgroundColor: "#d9f99d" },
  orderShowcaseBlue: { backgroundColor: "#bfdbfe" },
  orderShowcaseHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  orderBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  orderBadgeText: { color: "#c2410c", fontSize: 16, fontWeight: "900" },
  orderShowcaseTitle: { color: "#111827", fontSize: 17, fontWeight: "900" },
  orderPriceChip: { borderRadius: 16, backgroundColor: "#ffffff", paddingHorizontal: 10, paddingVertical: 6 },
  orderPriceChipText: { color: "#111827", fontSize: 12, fontWeight: "800" },
  orderFoodHero: { alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  orderCourierRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  orderCourierAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" },
  orderCourierInitial: { color: "#111827", fontSize: 15, fontWeight: "900" },
  orderActions: { flexDirection: "row", gap: 10 },
  restaurantChoiceRow: { gap: 8, paddingBottom: 8, marginTop: 12 },
  restaurantChoice: { borderRadius: 16, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 9 },
  restaurantChoiceActive: { backgroundColor: "#fff7ed" },
  restaurantChoiceText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  restaurantChoiceTextActive: { color: "#c2410c" },
  toggleChip: { borderRadius: 16, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 10 },
  toggleChipActive: { backgroundColor: "#fff7ed" },
  toggleChipText: { color: "#6b7280", fontSize: 12, fontWeight: "700" },
  toggleChipTextActive: { color: "#c2410c" },
  darkShell: { backgroundColor: "#f9fafb" },
  darkBrowseScroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
  darkBrowseHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  darkLocationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  darkLocationTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  darkLocationMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  darkSearchWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 10, maxWidth: 180, borderWidth: 1, borderColor: "#ffedd5" },
  darkSearchInput: { flex: 1, color: "#111827", fontSize: 13 },
  restaurantGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 },
  restaurantGridCard: { width: "47%" },
  restaurantGridImageWrap: { height: 138, borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: "#fdba74", backgroundColor: "#fff7ed" },
  restaurantGridImage: { width: "100%", height: "100%" },
  restaurantGridImageFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff7ed" },
  closedOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.48)" },
  closedOverlayText: { color: "#ffffff", fontSize: 22, fontWeight: "700" },
  restaurantGridMeta: { marginTop: 8, position: "relative" },
  restaurantGridTitle: { color: "#111827", fontSize: 14, fontWeight: "700", paddingRight: 40 },
  restaurantGridInfoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  restaurantGridInfoText: { color: "#9a3412", fontSize: 12 },
  offerBadge: { position: "absolute", top: -2, right: 0, borderRadius: 8, backgroundColor: "#fde68a", paddingHorizontal: 8, paddingVertical: 3 },
  offerBadgeText: { color: "#92400e", fontSize: 11, fontWeight: "800" },
  restaurantMenuScroll: { paddingBottom: 120, backgroundColor: "#f9fafb" },
  restaurantHero: { height: 230, position: "relative", backgroundColor: "#fff7ed" },
  restaurantHeroImage: { width: "100%", height: "100%" },
  restaurantHeroFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffedd5" },
  restaurantHeroButton: { position: "absolute", top: 18, left: 16, width: 38, height: 38, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center" },
  ratingPill: { position: "absolute", top: 18, right: 16, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 12, paddingVertical: 9 },
  ratingPillText: { color: "#111827", fontSize: 13, fontWeight: "800" },
  restaurantTitleBand: { backgroundColor: "#ffffff", paddingHorizontal: 18, paddingVertical: 12 },
  restaurantTitleBandText: { color: "#111827", fontSize: 24, fontWeight: "700" },
  menuTabRow: { paddingHorizontal: 18, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: "#fed7aa" },
  menuTabTextActive: { color: "#c2410c", fontSize: 16, fontWeight: "700", borderBottomWidth: 2, borderBottomColor: "#f97316", paddingBottom: 10, alignSelf: "flex-start" },
  restaurantMenuSection: { paddingHorizontal: 18, paddingTop: 26 },
  restaurantMenuSectionTitle: { color: "#111827", fontSize: 16, fontWeight: "700", marginBottom: 16 },
  restaurantMenuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#ffedd5" },
  restaurantMenuItemTitle: { color: "#111827", fontSize: 18, fontWeight: "600" },
  restaurantMenuItemPrice: { color: "#c2410c", fontSize: 16, marginTop: 6 },
  customizationBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17,24,39,0.28)", justifyContent: "flex-end" },
  customizationSheet: { backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "84%", paddingTop: 18 },
  customizationSheetContent: { paddingHorizontal: 18, paddingBottom: 14 },
  customizationHeader: { paddingRight: 32, marginBottom: 18 },
  customizationTitle: { color: "#111827", fontSize: 24, fontWeight: "700" },
  customizationSubtitle: { color: "#c2410c", fontSize: 16, marginTop: 6 },
  customizationGroup: { marginBottom: 24 },
  customizationGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  customizationGroupTitle: { color: "#c2410c", fontSize: 22, fontWeight: "700" },
  requiredBadge: { borderRadius: 999, backgroundColor: "#fde68a", color: "#92400e", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "800" },
  customizationGroupCopy: { color: "#6b7280", fontSize: 14, marginBottom: 10 },
  customizationOptionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  optionSelector: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  optionSelectorActive: { borderColor: "#f97316", backgroundColor: "#fed7aa" },
  optionSelectorInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "transparent" },
  optionSelectorInnerActive: { backgroundColor: "#c2410c" },
  customizationOptionText: { flex: 1, color: "#111827", fontSize: 16 },
  customizationOptionPrice: { color: "#c2410c", fontSize: 16 },
  customizationNoteInput: { borderRadius: 18, backgroundColor: "#f9fafb", color: "#111827", minHeight: 54, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: "#ffedd5" },
  customizationFooter: { flexDirection: "row", alignItems: "center", gap: 14, borderTopWidth: 1, borderTopColor: "#ffedd5", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24, backgroundColor: "#ffffff" },
  customizationQuantityRow: { flexDirection: "row", alignItems: "center", gap: 16, flex: 1, backgroundColor: "#fff7ed", borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 },
  customizationQuantityButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  customizationQuantitySymbol: { color: "#c2410c", fontSize: 26, fontWeight: "400" },
  customizationQuantityValue: { color: "#c2410c", fontSize: 30, fontWeight: "300" },
  customizationAddButton: { minWidth: 112, borderRadius: 22, backgroundColor: "#f97316", paddingHorizontal: 24, paddingVertical: 14, alignItems: "center" },
  customizationAddButtonText: { color: "#ffffff", fontSize: 20, fontWeight: "700" },
  customizationClose: { position: "absolute", top: 14, right: 16, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#fff7ed" }
});
