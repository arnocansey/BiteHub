"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_status_bar_1 = require("expo-status-bar");
const vector_icons_1 = require("@expo/vector-icons");
const react_query_1 = require("@tanstack/react-query");
const expo_constants_1 = __importDefault(require("expo-constants"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const ImagePicker = __importStar(require("expo-image-picker"));
const Location = __importStar(require("expo-location"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_maps_1 = __importStar(require("react-native-maps"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const BiteHubSplash_1 = require("./components/BiteHubSplash");
const sessionStorageKey = "bitehub_rider_session";
const riderProfileImageStorageKey = "bitehub_rider_profile_image";
const queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
});
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
];
function resolveApiBaseUrl() {
    const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
    if (configured)
        return configured;
    const hostUri = expo_constants_1.default?.expoConfig?.hostUri ??
        expo_constants_1.default?.manifest2?.extra?.expoGo?.debuggerHost ??
        expo_constants_1.default?.manifest?.debuggerHost;
    const host = typeof hostUri === "string" ? hostUri.split(":")[0] : null;
    if (host) {
        return `http://${host}:4000/api/v1`;
    }
    if (react_native_1.Platform.OS === "android") {
        return "http://10.0.2.2:4000/api/v1";
    }
    return "http://127.0.0.1:4000/api/v1";
}
const apiBaseUrl = resolveApiBaseUrl();
const riderLogo = require("./assets/bitehub-icon.png");
const tutorialCardWidth = react_native_1.Dimensions.get("window").width - 72;
const currencyFormatter = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2
});
function formatMoney(value) {
    return currencyFormatter.format(Number(value ?? 0));
}
function buildLocationLabel(places) {
    const place = places[0];
    if (!place)
        return null;
    return [place.street, place.district, place.city, place.region].filter(Boolean).slice(0, 3).join(", ");
}
function buildMapRegion(points) {
    const valid = points.filter((point) => typeof point.latitude === "number" && typeof point.longitude === "number");
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
    const travel = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const bob = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const wheel = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(travel, {
                toValue: 1,
                duration: 2600,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.quad),
                useNativeDriver: true
            }),
            react_native_1.Animated.timing(travel, {
                toValue: 0,
                duration: 2600,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.quad),
                useNativeDriver: true
            })
        ])).start();
        react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(bob, { toValue: 1, duration: 900, easing: react_native_1.Easing.inOut(react_native_1.Easing.sin), useNativeDriver: true }),
            react_native_1.Animated.timing(bob, { toValue: 0, duration: 900, easing: react_native_1.Easing.inOut(react_native_1.Easing.sin), useNativeDriver: true })
        ])).start();
        react_native_1.Animated.loop(react_native_1.Animated.timing(wheel, {
            toValue: 1,
            duration: 1000,
            easing: react_native_1.Easing.linear,
            useNativeDriver: true
        })).start();
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
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.bikeHero, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.bikeHeroLabel, children: "On the move" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.bikeHeroTitle, children: "Ride the next BiteHub drop." }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.bikeScene, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bikeRoadGlow }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bikeRoadLine }), (0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [
                            styles.bikeRiderWrap,
                            {
                                transform: [{ translateX: riderTranslateX }, { translateY: riderTranslateY }]
                            }
                        ], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.riderBody, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.riderHead }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.riderTorso }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.deliveryBag })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.bikeFrame, children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bikeWheel, { transform: [{ rotate: wheelRotate }] }], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bikeWheelInner }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bikeBar }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bikeSeat }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [styles.bikeWheel, { transform: [{ rotate: wheelRotate }] }], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bikeWheelInner }) })] })] })] })] }));
}
function App() {
    return ((0, jsx_runtime_1.jsx)(react_query_1.QueryClientProvider, { client: queryClient, children: (0, jsx_runtime_1.jsx)(AppContent, {}) }));
}
function AppContent() {
    const [showSplash, setShowSplash] = (0, react_1.useState)(true);
    const [sessionReady, setSessionReady] = (0, react_1.useState)(false);
    const [session, setSession] = (0, react_1.useState)(null);
    const tanstackQueryClient = (0, react_query_1.useQueryClient)();
    const [activeTab, setActiveTab] = (0, react_1.useState)("home");
    const [homeSection, setHomeSection] = (0, react_1.useState)("current");
    const [profileScreen, setProfileScreen] = (0, react_1.useState)("menu");
    const [generalTutorialIndex, setGeneralTutorialIndex] = (0, react_1.useState)(0);
    const [authMode, setAuthMode] = (0, react_1.useState)("signin");
    const [firstName, setFirstName] = (0, react_1.useState)("");
    const [lastName, setLastName] = (0, react_1.useState)("");
    const [vehicleType, setVehicleType] = (0, react_1.useState)("");
    const [phone, setPhone] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [resetToken, setResetToken] = (0, react_1.useState)("");
    const [resetPasswordValue, setResetPasswordValue] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [authMessage, setAuthMessage] = (0, react_1.useState)(null);
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [jobs, setJobs] = (0, react_1.useState)([]);
    const [earnings, setEarnings] = (0, react_1.useState)(null);
    const [opsInsights, setOpsInsights] = (0, react_1.useState)(null);
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [busyDeliveryId, setBusyDeliveryId] = (0, react_1.useState)(null);
    const [locationLabel, setLocationLabel] = (0, react_1.useState)(null);
    const [locationCoords, setLocationCoords] = (0, react_1.useState)(null);
    const [locationStatus, setLocationStatus] = (0, react_1.useState)(null);
    const [locating, setLocating] = (0, react_1.useState)(false);
    const [refreshingHome, setRefreshingHome] = (0, react_1.useState)(false);
    const [profileImageOverride, setProfileImageOverride] = (0, react_1.useState)(null);
    const [showLogoutModal, setShowLogoutModal] = (0, react_1.useState)(false);
    const logoutOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const logoutTranslateY = (0, react_1.useRef)(new react_native_1.Animated.Value(32)).current;
    const tutorialPagerRef = (0, react_1.useRef)(null);
    async function refreshSessionTokens(activeSession) {
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
        const nextSession = {
            ...activeSession,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken
        };
        setSession(nextSession);
        return nextSession;
    }
    async function request(path, init = {}, activeSession = session, allowRefresh = true) {
        const makeRequest = (accessToken) => fetch(`${apiBaseUrl}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(init.headers ?? {})
            }
        });
        let response;
        try {
            response = await makeRequest(activeSession?.accessToken);
        }
        catch {
            throw new Error(`Network request failed. Make sure the BiteHub backend is running at ${apiBaseUrl}.`);
        }
        if ((response.status === 401 || response.status === 403) && allowRefresh && activeSession?.refreshToken) {
            try {
                const refreshedSession = await refreshSessionTokens(activeSession);
                response = await makeRequest(refreshedSession.accessToken);
            }
            catch {
                setSession(null);
                throw new Error("Your session has expired. Please sign in again.");
            }
        }
        const payload = await response.json().catch(() => null);
        if (!response.ok)
            throw new Error(payload?.message ?? "Request failed.");
        return payload;
    }
    function clearAuthFeedback() {
        setError(null);
        setAuthMessage(null);
    }
    async function fetchRiderDataBundle(activeSession) {
        const [profileData, jobsData, earningsData, opsData, notificationData] = await Promise.all([
            request("/riders/profile", {}, activeSession),
            request("/riders/jobs", {}, activeSession),
            request("/riders/earnings", {}, activeSession),
            request("/riders/incentives", {}, activeSession),
            request("/notifications", {}, activeSession)
        ]);
        return { profileData, jobsData, earningsData, opsData, notificationData };
    }
    function applyRiderBundle(bundle) {
        setProfile(bundle.profileData);
        setJobs(bundle.jobsData);
        setEarnings(bundle.earningsData);
        setOpsInsights(bundle.opsData);
        setNotifications(bundle.notificationData);
    }
    const riderDataQuery = (0, react_query_1.useQuery)({
        queryKey: ["rider-data", session?.user?.email ?? "guest"],
        queryFn: () => fetchRiderDataBundle(session),
        enabled: Boolean(session)
    });
    async function loadRiderData(activeSession) {
        const bundle = await tanstackQueryClient.fetchQuery({
            queryKey: ["rider-data", activeSession.user.email ?? activeSession.user.firstName ?? "rider"],
            queryFn: () => fetchRiderDataBundle(activeSession)
        });
        applyRiderBundle(bundle);
    }
    (0, react_1.useEffect)(() => {
        if (riderDataQuery.data) {
            applyRiderBundle(riderDataQuery.data);
        }
    }, [riderDataQuery.data]);
    (0, react_1.useEffect)(() => {
        void (async () => {
            try {
                const raw = await async_storage_1.default.getItem(sessionStorageKey);
                if (!raw) {
                    setSessionReady(true);
                    return;
                }
                const restored = JSON.parse(raw);
                if (!restored?.accessToken || !restored?.refreshToken) {
                    await async_storage_1.default.removeItem(sessionStorageKey);
                    setSessionReady(true);
                    return;
                }
                setSession(restored);
                const savedProfileImage = await async_storage_1.default.getItem(riderProfileImageStorageKey);
                setProfileImageOverride(savedProfileImage);
                await loadRiderData(restored);
            }
            catch (err) {
                await async_storage_1.default.removeItem(sessionStorageKey);
                await async_storage_1.default.removeItem(riderProfileImageStorageKey);
                setError(err instanceof Error ? err.message : "Unable to restore your session.");
            }
            finally {
                setSessionReady(true);
            }
        })();
    }, []);
    (0, react_1.useEffect)(() => {
        if (!sessionReady)
            return;
        void (session
            ? async_storage_1.default.setItem(sessionStorageKey, JSON.stringify(session))
            : async_storage_1.default.removeItem(sessionStorageKey));
    }, [session, sessionReady]);
    async function handleSignIn() {
        clearAuthFeedback();
        setLoading(true);
        try {
            const payload = await request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            if (payload.user?.role !== "RIDER")
                throw new Error("This account does not have rider access.");
            const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
            setSession(nextSession);
            await loadRiderData(nextSession);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to sign in.");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleSignUp() {
        clearAuthFeedback();
        setLoading(true);
        try {
            const payload = await request("/auth/register/rider", {
                method: "POST",
                body: JSON.stringify({ firstName, lastName, phone: phone.trim() || undefined, vehicleType, email, password, role: "RIDER" })
            });
            const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
            setSession(nextSession);
            setAuthMode("signin");
            await loadRiderData(nextSession);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create rider account.");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleForgotPassword() {
        clearAuthFeedback();
        setLoading(true);
        try {
            const payload = await request("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email })
            });
            setAuthMessage(payload.resetToken ? `Reset token: ${payload.resetToken}` : payload.message);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to prepare password reset.");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleResetPassword() {
        clearAuthFeedback();
        setLoading(true);
        try {
            const payload = await request("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token: resetToken, password: resetPasswordValue })
            });
            setAuthMessage(payload.message);
            setResetToken("");
            setResetPasswordValue("");
            setPassword("");
            setAuthMode("signin");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to reset password.");
        }
        finally {
            setLoading(false);
        }
    }
    async function toggleAvailability() {
        if (!session || !profile)
            return;
        setError(null);
        try {
            await request("/riders/availability", { method: "PATCH", body: JSON.stringify({ isOnline: !profile.isOnline }) }, session);
            await loadRiderData(session);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update availability.");
        }
    }
    async function acceptJob(deliveryId) {
        if (!session)
            return;
        setBusyDeliveryId(deliveryId);
        setError(null);
        try {
            await request(`/riders/jobs/${deliveryId}/accept`, { method: "POST" }, session);
            await loadRiderData(session);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to accept this job.");
        }
        finally {
            setBusyDeliveryId(null);
        }
    }
    async function updateDeliveryStatus(deliveryId, status) {
        if (!session)
            return;
        setBusyDeliveryId(deliveryId);
        setError(null);
        try {
            await request(`/riders/jobs/${deliveryId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, session);
            if (status === "DELIVERED") {
                await request(`/riders/jobs/${deliveryId}/proof`, { method: "POST", body: JSON.stringify({ proofType: "NOTE", note: "Delivered successfully via rider app." }) }, session);
            }
            await loadRiderData(session);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update delivery status.");
        }
        finally {
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
        }
        catch (err) {
            setLocationStatus(err instanceof Error ? err.message : "Unable to load live location.");
        }
        finally {
            setLocating(false);
        }
    }
    async function openExternal(url, fallback) {
        const supported = await react_native_1.Linking.canOpenURL(url);
        if (!supported) {
            setError(fallback);
            return;
        }
        await react_native_1.Linking.openURL(url);
    }
    async function openSupportChat() {
        setError(null);
        await openExternal("sms:0555405695?body=Hello%20BiteHub%20Support", "SMS chat is not available on this device. Call support at 0555405695.");
    }
    async function callSupport() {
        setError(null);
        await openExternal("tel:0555405695", "Phone calling is not available on this device.");
    }
    async function callCustomer(job) {
        const customerPhone = job?.order?.customer?.phone;
        if (!customerPhone) {
            setError("Customer phone number is not available for this trip.");
            return;
        }
        setError(null);
        await openExternal(`tel:${customerPhone}`, "Phone calling is not available on this device.");
    }
    async function openDropoffMap(job) {
        const address = job?.order?.deliveryAddress;
        if (!address) {
            setError("Dropoff location is not available yet.");
            return;
        }
        const label = encodeURIComponent(address.label ?? "Customer dropoff");
        const latitude = address.latitude;
        const longitude = address.longitude;
        if (typeof latitude === "number" && typeof longitude === "number") {
            const url = react_native_1.Platform.OS === "ios"
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
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(logoutOpacity, {
                toValue: 1,
                duration: 220,
                easing: react_native_1.Easing.out(react_native_1.Easing.quad),
                useNativeDriver: true
            }),
            react_native_1.Animated.timing(logoutTranslateY, {
                toValue: 0,
                duration: 260,
                easing: react_native_1.Easing.out(react_native_1.Easing.back(1.1)),
                useNativeDriver: true
            })
        ]).start();
    }
    function closeLogoutModal() {
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(logoutOpacity, {
                toValue: 0,
                duration: 180,
                easing: react_native_1.Easing.in(react_native_1.Easing.quad),
                useNativeDriver: true
            }),
            react_native_1.Animated.timing(logoutTranslateY, {
                toValue: 32,
                duration: 180,
                easing: react_native_1.Easing.in(react_native_1.Easing.quad),
                useNativeDriver: true
            })
        ]).start(() => setShowLogoutModal(false));
    }
    function confirmSignOut() {
        closeLogoutModal();
        setError(null);
        setProfileImageOverride(null);
        void async_storage_1.default.removeItem(riderProfileImageStorageKey);
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
            if (result.canceled || !result.assets?.[0]?.uri)
                return;
            const nextImage = result.assets[0].uri;
            setProfileImageOverride(nextImage);
            await async_storage_1.default.setItem(riderProfileImageStorageKey, nextImage);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to add rider picture.");
        }
    }
    function goToGeneralSlide(index) {
        const clampedIndex = Math.max(0, Math.min(index, generalTutorialSlides.length - 1));
        setGeneralTutorialIndex(clampedIndex);
        tutorialPagerRef.current?.scrollTo({ x: tutorialCardWidth * clampedIndex, animated: true });
    }
    async function markNotificationRead(notificationId) {
        if (!session)
            return;
        try {
            await request(`/notifications/${notificationId}/read`, { method: "PATCH" }, session);
            setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update notification.");
        }
    }
    async function markAllNotificationsRead() {
        if (!session)
            return;
        try {
            await request("/notifications/read-all", { method: "PATCH" }, session);
            setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to mark all notifications as read.");
        }
    }
    async function clearReadNotifications() {
        if (!session)
            return;
        try {
            await request("/notifications/clear-read", { method: "DELETE" }, session);
            setNotifications((current) => current.filter((item) => !item.isRead));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to clear read notifications.");
        }
    }
    async function refreshHomeFeed() {
        if (!session)
            return;
        setRefreshingHome(true);
        setError(null);
        try {
            await Promise.all([loadRiderData(session), refreshLocation()]);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to refresh rider data.");
        }
        finally {
            setRefreshingHome(false);
        }
    }
    (0, react_1.useEffect)(() => {
        if (!session)
            return;
        void loadRiderData(session).catch((err) => setError(err instanceof Error ? err.message : "Unable to refresh rider data."));
        void refreshLocation();
    }, [session]);
    (0, react_1.useEffect)(() => {
        if (!session || !locationCoords || !profile?.isOnline)
            return;
        void request("/riders/location", {
            method: "PATCH",
            body: JSON.stringify({
                latitude: locationCoords.latitude,
                longitude: locationCoords.longitude
            })
        }, session).catch((err) => setLocationStatus(err instanceof Error ? err.message : "Unable to sync rider location."));
    }, [locationCoords, profile?.isOnline, session]);
    (0, react_1.useEffect)(() => {
        if (!session || !profile?.isOnline)
            return;
        const timer = setInterval(() => {
            void refreshLocation();
        }, 20000);
        return () => clearInterval(timer);
    }, [profile?.isOnline, session]);
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => setShowSplash(false), 2300);
        return () => clearTimeout(timer);
    }, []);
    const activeJobs = jobs.filter((job) => job.status !== "DELIVERED" && job.status !== "FAILED");
    const completedJobs = jobs.filter((job) => job.status === "DELIVERED" || job.status === "FAILED");
    const homeTrips = homeSection === "current" ? activeJobs : homeSection === "archive" ? jobs : completedJobs;
    const currentTripCount = activeJobs.length;
    const archiveTripCount = jobs.length;
    const pastTripCount = completedJobs.length;
    const activeMapJob = activeJobs.find((job) => job.riderProfileId && ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(job.status)) ?? null;
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
    const headerTitle = activeTab === "home"
        ? `${profile?.user?.firstName ?? fallbackFirstName} ${profile?.user?.lastName ?? fallbackLastName}`.trim()
        : activeTab === "deliveries"
            ? "Deliveries"
            : activeTab === "earnings"
                ? "Earnings"
                : "";
    const headerSubtitle = activeTab === "home"
        ? profile?.vehicleType ?? "Rider profile"
        : activeTab === "deliveries"
            ? "Track pickup and dropoff progress"
            : activeTab === "earnings"
                ? "Performance and payout overview"
                : "";
    if (showSplash || !sessionReady) {
        return (0, jsx_runtime_1.jsx)(BiteHubSplash_1.BiteHubSplash, { accentColor: "#cc0000", label: "BiteHub Rider", logoSource: riderLogo, subtitle: "Own every drop with speed." });
    }
    if (!session) {
        return ((0, jsx_runtime_1.jsxs)(react_native_safe_area_context_1.SafeAreaView, { style: styles.safeArea, children: [(0, jsx_runtime_1.jsx)(expo_status_bar_1.StatusBar, { style: "dark" }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.authScrollContent, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.auth, children: [(0, jsx_runtime_1.jsx)(react_native_1.Image, { source: riderLogo, style: styles.authLogo, resizeMode: "contain" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroTitle, children: "Stay online and keep every dropoff moving." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.body, children: "Create a rider account, recover access, or sign in with a real profile." }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "RIDER APP" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: authMode === "signin" ? "Sign in with a real rider account." : authMode === "signup" ? "Create your rider profile." : "Reset your rider password." }), authMode === "signup" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: firstName, onChangeText: setFirstName, placeholder: "First name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: lastName, onChangeText: setLastName, placeholder: "Last name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: phone, onChangeText: setPhone, placeholder: "Phone number", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: vehicleType, onChangeText: setVehicleType, placeholder: "Vehicle type", placeholderTextColor: "#9ca3af", style: styles.input })] })) : null, (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: email, onChangeText: setEmail, placeholder: "Email", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), authMode !== "forgot" ? (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: password, onChangeText: setPassword, placeholder: "Password", placeholderTextColor: "#9ca3af", style: styles.input, secureTextEntry: true }) : null, authMode === "forgot" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: resetToken, onChangeText: setResetToken, placeholder: "Reset token", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: resetPasswordValue, onChangeText: setResetPasswordValue, placeholder: "New password", placeholderTextColor: "#9ca3af", style: styles.input, secureTextEntry: true })] })) : null, error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, authMessage ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.success, children: authMessage }) : null, authMode === "signin" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleSignIn(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loading ? "Signing in..." : "Sign in" }) }) : null, authMode === "signup" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleSignUp(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loading ? "Creating..." : "Create account" }) }) : null, authMode === "forgot" ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleForgotPassword(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loading ? "Preparing..." : "Send reset token" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void handleResetPassword(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: loading ? "Updating..." : "Reset password" }) })] }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authLinks, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { clearAuthFeedback(); setAuthMode("signin"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "signin" && styles.authLinkActive], children: "Sign in" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { clearAuthFeedback(); setAuthMode("signup"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "signup" && styles.authLinkActive], children: "Sign up" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { clearAuthFeedback(); setAuthMode("forgot"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "forgot" && styles.authLinkActive], children: "Forgot password" }) })] })] })] }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_safe_area_context_1.SafeAreaView, { style: styles.safeArea, children: [(0, jsx_runtime_1.jsx)(expo_status_bar_1.StatusBar, { style: "dark" }), activeTab !== "profile" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [activeTab === "home" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileRow, children: [riderProfileImage ? ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: riderProfileImage }, style: styles.avatar, resizeMode: "cover" })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.avatarPlaceholder, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.avatarPlaceholderText, children: riderInitials }) })), (0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: headerTitle }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.subtle, children: headerSubtitle })] })] })) : ((0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [headerTitle ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: headerTitle }) : null, headerSubtitle ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.subtle, children: headerSubtitle }) : null] })), activeTab === "home" ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.onlineChip, profile?.isOnline ? styles.onlineChipActive : styles.onlineChipMuted], onPress: () => void toggleAvailability(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.onlineChipText, profile?.isOnline ? styles.onlineChipTextActive : styles.onlineChipTextMuted], children: profile?.isOnline ? "Online" : "Offline" }) })) : (0, jsx_runtime_1.jsx)(react_native_1.View, {})] })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: [styles.scroll, activeTab === "profile" ? styles.profileScroll : null], refreshControl: activeTab === "home" ? ((0, jsx_runtime_1.jsx)(react_native_1.RefreshControl, { refreshing: refreshingHome, onRefresh: () => void refreshHomeFeed(), tintColor: "#f97316", colors: ["#f97316"] })) : undefined, children: [error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, activeTab === "home" ? (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripFeatureShell, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripHub, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripHubLabel, children: "Trip center" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripHubTitle, children: "Keep every delivery in view." }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tripSectionTabs, children: [
                                                { id: "current", label: "Current trips", count: currentTripCount },
                                                { id: "archive", label: "Archive", count: archiveTripCount },
                                                { id: "past", label: "Past trips", count: pastTripCount }
                                            ].map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: [styles.tripSectionTab, homeSection === item.id && styles.tripSectionTabActive], onPress: () => setHomeSection(item.id), children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.tripSectionTabCount, homeSection === item.id && styles.tripSectionTabCountActive], children: item.count }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.tripSectionTabText, homeSection === item.id && styles.tripSectionTabTextActive], children: item.label })] }, item.id))) }), homeSection === "current" && activeMapJob ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.riderMapCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Live route map" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Track your current position against the customer dropoff." }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.riderMapWrap, children: (0, jsx_runtime_1.jsxs)(react_native_maps_1.default, { style: styles.riderMap, initialRegion: activeMapRegion, region: activeMapRegion, children: [locationCoords ? (0, jsx_runtime_1.jsx)(react_native_maps_1.Marker, { coordinate: { latitude: locationCoords.latitude, longitude: locationCoords.longitude }, title: "You", pinColor: "#111827" }) : null, typeof activeMapJob.order?.deliveryAddress?.latitude === "number" && typeof activeMapJob.order?.deliveryAddress?.longitude === "number" ? (0, jsx_runtime_1.jsx)(react_native_maps_1.Marker, { coordinate: { latitude: activeMapJob.order.deliveryAddress.latitude, longitude: activeMapJob.order.deliveryAddress.longitude }, title: activeMapJob.order?.deliveryAddress?.label ?? "Dropoff", pinColor: "#f97316" }) : null] }) })] })) : null, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tripSectionBody, children: homeTrips.length ? homeTrips.map((job) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripCard, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripCardHeaderCopy, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: job.order?.restaurant?.name ?? "Restaurant" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripCode, children: job.order?.id ?? job.id })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statusText, children: String(job.status).replaceAll("_", " ") })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.routeTitle, children: job.order?.deliveryAddress?.label ?? "Dropoff location" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: job.order?.deliveryAddress?.fullAddress ?? "No delivery address available" }), job.order?.customer ? (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Customer: ", job.order.customer.firstName ?? "Customer", " ", job.order.customer.lastName ?? ""] }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripMetaRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripMetaPill, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "navigate-outline", size: 14, color: "#c2410c" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripMetaText, children: job.order?.deliveryAddress?.label ?? "Customer drop" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripMetaPill, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "time-outline", size: 14, color: "#c2410c" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripMetaText, children: job.updatedAt ? new Date(job.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live" })] })] }), homeSection === "current" && job.riderProfileId ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripQuickActions, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.tripQuickButton, onPress: () => void openDropoffMap(job), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "map-outline", size: 15, color: "#c2410c" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripQuickButtonText, children: "Map" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.tripQuickButton, onPress: () => void callCustomer(job), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "call-outline", size: 15, color: "#c2410c" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tripQuickButtonText, children: "Call" })] })] }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.deliveryActions, children: [homeSection === "current" && !job.riderProfileId ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryAction, onPress: () => void acceptJob(job.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryActionText, children: busyDeliveryId === job.id ? "Working..." : "Accept Job" }) }) : null, homeSection === "current" && job.riderProfileId && job.status === "ASSIGNED" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryAction, onPress: () => void updateDeliveryStatus(job.id, "PICKED_UP"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryActionText, children: busyDeliveryId === job.id ? "Working..." : "Picked Up" }) }) : null, homeSection === "current" && job.riderProfileId && job.status === "PICKED_UP" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryAction, onPress: () => void updateDeliveryStatus(job.id, "IN_TRANSIT"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryActionText, children: busyDeliveryId === job.id ? "Working..." : "Start Transit" }) }) : null, homeSection === "current" && job.riderProfileId && job.status === "IN_TRANSIT" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryAction, onPress: () => void updateDeliveryStatus(job.id, "DELIVERED"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryActionText, children: busyDeliveryId === job.id ? "Working..." : "Deliver + Proof" }) }) : null] })] }, job.id)) : (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tripEmpty, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: homeSection === "current" ? "No current trips" : homeSection === "archive" ? "Archive is empty" : "No past trips yet" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: homeSection === "current" ? "Go online and accept a delivery to see it here." : homeSection === "archive" ? "Every delivery assigned to you will be kept here for quick review." : "Completed and closed deliveries will show here once you finish them." })] }) })] }), homeSection === "current" ? (0, jsx_runtime_1.jsx)(BikeCourierAnimation, {}) : null] }) }) : null, activeTab === "deliveries" ? jobs.map((job) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: job.order?.id ?? job.id }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statusText, children: String(job.status).replaceAll("_", " ") })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.routeTitle, children: [job.order?.restaurant?.name ?? "Restaurant", " to ", job.order?.deliveryAddress?.label ?? "Customer"] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: job.order?.deliveryAddress?.fullAddress ?? "No address provided" })] }, job.id)) : null, activeTab === "earnings" ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroLabel, children: "Estimated Earnings" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroValue, children: formatMoney(Number(earnings?.estimatedEarnings ?? 0)) }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.heroSub, children: [earnings?.completedDeliveries ?? 0, " completed deliveries"] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Delivery Summary" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Completed: ", earnings?.completedDeliveries ?? 0] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Open jobs: ", activeJobs.length] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Live incentives" }), (opsInsights?.incentives ?? []).length ? (opsInsights?.incentives ?? []).map((incentive) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.subRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.routeTitle, children: incentive.title }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: incentive.description })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statusText, children: formatMoney(Number(incentive.bonusAmount ?? 0)) })] }, incentive.id)) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "No active incentives right now." })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Hot zones" }), (opsInsights?.heatmap ?? []).slice(0, 4).map((zone) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.subRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.routeTitle, children: zone.zoneLabel }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Demand ", zone.demandLevel, "/10 | Supply ", zone.supplyLevel, "/10 | ETA ", zone.averageEtaMinutes, " min"] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.statusText, children: [zone.activeOrders, " jobs"] })] }, zone.id))] })] }) : null, activeTab === "profile" ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [profileScreen === "menu" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileHeroCard, children: [riderProfileImage ? ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: riderProfileImage }, style: styles.profileHeroAvatar, resizeMode: "cover" })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.profileHeroAvatarPlaceholder, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.profileHeroAvatarText, children: riderInitials }) })), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.profileHeroName, children: [profile?.user?.firstName ?? session.user.firstName, " ", profile?.user?.lastName ?? session.user.lastName] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.profileHeroEmail, children: profile?.user?.email ?? session.user.email ?? email }), (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.addPictureButton, onPress: () => void addProfilePicture(), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "image-outline", size: 16, color: "#c2410c" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.addPictureButtonText, children: riderProfileImage ? "Change picture" : "Add picture" })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.profileMenu, children: [
                                            { key: "chat", label: "Chat with Support", icon: "chatbubble-ellipses-outline", action: openSupportChat },
                                            { key: "call", label: "Call Support", icon: "call-outline", action: callSupport, meta: "0555405695" },
                                            { key: "notifications", label: "Notifications", icon: "notifications-outline", action: openNotifications, meta: unreadNotifications ? `${unreadNotifications} unread` : "All caught up" },
                                            { key: "help", label: "Help", icon: "help-circle-outline", action: openHelp },
                                            { key: "privacy", label: "Privacy Policy", icon: "shield-checkmark-outline", action: openPrivacyPolicy },
                                            { key: "tutorial", label: "Tutorial", icon: "school-outline", action: openTutorial },
                                            { key: "signout", label: "Sign Out", icon: "log-out-outline", action: signOut, tone: "danger" }
                                        ].map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.profileMenuItem, onPress: () => void item.action(), children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.profileMenuIcon, item.tone === "danger" ? styles.profileMenuIconDanger : null], children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: item.icon, size: 18, color: item.tone === "danger" ? "#dc2626" : "#f97316" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.profileMenuLabel, item.tone === "danger" ? styles.profileMenuLabelDanger : null], children: item.label }), item.meta ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.profileMenuMeta, children: item.meta }) : null] }), (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "chevron-forward", size: 18, color: "#9ca3af" })] }, item.key))) })] })) : null, profileScreen === "notifications" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileSubHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.smallBackButton, onPress: () => setProfileScreen("menu"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.smallBackButtonText, children: "Back" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Notifications" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void markAllNotificationsRead(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: "Mark all read" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void clearReadNotifications(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: "Clear read" }) })] }), notifications.length ? notifications.map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.notificationCard, onPress: () => void markNotificationRead(item.id), children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.profileMenuIcon, item.isRead ? styles.notificationIconRead : null], children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: item.isRead ? "mail-open-outline" : "notifications-outline", size: 18, color: item.isRead ? "#6b7280" : "#f97316" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.profileMenuLabel, children: item.title }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.profileMenuMeta, children: item.body })] })] }, item.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "No notifications yet." })] })) : null, profileScreen === "help" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileSubHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.smallBackButton, onPress: () => setProfileScreen("menu"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.smallBackButtonText, children: "Back" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Help" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Need help with a delivery, payout, or route issue?" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.helpBullet, children: "Chat with support for quick assistance." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.helpBullet, children: "Call support on 0555405695 for urgent rider help." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.helpBullet, children: "Stay online only when you are available to take jobs." })] })) : null, profileScreen === "privacy" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileSubHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.smallBackButton, onPress: () => setProfileScreen("menu"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.smallBackButtonText, children: "Back" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Privacy Policy" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "BiteHub uses your location only for delivery operations, route guidance, ETA prediction, and customer visibility during active orders." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.helpBullet, children: "Your phone number is used for support and delivery communication." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.helpBullet, children: "Your location is updated while you are online and active in the rider workspace." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.helpBullet, children: "Support records and proof-of-delivery data help resolve delivery disputes." })] })) : null, profileScreen === "tutorial" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileSubHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.smallBackButton, onPress: () => setProfileScreen("menu"), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "arrow-back", size: 16, color: "#374151" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tutorialTitle, children: "Tutorial" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Learn the core BiteHub rider workflows before you head out." }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tutorialGrid, children: [
                                            { key: "general", label: "General", icon: "compass-outline", color: "#fff1f2", iconColor: "#e11d48", action: openGeneralTutorial },
                                            { key: "online", label: "Online & Availability", icon: "radio-outline", color: "#eff6ff", iconColor: "#2563eb" },
                                            { key: "orders", label: "Orders", icon: "receipt-outline", color: "#fef3c7", iconColor: "#d97706" },
                                            { key: "settlement", label: "Settlement", icon: "wallet-outline", color: "#ecfccb", iconColor: "#65a30d" },
                                            { key: "cashout", label: "Cashout", icon: "cash-outline", color: "#ecfeff", iconColor: "#0891b2" }
                                        ].map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: [styles.tutorialCard, { backgroundColor: item.color }], onPress: item.action, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tutorialIconWrap, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: item.icon, size: 30, color: item.iconColor }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tutorialCardLabel, children: item.label })] }, item.key))) })] })) : null, profileScreen === "tutorial-general" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileSubHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.smallBackButton, onPress: () => setProfileScreen("tutorial"), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "arrow-back", size: 16, color: "#374151" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tutorialTitle, children: "General Overview" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [generalTutorialIndex + 1, " of ", generalTutorialSlides.length] }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { ref: tutorialPagerRef, horizontal: true, pagingEnabled: true, showsHorizontalScrollIndicator: false, decelerationRate: "fast", contentContainerStyle: styles.generalTutorialPager, onMomentumScrollEnd: (event) => {
                                            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / tutorialCardWidth);
                                            setGeneralTutorialIndex(nextIndex);
                                        }, children: generalTutorialSlides.map((slide) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [
                                                styles.generalTutorialCard,
                                                { backgroundColor: slide.background }
                                            ], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.generalTutorialWaves, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                                                styles.generalTutorialWaveLarge,
                                                                { backgroundColor: `${slide.accent}20` }
                                                            ] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                                                styles.generalTutorialWaveSmall,
                                                                { backgroundColor: `${slide.accent}12` }
                                                            ] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.generalTutorialEyebrow, children: "General Overview" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.generalTutorialIconWrap, { backgroundColor: `${slide.accent}18` }], children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: slide.icon, size: 42, color: slide.accent }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.generalTutorialStep, children: slide.title }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.generalTutorialBody, children: slide.body })] }, slide.title))) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.generalTutorialDots, children: generalTutorialSlides.map((slide, index) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.generalTutorialDot, index === generalTutorialIndex ? styles.generalTutorialDotActive : null] }, slide.title))) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.generalTutorialActions, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.logoutSecondaryButton, generalTutorialIndex === 0 ? styles.disabledAction : null], onPress: () => goToGeneralSlide(generalTutorialIndex - 1), disabled: generalTutorialIndex === 0, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.logoutSecondaryText, children: "Previous" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.logoutPrimaryButton, onPress: () => goToGeneralSlide(generalTutorialIndex === generalTutorialSlides.length - 1 ? 0 : generalTutorialIndex + 1), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.logoutPrimaryText, children: generalTutorialIndex === generalTutorialSlides.length - 1 ? "Start again" : "Next" }) })] })] })) : null] }) : null] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.nav, children: [
                    { id: "home", label: "Home", icon: "navigate-outline", activeIcon: "navigate" },
                    { id: "deliveries", label: "Deliveries", icon: "cube-outline", activeIcon: "cube" },
                    { id: "earnings", label: "Earnings", icon: "wallet-outline", activeIcon: "wallet" },
                    { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" }
                ].map((item) => (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.navItem, onPress: () => setActiveTab(item.id), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: activeTab === item.id ? item.activeIcon : item.icon, size: 18, color: activeTab === item.id ? "#f97316" : "#9ca3af" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.navLabel, activeTab === item.id && styles.navLabelActive], children: item.label })] }, item.id)) }), showLogoutModal ? ((0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [styles.logoutOverlay, { opacity: logoutOpacity }], children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.logoutBackdrop, onPress: closeLogoutModal }), (0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [styles.logoutCard, { transform: [{ translateY: logoutTranslateY }] }], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.logoutIconWrap, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "log-out-outline", size: 24, color: "#ffffff" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.logoutTitle, children: "Log out of BiteHub Rider?" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.logoutCopy, children: "You can sign back in anytime to pick up new trips and keep deliveries moving." }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.logoutActions, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.logoutSecondaryButton, onPress: closeLogoutModal, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.logoutSecondaryText, children: "No" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.logoutPrimaryButton, onPress: confirmSignOut, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.logoutPrimaryText, children: "Yes, log out" }) })] })] })] })) : null] }));
}
const styles = react_native_1.StyleSheet.create({
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
    generalTutorialWaves: { ...react_native_1.StyleSheet.absoluteFillObject },
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
    logoutOverlay: { ...react_native_1.StyleSheet.absoluteFillObject, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.38)" },
    logoutBackdrop: { ...react_native_1.StyleSheet.absoluteFillObject },
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
