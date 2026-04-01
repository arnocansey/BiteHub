import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Image, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiteHubSplash } from "./components/BiteHubSplash";

type Tab = "home" | "deliveries" | "earnings" | "profile";
type AuthMode = "signin" | "signup" | "forgot";
type ProfileScreen = "menu" | "notifications" | "help" | "privacy" | "tutorial" | "tutorial-general";
type HomeSection = "current" | "archive" | "past";
type Session = { accessToken: string; refreshToken: string; user: { role: string; firstName: string; lastName: string; email?: string } };
const sessionStorageKey = "bitehub_rider_session";
const riderProfileImageStorageKey = "bitehub_rider_profile_image";

const generalTutorialSlides = [
  {
    title: "Welcome",
    body: "Welcome to BiteHub Rider. Your app is the control room for going online, accepting trips, tracking deliveries, and managing earnings.",
    icon: "sparkles-outline",
    accent: "#f97316",
    background: "#fff7ed"
  },
  {
    title: "Accepting Orders",
    body: "Tap Accept to take an order. Check pickup and delivery address carefully.",
    icon: "cart-outline",
    accent: "#0f766e",
    background: "#d1fae5"
  },
  {
    title: "Pickup from Vendor",
    body: "Confirm the order ID, pickup items, and packaging before leaving the restaurant. If something is missing, contact support before transit starts.",
    icon: "storefront-outline",
    accent: "#2563eb",
    background: "#eff6ff"
  },
  {
    title: "Delivery to Customer",
    body: "Follow the drop-off instructions, call only when necessary, and complete the delivery with the right proof when the order reaches the customer.",
    icon: "location-outline",
    accent: "#7c3aed",
    background: "#f5f3ff"
  },
  {
    title: "Rider Standards",
    body: "Stay professional, communicate clearly, and handle every order carefully. Good service improves your reliability score and delivery opportunities.",
    icon: "ribbon-outline",
    accent: "#dc2626",
    background: "#fef2f2"
  },
  {
    title: "Safety First",
    body: "Never rush in unsafe traffic conditions. Use protective gear, secure the package properly, and pause deliveries if weather or road conditions are risky.",
    icon: "shield-checkmark-outline",
    accent: "#0891b2",
    background: "#ecfeff"
  },
  {
    title: "Payment & Earnings",
    body: "Track your completed trips and bonus earnings in the app. Make sure your payout details are accurate so settlements arrive without delays.",
    icon: "wallet-outline",
    accent: "#65a30d",
    background: "#f7fee7"
  },
  {
    title: "Customer Service",
    body: "Be respectful and calm, even when issues come up. A short, helpful update to the customer often prevents complaints and failed handoffs.",
    icon: "chatbubble-ellipses-outline",
    accent: "#ea580c",
    background: "#fff7ed"
  },
  {
    title: "Troubleshooting",
    body: "If a vendor is closed, an order is missing, or a customer is unreachable, use the support tools right away so the issue is logged and resolved properly.",
    icon: "build-outline",
    accent: "#475569",
    background: "#f8fafc"
  },
  {
    title: "Support Contacts",
    body: "Use Chat with Support or call support when you need urgent help. Keep important delivery details ready before reaching out.",
    icon: "call-outline",
    accent: "#0f766e",
    background: "#f0fdfa"
  },
  {
    title: "Rider Do's (More Orders & Bonuses)",
    body: "Stay online in strong demand periods, complete trips on time, and follow delivery instructions closely to improve access to more jobs and bonuses.",
    icon: "thumbs-up-outline",
    accent: "#15803d",
    background: "#f0fdf4"
  },
  {
    title: "Rider Don't (Blacklist & Block Risk!)",
    body: "Do not abandon orders, misuse cash, fake delivery status, harass customers, or go offline after accepting trips. Serious violations may lead to suspension.",
    icon: "warning-outline",
    accent: "#dc2626",
    background: "#fef2f2"
  },
  {
    title: "Final Note",
    body: "Great riders are consistent, safe, and reliable. Use BiteHub Rider as your work base and keep every trip moving with care and professionalism.",
    icon: "flag-outline",
    accent: "#7c3aed",
    background: "#faf5ff"
  }
] as const;

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
const riderLogo = require("./assets/bitehub-icon.png");
const tutorialCardWidth = Dimensions.get("window").width - 72;
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
  return [place.street, place.district, place.city, place.region].filter(Boolean).slice(0, 3).join(", ");
}

function buildMapRegion(points: Array<{ latitude?: number | null; longitude?: number | null }>) {
  const valid = points.filter(
    (point): point is { latitude: number; longitude: number } =>
      typeof point.latitude === "number" && typeof point.longitude === "number"
  );

  if (!valid.length) {
    return {
      latitude: 5.6037,
      longitude: -0.187,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08
    };
  }

  const latitudes = valid.map((point) => point.latitude);
  const longitudes = valid.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.8 || 0.02),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.8 || 0.02)
  };
}

function BikeCourierAnimation() {
  const travel = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const wheel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(travel, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(travel, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.timing(wheel, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [bob, travel, wheel]);

  const riderTranslateX = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [-22, 22]
  });
  const riderTranslateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6]
  });
  const wheelRotate = wheel.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  return (
    <View style={styles.bikeHero}>
      <Text style={styles.bikeHeroLabel}>On the move</Text>
      <Text style={styles.bikeHeroTitle}>Ride the next BiteHub drop.</Text>
      <View style={styles.bikeScene}>
        <View style={styles.bikeRoadGlow} />
        <View style={styles.bikeRoadLine} />
        <Animated.View
          style={[
            styles.bikeRiderWrap,
            {
              transform: [{ translateX: riderTranslateX }, { translateY: riderTranslateY }]
            }
          ]}
        >
          <View style={styles.riderBody}>
            <View style={styles.riderHead} />
            <View style={styles.riderTorso} />
            <View style={styles.deliveryBag} />
          </View>
          <View style={styles.bikeFrame}>
            <Animated.View style={[styles.bikeWheel, { transform: [{ rotate: wheelRotate }] }]}>
              <View style={styles.bikeWheelInner} />
            </Animated.View>
            <View style={styles.bikeBar} />
            <View style={styles.bikeSeat} />
            <Animated.View style={[styles.bikeWheel, { transform: [{ rotate: wheelRotate }] }]}>
              <View style={styles.bikeWheelInner} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [homeSection, setHomeSection] = useState<HomeSection>("current");
  const [profileScreen, setProfileScreen] = useState<ProfileScreen>("menu");
  const [generalTutorialIndex, setGeneralTutorialIndex] = useState(0);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [opsInsights, setOpsInsights] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [busyDeliveryId, setBusyDeliveryId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [refreshingHome, setRefreshingHome] = useState(false);
  const [profileImageOverride, setProfileImageOverride] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoutOpacity = useRef(new Animated.Value(0)).current;
  const logoutTranslateY = useRef(new Animated.Value(32)).current;
  const tutorialPagerRef = useRef<ScrollView | null>(null);

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

  async function loadRiderData(activeSession: Session) {
    const [profileData, jobsData, earningsData, opsData, notificationData] = await Promise.all([
      request<any>("/riders/profile", {}, activeSession),
      request<any[]>("/riders/jobs", {}, activeSession),
      request<any>("/riders/earnings", {}, activeSession),
      request<any>("/riders/incentives", {}, activeSession),
      request<any[]>("/notifications", {}, activeSession)
    ]);
    setProfile(profileData);
    setJobs(jobsData);
    setEarnings(earningsData);
    setOpsInsights(opsData);
    setNotifications(notificationData);
  }

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
        const savedProfileImage = await AsyncStorage.getItem(riderProfileImageStorageKey);
        setProfileImageOverride(savedProfileImage);
        await loadRiderData(restored);
      } catch (err) {
        await AsyncStorage.removeItem(sessionStorageKey);
        await AsyncStorage.removeItem(riderProfileImageStorageKey);
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
      if (payload.user?.role !== "RIDER") throw new Error("This account does not have rider access.");
      const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
      setSession(nextSession);
      await loadRiderData(nextSession);
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
      const payload = await request<any>("/auth/register/rider", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, phone: phone.trim() || undefined, vehicleType, email, password, role: "RIDER" })
      });
      const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
      setSession(nextSession);
      setAuthMode("signin");
      await loadRiderData(nextSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create rider account.");
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

  async function toggleAvailability() {
    if (!session || !profile) return;
    setError(null);
    try {
      await request("/riders/availability", { method: "PATCH", body: JSON.stringify({ isOnline: !profile.isOnline }) }, session);
      await loadRiderData(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update availability.");
    }
  }

  async function acceptJob(deliveryId: string) {
    if (!session) return;
    setBusyDeliveryId(deliveryId);
    setError(null);
    try {
      await request(`/riders/jobs/${deliveryId}/accept`, { method: "POST" }, session);
      await loadRiderData(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept this job.");
    } finally {
      setBusyDeliveryId(null);
    }
  }

  async function updateDeliveryStatus(deliveryId: string, status: "PICKED_UP" | "IN_TRANSIT" | "DELIVERED") {
    if (!session) return;
    setBusyDeliveryId(deliveryId);
    setError(null);
    try {
      await request(`/riders/jobs/${deliveryId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, session);
      if (status === "DELIVERED") {
        await request(`/riders/jobs/${deliveryId}/proof`, { method: "POST", body: JSON.stringify({ proofType: "NOTE", note: "Delivered successfully via rider app." }) }, session);
      }
      await loadRiderData(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update delivery status.");
    } finally {
      setBusyDeliveryId(null);
    }
  }

  async function refreshLocation() {
    setLocating(true);
    setLocationStatus(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationStatus("Enable location access to receive live routing context.");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const nextCoords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude
      };
      setLocationCoords(nextCoords);

      const places = await Location.reverseGeocodeAsync(nextCoords);
      setLocationLabel(buildLocationLabel(places) ?? "Live rider location ready");
      setLocationStatus("Live location is synced.");
    } catch (err) {
      setLocationStatus(err instanceof Error ? err.message : "Unable to load live location.");
    } finally {
      setLocating(false);
    }
  }

  async function openExternal(url: string, fallback: string) {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setError(fallback);
      return;
    }

    await Linking.openURL(url);
  }

  async function openSupportChat() {
    setError(null);
    await openExternal(
      "sms:0555405695?body=Hello%20BiteHub%20Support",
      "SMS chat is not available on this device. Call support at 0555405695."
    );
  }

  async function callSupport() {
    setError(null);
    await openExternal("tel:0555405695", "Phone calling is not available on this device.");
  }

  async function callCustomer(job: any) {
    const customerPhone = job?.order?.customer?.phone;
    if (!customerPhone) {
      setError("Customer phone number is not available for this trip.");
      return;
    }
    setError(null);
    await openExternal(`tel:${customerPhone}`, "Phone calling is not available on this device.");
  }

  async function openDropoffMap(job: any) {
    const address = job?.order?.deliveryAddress;
    if (!address) {
      setError("Dropoff location is not available yet.");
      return;
    }

    const label = encodeURIComponent(address.label ?? "Customer dropoff");
    const latitude = address.latitude;
    const longitude = address.longitude;

    if (typeof latitude === "number" && typeof longitude === "number") {
      const url =
        Platform.OS === "ios"
          ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
          : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
      setError(null);
      await openExternal(url, "Unable to open maps on this device.");
      return;
    }

    const query = encodeURIComponent(address.fullAddress ?? address.label ?? "Customer dropoff");
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    setError(null);
    await openExternal(webUrl, "Unable to open maps on this device.");
  }

  function openNotifications() {
    setProfileScreen("notifications");
  }

  function openHelp() {
    setProfileScreen("help");
  }

  function openPrivacyPolicy() {
    setProfileScreen("privacy");
  }

  function openTutorial() {
    setProfileScreen("tutorial");
  }

  function openGeneralTutorial() {
    setGeneralTutorialIndex(0);
    setProfileScreen("tutorial-general");
    requestAnimationFrame(() => {
      tutorialPagerRef.current?.scrollTo({ x: 0, animated: false });
    });
  }

  function openLogoutModal() {
    setShowLogoutModal(true);
    Animated.parallel([
      Animated.timing(logoutOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(logoutTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true
      })
    ]).start();
  }

  function closeLogoutModal() {
    Animated.parallel([
      Animated.timing(logoutOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(logoutTranslateY, {
        toValue: 32,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      })
    ]).start(() => setShowLogoutModal(false));
  }

  function confirmSignOut() {
    closeLogoutModal();
    setError(null);
    setProfileImageOverride(null);
    void AsyncStorage.removeItem(riderProfileImageStorageKey);
    setSession(null);
    setActiveTab("home");
    setProfileScreen("menu");
    setAuthMode("signin");
  }

  function signOut() {
    openLogoutModal();
  }

  async function addProfilePicture() {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Allow photo library access to add a rider picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const nextImage = result.assets[0].uri;
      setProfileImageOverride(nextImage);
      await AsyncStorage.setItem(riderProfileImageStorageKey, nextImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add rider picture.");
    }
  }

  function goToGeneralSlide(index: number) {
    const clampedIndex = Math.max(0, Math.min(index, generalTutorialSlides.length - 1));
    setGeneralTutorialIndex(clampedIndex);
    tutorialPagerRef.current?.scrollTo({ x: tutorialCardWidth * clampedIndex, animated: true });
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

  async function refreshHomeFeed() {
    if (!session) return;
    setRefreshingHome(true);
    setError(null);
    try {
      await Promise.all([loadRiderData(session), refreshLocation()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh rider data.");
    } finally {
      setRefreshingHome(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadRiderData(session).catch((err) => setError(err instanceof Error ? err.message : "Unable to refresh rider data."));
    void refreshLocation();
  }, [session]);

  useEffect(() => {
    if (!session || !locationCoords || !profile?.isOnline) return;

    void request(
      "/riders/location",
      {
        method: "PATCH",
        body: JSON.stringify({
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude
        })
      },
      session
    ).catch((err) => setLocationStatus(err instanceof Error ? err.message : "Unable to sync rider location."));
  }, [locationCoords, profile?.isOnline, session]);

  useEffect(() => {
    if (!session || !profile?.isOnline) return;

    const timer = setInterval(() => {
      void refreshLocation();
    }, 20000);

    return () => clearInterval(timer);
  }, [profile?.isOnline, session]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2300);
    return () => clearTimeout(timer);
  }, []);

  const activeJobs = jobs.filter((job) => job.status !== "DELIVERED" && job.status !== "FAILED");
  const completedJobs = jobs.filter((job) => job.status === "DELIVERED" || job.status === "FAILED");
  const homeTrips =
    homeSection === "current" ? activeJobs : homeSection === "archive" ? jobs : completedJobs;
  const currentTripCount = activeJobs.length;
  const archiveTripCount = jobs.length;
  const pastTripCount = completedJobs.length;
  const activeMapJob =
    activeJobs.find((job) => job.riderProfileId && ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(job.status)) ?? null;
  const activeMapRegion = buildMapRegion([
    { latitude: locationCoords?.latitude, longitude: locationCoords?.longitude },
    {
      latitude: activeMapJob?.order?.deliveryAddress?.latitude,
      longitude: activeMapJob?.order?.deliveryAddress?.longitude
    }
  ]);
  const unreadNotifications = notifications.filter((item) => !item.isRead).length;
  const currentGeneralSlide = generalTutorialSlides[generalTutorialIndex];
  const fallbackFirstName = session?.user?.firstName ?? "Rider";
  const fallbackLastName = session?.user?.lastName ?? "";
  const riderProfileImage = profileImageOverride ?? profile?.user?.profileImageUrl ?? profile?.user?.avatarUrl ?? null;
  const riderInitials = `${profile?.user?.firstName?.[0] ?? fallbackFirstName[0] ?? "R"}${profile?.user?.lastName?.[0] ?? fallbackLastName[0] ?? ""}`.toUpperCase();
  const headerTitle =
    activeTab === "home"
      ? `${profile?.user?.firstName ?? fallbackFirstName} ${profile?.user?.lastName ?? fallbackLastName}`.trim()
      : activeTab === "deliveries"
        ? "Deliveries"
        : activeTab === "earnings"
          ? "Earnings"
          : "";
  const headerSubtitle =
    activeTab === "home"
      ? profile?.vehicleType ?? "Rider profile"
      : activeTab === "deliveries"
        ? "Track pickup and dropoff progress"
        : activeTab === "earnings"
          ? "Performance and payout overview"
          : "";

  if (showSplash || !sessionReady) {
    return <BiteHubSplash accentColor="#cc0000" label="BiteHub Rider" logoSource={riderLogo} subtitle="Own every drop with speed." />;
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.authScrollContent}>
        <View style={styles.auth}>
          <Image source={riderLogo} style={styles.authLogo} resizeMode="contain" />
          <Text style={styles.heroTitle}>Stay online and keep every dropoff moving.</Text>
          <Text style={styles.body}>Create a rider account, recover access, or sign in with a real profile.</Text>
          <View style={styles.authCard}>
            <Text style={styles.label}>RIDER APP</Text>
            <Text style={styles.cardTitle}>{authMode === "signin" ? "Sign in with a real rider account." : authMode === "signup" ? "Create your rider profile." : "Reset your rider password."}</Text>
            {authMode === "signup" ? (
              <>
                <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#9ca3af" style={styles.input} />
                <TextInput value={vehicleType} onChangeText={setVehicleType} placeholder="Vehicle type" placeholderTextColor="#9ca3af" style={styles.input} />
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
      {activeTab !== "profile" ? (
        <View style={styles.header}>
          {activeTab === "home" ? (
            <View style={styles.profileRow}>
              {riderProfileImage ? (
                <Image source={{ uri: riderProfileImage }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{riderInitials}</Text>
                </View>
              )}
              <View>
                <Text style={styles.title}>{headerTitle}</Text>
                <Text style={styles.subtle}>{headerSubtitle}</Text>
              </View>
            </View>
          ) : (
            <View>
              {headerTitle ? <Text style={styles.title}>{headerTitle}</Text> : null}
              {headerSubtitle ? <Text style={styles.subtle}>{headerSubtitle}</Text> : null}
            </View>
          )}
          {activeTab === "home" ? (
            <Pressable style={[styles.onlineChip, profile?.isOnline ? styles.onlineChipActive : styles.onlineChipMuted]} onPress={() => void toggleAvailability()}>
              <Text style={[styles.onlineChipText, profile?.isOnline ? styles.onlineChipTextActive : styles.onlineChipTextMuted]}>{profile?.isOnline ? "Online" : "Offline"}</Text>
            </Pressable>
          ) : <View />}
        </View>
      ) : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, activeTab === "profile" ? styles.profileScroll : null]}
        refreshControl={
          activeTab === "home" ? (
            <RefreshControl
              refreshing={refreshingHome}
              onRefresh={() => void refreshHomeFeed()}
              tintColor="#f97316"
              colors={["#f97316"]}
            />
          ) : undefined
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {activeTab === "home" ? <>
          <View style={styles.tripFeatureShell}>
            <View style={styles.tripHub}>
              <Text style={styles.tripHubLabel}>Trip center</Text>
              <Text style={styles.tripHubTitle}>Keep every delivery in view.</Text>
              <View style={styles.tripSectionTabs}>
                {[
                  { id: "current", label: "Current trips", count: currentTripCount },
                  { id: "archive", label: "Archive", count: archiveTripCount },
                  { id: "past", label: "Past trips", count: pastTripCount }
                ].map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.tripSectionTab, homeSection === item.id && styles.tripSectionTabActive]}
                    onPress={() => setHomeSection(item.id as HomeSection)}
                  >
                    <Text style={[styles.tripSectionTabCount, homeSection === item.id && styles.tripSectionTabCountActive]}>
                      {item.count}
                    </Text>
                    <Text style={[styles.tripSectionTabText, homeSection === item.id && styles.tripSectionTabTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {homeSection === "current" && activeMapJob ? (
                <View style={styles.riderMapCard}>
                  <Text style={styles.cardTitle}>Live route map</Text>
                  <Text style={styles.cardMeta}>Track your current position against the customer dropoff.</Text>
                  <View style={styles.riderMapWrap}>
                    <MapView style={styles.riderMap} initialRegion={activeMapRegion} region={activeMapRegion}>
                      {locationCoords ? <Marker coordinate={{ latitude: locationCoords.latitude, longitude: locationCoords.longitude }} title="You" pinColor="#111827" /> : null}
                      {typeof activeMapJob.order?.deliveryAddress?.latitude === "number" && typeof activeMapJob.order?.deliveryAddress?.longitude === "number" ? <Marker coordinate={{ latitude: activeMapJob.order.deliveryAddress.latitude, longitude: activeMapJob.order.deliveryAddress.longitude }} title={activeMapJob.order?.deliveryAddress?.label ?? "Dropoff"} pinColor="#f97316" /> : null}
                    </MapView>
                  </View>
                </View>
              ) : null}
              <View style={styles.tripSectionBody}>
                {homeTrips.length ? homeTrips.map((job) => <View key={job.id} style={styles.tripCard}><View style={styles.panelHeader}><View style={styles.tripCardHeaderCopy}><Text style={styles.cardTitle}>{job.order?.restaurant?.name ?? "Restaurant"}</Text><Text style={styles.tripCode}>{job.order?.id ?? job.id}</Text></View><Text style={styles.statusText}>{String(job.status).replaceAll("_", " ")}</Text></View><Text style={styles.routeTitle}>{job.order?.deliveryAddress?.label ?? "Dropoff location"}</Text><Text style={styles.cardMeta}>{job.order?.deliveryAddress?.fullAddress ?? "No delivery address available"}</Text>{job.order?.customer ? <Text style={styles.cardMeta}>Customer: {job.order.customer.firstName ?? "Customer"} {job.order.customer.lastName ?? ""}</Text> : null}<View style={styles.tripMetaRow}><View style={styles.tripMetaPill}><Ionicons name="navigate-outline" size={14} color="#c2410c" /><Text style={styles.tripMetaText}>{job.order?.deliveryAddress?.label ?? "Customer drop"}</Text></View><View style={styles.tripMetaPill}><Ionicons name="time-outline" size={14} color="#c2410c" /><Text style={styles.tripMetaText}>{job.updatedAt ? new Date(job.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}</Text></View></View>{homeSection === "current" && job.riderProfileId ? <View style={styles.tripQuickActions}><Pressable style={styles.tripQuickButton} onPress={() => void openDropoffMap(job)}><Ionicons name="map-outline" size={15} color="#c2410c" /><Text style={styles.tripQuickButtonText}>Map</Text></Pressable><Pressable style={styles.tripQuickButton} onPress={() => void callCustomer(job)}><Ionicons name="call-outline" size={15} color="#c2410c" /><Text style={styles.tripQuickButtonText}>Call</Text></Pressable></View> : null}<View style={styles.deliveryActions}>{homeSection === "current" && !job.riderProfileId ? <Pressable style={styles.primaryAction} onPress={() => void acceptJob(job.id)}><Text style={styles.primaryActionText}>{busyDeliveryId === job.id ? "Working..." : "Accept Job"}</Text></Pressable> : null}{homeSection === "current" && job.riderProfileId && job.status === "ASSIGNED" ? <Pressable style={styles.primaryAction} onPress={() => void updateDeliveryStatus(job.id, "PICKED_UP")}><Text style={styles.primaryActionText}>{busyDeliveryId === job.id ? "Working..." : "Picked Up"}</Text></Pressable> : null}{homeSection === "current" && job.riderProfileId && job.status === "PICKED_UP" ? <Pressable style={styles.primaryAction} onPress={() => void updateDeliveryStatus(job.id, "IN_TRANSIT")}><Text style={styles.primaryActionText}>{busyDeliveryId === job.id ? "Working..." : "Start Transit"}</Text></Pressable> : null}{homeSection === "current" && job.riderProfileId && job.status === "IN_TRANSIT" ? <Pressable style={styles.primaryAction} onPress={() => void updateDeliveryStatus(job.id, "DELIVERED")}><Text style={styles.primaryActionText}>{busyDeliveryId === job.id ? "Working..." : "Deliver + Proof"}</Text></Pressable> : null}</View></View>) : <View style={styles.tripEmpty}><Text style={styles.cardTitle}>{homeSection === "current" ? "No current trips" : homeSection === "archive" ? "Archive is empty" : "No past trips yet"}</Text><Text style={styles.cardMeta}>{homeSection === "current" ? "Go online and accept a delivery to see it here." : homeSection === "archive" ? "Every delivery assigned to you will be kept here for quick review." : "Completed and closed deliveries will show here once you finish them."}</Text></View>}
              </View>
            </View>
            {homeSection === "current" ? <BikeCourierAnimation /> : null}
          </View>
        </> : null}
        {activeTab === "deliveries" ? jobs.map((job) => <View key={job.id} style={styles.panel}><View style={styles.panelHeader}><Text style={styles.cardTitle}>{job.order?.id ?? job.id}</Text><Text style={styles.statusText}>{String(job.status).replaceAll("_", " ")}</Text></View><Text style={styles.routeTitle}>{job.order?.restaurant?.name ?? "Restaurant"} to {job.order?.deliveryAddress?.label ?? "Customer"}</Text><Text style={styles.cardMeta}>{job.order?.deliveryAddress?.fullAddress ?? "No address provided"}</Text></View>) : null}
        {activeTab === "earnings" ? <>
          <View style={styles.heroCard}><Text style={styles.heroLabel}>Estimated Earnings</Text><Text style={styles.heroValue}>{formatMoney(Number(earnings?.estimatedEarnings ?? 0))}</Text><Text style={styles.heroSub}>{earnings?.completedDeliveries ?? 0} completed deliveries</Text></View>
          <View style={styles.panel}><Text style={styles.cardTitle}>Delivery Summary</Text><Text style={styles.cardMeta}>Completed: {earnings?.completedDeliveries ?? 0}</Text><Text style={styles.cardMeta}>Open jobs: {activeJobs.length}</Text></View>
          <View style={styles.panel}><Text style={styles.cardTitle}>Live incentives</Text>{(opsInsights?.incentives ?? []).length ? (opsInsights?.incentives ?? []).map((incentive: any) => <View key={incentive.id} style={styles.subRow}><View style={{ flex: 1 }}><Text style={styles.routeTitle}>{incentive.title}</Text><Text style={styles.cardMeta}>{incentive.description}</Text></View><Text style={styles.statusText}>{formatMoney(Number(incentive.bonusAmount ?? 0))}</Text></View>) : <Text style={styles.cardMeta}>No active incentives right now.</Text>}</View>
          <View style={styles.panel}><Text style={styles.cardTitle}>Hot zones</Text>{(opsInsights?.heatmap ?? []).slice(0, 4).map((zone: any) => <View key={zone.id} style={styles.subRow}><View style={{ flex: 1 }}><Text style={styles.routeTitle}>{zone.zoneLabel}</Text><Text style={styles.cardMeta}>Demand {zone.demandLevel}/10 | Supply {zone.supplyLevel}/10 | ETA {zone.averageEtaMinutes} min</Text></View><Text style={styles.statusText}>{zone.activeOrders} jobs</Text></View>)}</View>
        </> : null}
        {activeTab === "profile" ? <>
          {profileScreen === "menu" ? (
            <View style={styles.panel}>
              <View style={styles.profileHeroCard}>
                {riderProfileImage ? (
                  <Image source={{ uri: riderProfileImage }} style={styles.profileHeroAvatar} resizeMode="cover" />
                ) : (
                  <View style={styles.profileHeroAvatarPlaceholder}>
                    <Text style={styles.profileHeroAvatarText}>{riderInitials}</Text>
                  </View>
                )}
                <Text style={styles.profileHeroName}>
                  {profile?.user?.firstName ?? session.user.firstName} {profile?.user?.lastName ?? session.user.lastName}
                </Text>
                <Text style={styles.profileHeroEmail}>{profile?.user?.email ?? session.user.email ?? email}</Text>
                <Pressable style={styles.addPictureButton} onPress={() => void addProfilePicture()}>
                  <Ionicons name="image-outline" size={16} color="#c2410c" />
                  <Text style={styles.addPictureButtonText}>{riderProfileImage ? "Change picture" : "Add picture"}</Text>
                </Pressable>
              </View>
              <View style={styles.profileMenu}>
                {[
                  { key: "chat", label: "Chat with Support", icon: "chatbubble-ellipses-outline", action: openSupportChat },
                  { key: "call", label: "Call Support", icon: "call-outline", action: callSupport, meta: "0555405695" },
                  { key: "notifications", label: "Notifications", icon: "notifications-outline", action: openNotifications, meta: unreadNotifications ? `${unreadNotifications} unread` : "All caught up" },
                  { key: "help", label: "Help", icon: "help-circle-outline", action: openHelp },
                  { key: "privacy", label: "Privacy Policy", icon: "shield-checkmark-outline", action: openPrivacyPolicy },
                  { key: "tutorial", label: "Tutorial", icon: "school-outline", action: openTutorial },
                  { key: "signout", label: "Sign Out", icon: "log-out-outline", action: signOut, tone: "danger" as const }
                ].map((item) => (
                  <Pressable key={item.key} style={styles.profileMenuItem} onPress={() => void item.action()}>
                    <View style={[styles.profileMenuIcon, item.tone === "danger" ? styles.profileMenuIconDanger : null]}>
                      <Ionicons name={item.icon as any} size={18} color={item.tone === "danger" ? "#dc2626" : "#f97316"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.profileMenuLabel, item.tone === "danger" ? styles.profileMenuLabelDanger : null]}>{item.label}</Text>
                      {item.meta ? <Text style={styles.profileMenuMeta}>{item.meta}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {profileScreen === "notifications" ? (
            <View style={styles.panel}>
              <View style={styles.profileSubHeader}>
                <Pressable style={styles.smallBackButton} onPress={() => setProfileScreen("menu")}>
                  <Text style={styles.smallBackButtonText}>Back</Text>
                </Pressable>
                <Text style={styles.cardTitle}>Notifications</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={() => void markAllNotificationsRead()}>
                  <Text style={styles.secondaryButtonText}>Mark all read</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => void clearReadNotifications()}>
                  <Text style={styles.secondaryButtonText}>Clear read</Text>
                </Pressable>
              </View>
              {notifications.length ? notifications.map((item) => (
                <Pressable key={item.id} style={styles.notificationCard} onPress={() => void markNotificationRead(item.id)}>
                  <View style={[styles.profileMenuIcon, item.isRead ? styles.notificationIconRead : null]}>
                    <Ionicons name={item.isRead ? "mail-open-outline" : "notifications-outline"} size={18} color={item.isRead ? "#6b7280" : "#f97316"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileMenuLabel}>{item.title}</Text>
                    <Text style={styles.profileMenuMeta}>{item.body}</Text>
                  </View>
                </Pressable>
              )) : <Text style={styles.cardMeta}>No notifications yet.</Text>}
            </View>
          ) : null}

          {profileScreen === "help" ? (
            <View style={styles.panel}>
              <View style={styles.profileSubHeader}>
                <Pressable style={styles.smallBackButton} onPress={() => setProfileScreen("menu")}>
                  <Text style={styles.smallBackButtonText}>Back</Text>
                </Pressable>
                <Text style={styles.cardTitle}>Help</Text>
              </View>
              <Text style={styles.cardMeta}>Need help with a delivery, payout, or route issue?</Text>
              <Text style={styles.helpBullet}>Chat with support for quick assistance.</Text>
              <Text style={styles.helpBullet}>Call support on 0555405695 for urgent rider help.</Text>
              <Text style={styles.helpBullet}>Stay online only when you are available to take jobs.</Text>
            </View>
          ) : null}

          {profileScreen === "privacy" ? (
            <View style={styles.panel}>
              <View style={styles.profileSubHeader}>
                <Pressable style={styles.smallBackButton} onPress={() => setProfileScreen("menu")}>
                  <Text style={styles.smallBackButtonText}>Back</Text>
                </Pressable>
                <Text style={styles.cardTitle}>Privacy Policy</Text>
              </View>
              <Text style={styles.cardMeta}>BiteHub uses your location only for delivery operations, route guidance, ETA prediction, and customer visibility during active orders.</Text>
              <Text style={styles.helpBullet}>Your phone number is used for support and delivery communication.</Text>
              <Text style={styles.helpBullet}>Your location is updated while you are online and active in the rider workspace.</Text>
              <Text style={styles.helpBullet}>Support records and proof-of-delivery data help resolve delivery disputes.</Text>
            </View>
          ) : null}

          {profileScreen === "tutorial" ? (
            <View style={styles.panel}>
              <View style={styles.profileSubHeader}>
                <Pressable style={styles.smallBackButton} onPress={() => setProfileScreen("menu")}>
                  <Ionicons name="arrow-back" size={16} color="#374151" />
                </Pressable>
                <Text style={styles.tutorialTitle}>Tutorial</Text>
              </View>
              <Text style={styles.cardMeta}>Learn the core BiteHub rider workflows before you head out.</Text>
              <View style={styles.tutorialGrid}>
                {[
                  { key: "general", label: "General", icon: "compass-outline", color: "#fff1f2", iconColor: "#e11d48", action: openGeneralTutorial },
                  { key: "online", label: "Online & Availability", icon: "radio-outline", color: "#eff6ff", iconColor: "#2563eb" },
                  { key: "orders", label: "Orders", icon: "receipt-outline", color: "#fef3c7", iconColor: "#d97706" },
                  { key: "settlement", label: "Settlement", icon: "wallet-outline", color: "#ecfccb", iconColor: "#65a30d" },
                  { key: "cashout", label: "Cashout", icon: "cash-outline", color: "#ecfeff", iconColor: "#0891b2" }
                ].map((item) => (
                  <Pressable key={item.key} style={[styles.tutorialCard, { backgroundColor: item.color }]} onPress={item.action}>
                    <View style={styles.tutorialIconWrap}>
                      <Ionicons name={item.icon as any} size={30} color={item.iconColor} />
                    </View>
                    <Text style={styles.tutorialCardLabel}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {profileScreen === "tutorial-general" ? (
            <View style={styles.panel}>
              <View style={styles.profileSubHeader}>
                <Pressable style={styles.smallBackButton} onPress={() => setProfileScreen("tutorial")}>
                  <Ionicons name="arrow-back" size={16} color="#374151" />
                </Pressable>
                <Text style={styles.tutorialTitle}>General Overview</Text>
              </View>
              <Text style={styles.cardMeta}>
                {generalTutorialIndex + 1} of {generalTutorialSlides.length}
              </Text>
              <ScrollView
                ref={tutorialPagerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                contentContainerStyle={styles.generalTutorialPager}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / tutorialCardWidth);
                  setGeneralTutorialIndex(nextIndex);
                }}
              >
                {generalTutorialSlides.map((slide) => (
                  <View
                    key={slide.title}
                    style={[
                      styles.generalTutorialCard,
                      { backgroundColor: slide.background }
                    ]}
                  >
                    <View style={styles.generalTutorialWaves}>
                      <View
                        style={[
                          styles.generalTutorialWaveLarge,
                          { backgroundColor: `${slide.accent}20` }
                        ]}
                      />
                      <View
                        style={[
                          styles.generalTutorialWaveSmall,
                          { backgroundColor: `${slide.accent}12` }
                        ]}
                      />
                    </View>
                    <Text style={styles.generalTutorialEyebrow}>General Overview</Text>
                    <View style={[styles.generalTutorialIconWrap, { backgroundColor: `${slide.accent}18` }]}>
                      <Ionicons name={slide.icon as any} size={42} color={slide.accent} />
                    </View>
                    <Text style={styles.generalTutorialStep}>{slide.title}</Text>
                    <Text style={styles.generalTutorialBody}>{slide.body}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.generalTutorialDots}>
                {generalTutorialSlides.map((slide, index) => (
                  <View
                    key={slide.title}
                    style={[styles.generalTutorialDot, index === generalTutorialIndex ? styles.generalTutorialDotActive : null]}
                  />
                ))}
              </View>
              <View style={styles.generalTutorialActions}>
                <Pressable
                  style={[styles.logoutSecondaryButton, generalTutorialIndex === 0 ? styles.disabledAction : null]}
                  onPress={() => goToGeneralSlide(generalTutorialIndex - 1)}
                  disabled={generalTutorialIndex === 0}
                >
                  <Text style={styles.logoutSecondaryText}>Previous</Text>
                </Pressable>
                <Pressable
                  style={styles.logoutPrimaryButton}
                  onPress={() => goToGeneralSlide(generalTutorialIndex === generalTutorialSlides.length - 1 ? 0 : generalTutorialIndex + 1)}
                >
                  <Text style={styles.logoutPrimaryText}>
                    {generalTutorialIndex === generalTutorialSlides.length - 1 ? "Start again" : "Next"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </> : null}
      </ScrollView>
      <View style={styles.nav}>{[
        { id: "home", label: "Home", icon: "navigate-outline", activeIcon: "navigate" },
        { id: "deliveries", label: "Deliveries", icon: "cube-outline", activeIcon: "cube" },
        { id: "earnings", label: "Earnings", icon: "wallet-outline", activeIcon: "wallet" },
        { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" }
      ].map((item) => <Pressable key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id as Tab)}><Ionicons name={activeTab === item.id ? item.activeIcon as any : item.icon as any} size={18} color={activeTab === item.id ? "#f97316" : "#9ca3af"} /><Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>{item.label}</Text></Pressable>)}</View>
      {showLogoutModal ? (
        <Animated.View style={[styles.logoutOverlay, { opacity: logoutOpacity }]}>
          <Pressable style={styles.logoutBackdrop} onPress={closeLogoutModal} />
          <Animated.View style={[styles.logoutCard, { transform: [{ translateY: logoutTranslateY }] }]}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={24} color="#ffffff" />
            </View>
            <Text style={styles.logoutTitle}>Log out of BiteHub Rider?</Text>
            <Text style={styles.logoutCopy}>You can sign back in anytime to pick up new trips and keep deliveries moving.</Text>
            <View style={styles.logoutActions}>
              <Pressable style={styles.logoutSecondaryButton} onPress={closeLogoutModal}>
                <Text style={styles.logoutSecondaryText}>No</Text>
              </Pressable>
              <Pressable style={styles.logoutPrimaryButton} onPress={confirmSignOut}>
                <Text style={styles.logoutPrimaryText}>Yes, log out</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  authScrollContent: { flexGrow: 1 },
  auth: { flexGrow: 1, justifyContent: "flex-start", paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  authLogo: { width: 152, height: 152, marginBottom: 16, alignSelf: "center" },
  heroTitle: { marginTop: 8, fontSize: 34, lineHeight: 40, fontWeight: "800", color: "#111827" },
  body: { marginTop: 12, fontSize: 16, lineHeight: 24, color: "#6b7280" },
  authCard: { marginTop: 28, borderRadius: 28, backgroundColor: "#ffffff", padding: 22 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: "#f97316", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  input: { marginTop: 12, borderRadius: 18, backgroundColor: "#f3f4f6", paddingHorizontal: 14, paddingVertical: 12, color: "#111827" },
  error: { marginTop: 10, color: "#e11d48", fontSize: 13 },
  success: { marginTop: 10, color: "#15803d", fontSize: 13 },
  primaryButton: { marginTop: 18, borderRadius: 20, backgroundColor: "#f97316", paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  secondaryButton: { marginTop: 12, borderRadius: 20, borderWidth: 1, borderColor: "#fdba74", paddingVertical: 14, alignItems: "center" },
  secondaryButtonText: { color: "#c2410c", fontSize: 14, fontWeight: "800" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  authLinks: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 18 },
  authLink: { color: "#9a3412", fontSize: 13, fontWeight: "700" },
  authLinkActive: { color: "#f97316" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff7ed" },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fdba74" },
  avatarPlaceholderText: { color: "#c2410c", fontSize: 18, fontWeight: "800" },
  profileMenu: { marginTop: 14, gap: 10 },
  profileHeroCard: { alignItems: "center", borderRadius: 24, backgroundColor: "#f9fafb", paddingHorizontal: 18, paddingVertical: 20 },
  profileHeroAvatar: { width: 86, height: 86, borderRadius: 43 },
  profileHeroAvatarPlaceholder: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fdba74" },
  profileHeroAvatarText: { color: "#c2410c", fontSize: 28, fontWeight: "900" },
  profileHeroName: { marginTop: 14, fontSize: 20, fontWeight: "900", color: "#111827", textAlign: "center" },
  profileHeroEmail: { marginTop: 6, fontSize: 13, lineHeight: 18, color: "#6b7280", textAlign: "center" },
  addPictureButton: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, backgroundColor: "#fff7ed", paddingHorizontal: 14, paddingVertical: 10 },
  addPictureButtonText: { fontSize: 13, fontWeight: "800", color: "#c2410c" },
  profileMenuItem: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 22, backgroundColor: "#f9fafb", paddingHorizontal: 14, paddingVertical: 14 },
  profileMenuIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center" },
  profileMenuIconDanger: { backgroundColor: "#fef2f2" },
  notificationIconRead: { backgroundColor: "#f3f4f6" },
  profileMenuLabel: { fontSize: 14, fontWeight: "800", color: "#111827" },
  profileMenuLabelDanger: { color: "#dc2626" },
  profileMenuMeta: { marginTop: 3, fontSize: 12, color: "#6b7280" },
  profileSubHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  smallBackButton: { minWidth: 56, height: 36, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  smallBackButtonText: { fontSize: 12, color: "#374151", fontWeight: "700" },
  notificationCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 22, backgroundColor: "#f9fafb", paddingHorizontal: 14, paddingVertical: 14, marginTop: 10 },
  helpBullet: { marginTop: 10, fontSize: 13, lineHeight: 20, color: "#374151" },
  tutorialTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  tutorialGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  tutorialCard: { width: "47.5%", minHeight: 138, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  tutorialIconWrap: { width: 68, height: 68, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.72)", alignItems: "center", justifyContent: "center" },
  tutorialCardLabel: { marginTop: 14, fontSize: 13, lineHeight: 18, fontWeight: "800", color: "#111827", textAlign: "center" },
  generalTutorialPager: { paddingTop: 18 },
  generalTutorialCard: { width: tutorialCardWidth, borderRadius: 26, paddingHorizontal: 18, paddingVertical: 22, minHeight: 320, overflow: "hidden", alignItems: "center" },
  generalTutorialWaves: { ...StyleSheet.absoluteFillObject },
  generalTutorialWaveLarge: { position: "absolute", width: 220, height: 220, borderRadius: 110, top: -70, right: -60 },
  generalTutorialWaveSmall: { position: "absolute", width: 160, height: 160, borderRadius: 80, bottom: -38, left: -34 },
  generalTutorialEyebrow: { marginTop: 4, fontSize: 15, lineHeight: 20, fontWeight: "800", color: "#111827", textAlign: "center" },
  generalTutorialIconWrap: { width: 108, height: 108, borderRadius: 34, alignItems: "center", justifyContent: "center", marginTop: 26 },
  generalTutorialStep: { marginTop: 24, fontSize: 28, lineHeight: 34, fontWeight: "900", color: "#111827", textAlign: "center" },
  generalTutorialBody: { marginTop: 12, fontSize: 15, lineHeight: 23, fontWeight: "600", color: "#4b5563", textAlign: "center" },
  generalTutorialDots: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "center" },
  generalTutorialDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fed7aa" },
  generalTutorialDotActive: { width: 24, backgroundColor: "#f97316" },
  generalTutorialActions: { flexDirection: "row", gap: 12, marginTop: 22 },
  disabledAction: { opacity: 0.45 },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  subtle: { marginTop: 4, fontSize: 12, color: "#6b7280" },
  onlineChip: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  onlineChipActive: { backgroundColor: "#dcfce7" },
  onlineChipMuted: { backgroundColor: "#f3f4f6" },
  onlineChipText: { fontSize: 12, fontWeight: "800" },
  onlineChipTextActive: { color: "#15803d" },
  onlineChipTextMuted: { color: "#6b7280" },
  scroll: { paddingHorizontal: 20, paddingBottom: 22 },
  profileScroll: { paddingTop: 12, flexGrow: 1 },
  tripFeatureShell: { marginBottom: 14, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.72)", padding: 16, shadowColor: "#111827", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  bikeHero: { marginTop: 12, borderRadius: 24, backgroundColor: "rgba(255,247,237,0.92)", padding: 18, overflow: "hidden" },
  bikeHeroLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: "#c2410c" },
  bikeHeroTitle: { marginTop: 8, fontSize: 20, lineHeight: 26, fontWeight: "800", color: "#111827" },
  bikeScene: { height: 170, marginTop: 12, justifyContent: "flex-end" },
  bikeRoadGlow: { position: "absolute", left: 10, right: 10, top: 18, bottom: 18, borderRadius: 28, backgroundColor: "rgba(251,146,60,0.12)" },
  bikeRoadLine: { position: "absolute", left: 0, right: 0, bottom: 26, height: 5, borderRadius: 999, backgroundColor: "#fdba74" },
  bikeRiderWrap: { alignSelf: "center", alignItems: "center", justifyContent: "flex-end" },
  riderBody: { position: "absolute", top: -30, left: 42, width: 52, height: 40 },
  riderHead: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#111827", marginLeft: 14 },
  riderTorso: { width: 24, height: 16, borderRadius: 8, backgroundColor: "#f97316", marginTop: 2, marginLeft: 10 },
  deliveryBag: { position: "absolute", right: 0, top: 14, width: 16, height: 14, borderRadius: 4, backgroundColor: "#dc2626" },
  bikeFrame: { flexDirection: "row", alignItems: "center", gap: 10 },
  bikeWheel: { width: 42, height: 42, borderRadius: 21, borderWidth: 4, borderColor: "#111827", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  bikeWheelInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f97316" },
  bikeBar: { width: 36, height: 4, borderRadius: 999, backgroundColor: "#111827", transform: [{ rotate: "-12deg" }] },
  bikeSeat: { position: "absolute", top: -10, left: 56, width: 28, height: 4, borderRadius: 999, backgroundColor: "#111827" },
  tripHub: { borderRadius: 24, backgroundColor: "rgba(255,255,255,0.38)", padding: 2 },
  tripHubLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: "#9ca3af" },
  tripHubTitle: { marginTop: 8, fontSize: 22, lineHeight: 28, fontWeight: "900", color: "#111827" },
  tripHubStats: { flexDirection: "row", gap: 10, marginTop: 14 },
  tripHubStat: { flex: 1, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.8)", paddingVertical: 12, alignItems: "center" },
  tripHubStatValue: { fontSize: 20, fontWeight: "900", color: "#111827" },
  tripHubStatLabel: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "#6b7280" },
  tripSectionTabs: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 14 },
  tripSectionTab: { flex: 1, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.76)", paddingVertical: 12, paddingHorizontal: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  tripSectionTabActive: { backgroundColor: "#f97316" },
  tripSectionTabCount: { fontSize: 16, fontWeight: "900", color: "#111827" },
  tripSectionTabCountActive: { color: "#ffffff" },
  tripSectionTabText: { fontSize: 12, fontWeight: "800", color: "#6b7280", textAlign: "center" },
  tripSectionTabTextActive: { color: "#ffffff" },
  tripSectionBody: { gap: 12 },
  tripCard: { borderRadius: 22, backgroundColor: "rgba(255,255,255,0.92)", padding: 16, borderWidth: 1, borderColor: "#f3f4f6" },
  tripCardHeaderCopy: { flex: 1, paddingRight: 10 },
  tripCode: { marginTop: 3, fontSize: 11, fontWeight: "700", color: "#9ca3af" },
  tripMetaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },
  tripMetaPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "#fff7ed", paddingHorizontal: 10, paddingVertical: 7 },
  tripMetaText: { fontSize: 11, fontWeight: "800", color: "#9a3412" },
  riderMapCard: { borderRadius: 22, backgroundColor: "rgba(255,255,255,0.9)", padding: 14, borderWidth: 1, borderColor: "#f3f4f6" },
  riderMapWrap: { marginTop: 10, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#fde68a" },
  riderMap: { width: "100%", height: 210 },
  tripQuickActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  tripQuickButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 16, backgroundColor: "#fff7ed", paddingHorizontal: 12, paddingVertical: 10 },
  tripQuickButtonText: { color: "#c2410c", fontSize: 12, fontWeight: "800" },
  tripEmpty: { borderRadius: 22, backgroundColor: "rgba(255,255,255,0.74)", padding: 18, borderWidth: 1, borderColor: "#f3f4f6" },
  panel: { marginBottom: 14, borderRadius: 26, backgroundColor: "#ffffff", padding: 16 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusText: { color: "#c2410c", fontSize: 11, fontWeight: "800" },
  routeTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  cardMeta: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#6b7280" },
  deliveryActions: { marginTop: 14, flexDirection: "row", gap: 10 },
  primaryAction: { flex: 1, borderRadius: 18, backgroundColor: "#f97316", paddingVertical: 12, alignItems: "center" },
  primaryActionText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  heroCard: { marginBottom: 14, borderRadius: 28, backgroundColor: "#fb923c", padding: 22 },
  heroLabel: { fontSize: 12, color: "#ffedd5", fontWeight: "700" },
  heroValue: { marginTop: 8, fontSize: 34, fontWeight: "800", color: "#ffffff" },
  heroSub: { marginTop: 8, fontSize: 13, color: "#ffedd5" },
  nav: { borderTopWidth: 1, borderTopColor: "#f3f4f6", backgroundColor: "#ffffff", paddingVertical: 10, flexDirection: "row", justifyContent: "space-around" },
  navItem: { alignItems: "center", gap: 4 },
  navLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af" },
  navLabelActive: { color: "#f97316" },
  logoutOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.38)" },
  logoutBackdrop: { ...StyleSheet.absoluteFillObject },
  logoutCard: { borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: "#fffaf5", paddingHorizontal: 22, paddingTop: 20, paddingBottom: 30, shadowColor: "#111827", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 8 },
  logoutIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  logoutTitle: { marginTop: 16, fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#111827", textAlign: "center" },
  logoutCopy: { marginTop: 10, fontSize: 14, lineHeight: 22, fontWeight: "600", color: "#6b7280", textAlign: "center" },
  logoutActions: { flexDirection: "row", gap: 12, marginTop: 22 },
  logoutSecondaryButton: { flex: 1, borderRadius: 18, backgroundColor: "#ffedd5", paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  logoutSecondaryText: { fontSize: 15, fontWeight: "800", color: "#c2410c" },
  logoutPrimaryButton: { flex: 1, borderRadius: 18, backgroundColor: "#f97316", paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  logoutPrimaryText: { fontSize: 15, fontWeight: "900", color: "#ffffff" }
});
