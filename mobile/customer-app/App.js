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
const expo_constants_1 = __importDefault(require("expo-constants"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const Location = __importStar(require("expo-location"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const BiteHubSplash_1 = require("./components/BiteHubSplash");
const sessionStorageKey = "bitehub_customer_session";
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
const customerLogo = require("./assets/bitehub-icon.png");
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
    return [place.district, place.city, place.region, place.country].filter(Boolean).slice(0, 3).join(", ");
}
function App() {
    const [showSplash, setShowSplash] = (0, react_1.useState)(true);
    const [sessionReady, setSessionReady] = (0, react_1.useState)(false);
    const [session, setSession] = (0, react_1.useState)(null);
    const [activeTab, setActiveTab] = (0, react_1.useState)("home");
    const [activeScreen, setActiveScreen] = (0, react_1.useState)("browse");
    const [authMode, setAuthMode] = (0, react_1.useState)("signin");
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [restaurants, setRestaurants] = (0, react_1.useState)([]);
    const [collections, setCollections] = (0, react_1.useState)([]);
    const [selectedRestaurant, setSelectedRestaurant] = (0, react_1.useState)(null);
    const [selectedHighlights, setSelectedHighlights] = (0, react_1.useState)(null);
    const [menu, setMenu] = (0, react_1.useState)([]);
    const [orders, setOrders] = (0, react_1.useState)([]);
    const [favorites, setFavorites] = (0, react_1.useState)([]);
    const [addresses, setAddresses] = (0, react_1.useState)([]);
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [retentionOverview, setRetentionOverview] = (0, react_1.useState)(null);
    const [trackedOrder, setTrackedOrder] = (0, react_1.useState)(null);
    const [trackingDelivery, setTrackingDelivery] = (0, react_1.useState)(null);
    const [timeline, setTimeline] = (0, react_1.useState)([]);
    const [eta, setEta] = (0, react_1.useState)(null);
    const [supportMessage, setSupportMessage] = (0, react_1.useState)("");
    const [supportStatus, setSupportStatus] = (0, react_1.useState)(null);
    const [checkoutStatus, setCheckoutStatus] = (0, react_1.useState)(null);
    const [checkoutLoading, setCheckoutLoading] = (0, react_1.useState)(false);
    const [cart, setCart] = (0, react_1.useState)({});
    const [locationLabel, setLocationLabel] = (0, react_1.useState)(null);
    const [locationCoords, setLocationCoords] = (0, react_1.useState)(null);
    const [locationStatus, setLocationStatus] = (0, react_1.useState)(null);
    const [locating, setLocating] = (0, react_1.useState)(false);
    const [firstName, setFirstName] = (0, react_1.useState)("");
    const [lastName, setLastName] = (0, react_1.useState)("");
    const [phone, setPhone] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [resetToken, setResetToken] = (0, react_1.useState)("");
    const [resetPasswordValue, setResetPasswordValue] = (0, react_1.useState)("");
    const [authMessage, setAuthMessage] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [loadingAuth, setLoadingAuth] = (0, react_1.useState)(false);
    const [addressLabelInput, setAddressLabelInput] = (0, react_1.useState)("Home");
    const [addressInput, setAddressInput] = (0, react_1.useState)("");
    const [addressInstructions, setAddressInstructions] = (0, react_1.useState)("");
    const [selectedAddressId, setSelectedAddressId] = (0, react_1.useState)("");
    const [paymentMethod, setPaymentMethod] = (0, react_1.useState)("CASH");
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
    function resetAuthFeedback() {
        setError(null);
        setAuthMessage(null);
    }
    async function loadPublicData() {
        const [restaurantData, collectionData] = await Promise.all([request("/restaurants"), request("/collections")]);
        setRestaurants(restaurantData);
        setCollections(collectionData);
        if (!selectedRestaurant && restaurantData[0])
            await openRestaurant(restaurantData[0], false);
    }
    async function loadPrivateData(activeSession) {
        const [orderData, favoriteData, profileData, retentionData, addressData] = await Promise.all([
            request("/customers/orders", {}, activeSession),
            request("/customers/favorites", {}, activeSession),
            request("/customers/profile", {}, activeSession),
            request("/customers/retention-overview", {}, activeSession),
            request("/customers/addresses", {}, activeSession)
        ]);
        setOrders(orderData);
        setFavorites(favoriteData);
        setProfile(profileData);
        setRetentionOverview(retentionData);
        setAddresses(addressData);
        setSelectedAddressId((current) => current || addressData[0]?.id || "");
        setAddressInput((current) => current || addressData[0]?.fullAddress || profileData?.customerProfile?.defaultAddress || "");
    }
    async function loadTracking(orderId) {
        if (!session)
            return;
        const [etaData, timelineData, trackData] = await Promise.all([
            request(`/orders/${orderId}/eta`, {}, session),
            request(`/orders/${orderId}/timeline`, {}, session),
            request(`/orders/${orderId}/track`, {}, session)
        ]);
        setEta(etaData);
        setTimeline(timelineData);
        setTrackingDelivery(trackData);
    }
    async function callRider() {
        const riderPhone = trackingDelivery?.riderProfile?.user?.phone;
        if (!riderPhone) {
            setSupportStatus("Rider phone number is not available yet.");
            return;
        }
        const url = `tel:${riderPhone}`;
        const supported = await react_native_1.Linking.canOpenURL(url);
        if (!supported) {
            setSupportStatus("Phone calling is not available on this device.");
            return;
        }
        await react_native_1.Linking.openURL(url);
    }
    async function openRiderLocation() {
        const latitude = trackingDelivery?.riderProfile?.currentLatitude;
        const longitude = trackingDelivery?.riderProfile?.currentLongitude;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            setSupportStatus("Rider location is not available yet.");
            return;
        }
        const label = encodeURIComponent(`${trackingDelivery?.riderProfile?.user?.firstName ?? "Rider"} ${trackingDelivery?.riderProfile?.user?.lastName ?? ""}`.trim());
        const url = react_native_1.Platform.OS === "ios"
            ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
            : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
        const supported = await react_native_1.Linking.canOpenURL(url);
        if (!supported) {
            setSupportStatus("Unable to open maps on this device.");
            return;
        }
        await react_native_1.Linking.openURL(url);
    }
    async function createSupportTicket() {
        if (!session || !trackedOrder || !supportMessage.trim())
            return;
        setSupportStatus(null);
        try {
            await request(`/orders/${trackedOrder.id}/support`, {
                method: "POST",
                body: JSON.stringify({ severity: "MEDIUM", subject: "Need help with my order", message: supportMessage, source: "CUSTOMER" })
            }, session);
            setSupportStatus("Support request sent.");
            setSupportMessage("");
            await loadTracking(trackedOrder.id);
        }
        catch (err) {
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
        }
        catch (err) {
            setLocationStatus(err instanceof Error ? err.message : "Unable to load live location.");
        }
        finally {
            setLocating(false);
        }
    }
    (0, react_1.useEffect)(() => {
        void loadPublicData().catch((err) => setError(err instanceof Error ? err.message : "Unable to load restaurants."));
        void refreshLocation();
    }, []);
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
                await loadPrivateData(restored);
            }
            catch (err) {
                await async_storage_1.default.removeItem(sessionStorageKey);
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
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => setShowSplash(false), 2300);
        return () => clearTimeout(timer);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!session || !trackedOrder || activeScreen !== "tracking")
            return;
        const timer = setInterval(() => {
            void loadTracking(trackedOrder.id).catch((err) => setSupportStatus(err instanceof Error ? err.message : "Unable to refresh rider tracking."));
        }, 15000);
        return () => clearInterval(timer);
    }, [activeScreen, session, trackedOrder]);
    async function openRestaurant(restaurant, switchScreen = true) {
        setSelectedRestaurant(restaurant);
        if (switchScreen)
            setActiveScreen("menu");
        try {
            const [menuData, highlightData] = await Promise.all([
                request(`/restaurants/${restaurant.id}/menu`),
                request(`/restaurants/${restaurant.id}/highlights`)
            ]);
            setMenu(menuData);
            setSelectedHighlights(highlightData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load menu.");
        }
    }
    async function handleSignIn() {
        resetAuthFeedback();
        setLoadingAuth(true);
        try {
            const payload = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
            if (payload.user?.role !== "CUSTOMER")
                throw new Error("This account does not have customer access.");
            const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
            setSession(nextSession);
            await loadPrivateData(nextSession);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to sign in.");
        }
        finally {
            setLoadingAuth(false);
        }
    }
    async function handleSignUp() {
        resetAuthFeedback();
        setLoadingAuth(true);
        try {
            const payload = await request("/auth/register/customer", {
                method: "POST",
                body: JSON.stringify({ firstName, lastName, email, phone: phone.trim() || undefined, password, role: "CUSTOMER" })
            });
            const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
            setSession(nextSession);
            setAuthMode("signin");
            await loadPrivateData(nextSession);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create account.");
        }
        finally {
            setLoadingAuth(false);
        }
    }
    async function handleForgotPassword() {
        resetAuthFeedback();
        setLoadingAuth(true);
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
            setLoadingAuth(false);
        }
    }
    async function handleResetPassword() {
        resetAuthFeedback();
        setLoadingAuth(true);
        try {
            const payload = await request("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token: resetToken, password: resetPasswordValue })
            });
            setAuthMessage(payload.message);
            setPassword("");
            setResetPasswordValue("");
            setResetToken("");
            setAuthMode("signin");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to reset password.");
        }
        finally {
            setLoadingAuth(false);
        }
    }
    async function createGroupOrder() {
        if (!session || !selectedRestaurant)
            return;
        try {
            await request("/customers/group-orders", {
                method: "POST",
                body: JSON.stringify({
                    restaurantId: selectedRestaurant.id,
                    title: `${selectedRestaurant.name} squad order`,
                    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
                })
            }, session);
            await loadPrivateData(session);
            setSupportStatus("Group order created.");
        }
        catch (err) {
            setSupportStatus(err instanceof Error ? err.message : "Unable to create group order.");
        }
    }
    async function createScheduledOrder() {
        if (!session || !selectedRestaurant || !menu.length)
            return;
        const defaultAddressId = orders[0]?.deliveryAddressId;
        if (!defaultAddressId) {
            setSupportStatus("Add a delivery address before scheduling orders.");
            return;
        }
        try {
            await request("/customers/scheduled-orders", {
                method: "POST",
                body: JSON.stringify({
                    restaurantId: selectedRestaurant.id,
                    addressId: defaultAddressId,
                    title: `${selectedRestaurant.name} weekly reorder`,
                    cadenceLabel: "Every Friday evening",
                    nextRunAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    itemSummary: menu.slice(0, 2).map((item) => ({ menuItemId: item.id, quantity: 1, name: item.name }))
                })
            }, session);
            await loadPrivateData(session);
            setSupportStatus("Scheduled order created.");
        }
        catch (err) {
            setSupportStatus(err instanceof Error ? err.message : "Unable to create scheduled order.");
        }
    }
    async function createMealPlan() {
        if (!session)
            return;
        try {
            await request("/customers/meal-plans", {
                method: "POST",
                body: JSON.stringify({
                    title: "Balanced workweek plan",
                    goal: "Reliable lunches without overthinking it",
                    weeklyBudget: 25000,
                    mealsPerWeek: 5,
                    cuisineFocus: "Mixed favorites"
                })
            }, session);
            await loadPrivateData(session);
            setSupportStatus("Meal plan created.");
        }
        catch (err) {
            setSupportStatus(err instanceof Error ? err.message : "Unable to create meal plan.");
        }
    }
    async function placeOrder() {
        if (!session || !selectedRestaurant) {
            setCheckoutStatus("Open a restaurant menu before checking out.");
            return;
        }
        const cartItems = menu
            .filter((item) => (cart[item.id] ?? 0) > 0)
            .map((item) => ({
            menuItemId: item.id,
            quantity: cart[item.id],
            unitPrice: Number(item.price ?? 0),
            totalPrice: Number(item.price ?? 0) * (cart[item.id] ?? 0)
        }));
        if (!cartItems.length) {
            setCheckoutStatus("Add at least one item to continue.");
            return;
        }
        setCheckoutLoading(true);
        setCheckoutStatus(null);
        try {
            let deliveryAddressId = selectedAddressId;
            if (!deliveryAddressId) {
                if (!addressInput.trim() || !locationCoords) {
                    throw new Error("Add a delivery address and enable location before placing the order.");
                }
                const createdAddress = await request("/customers/addresses", {
                    method: "POST",
                    body: JSON.stringify({
                        label: addressLabelInput.trim() || "Delivery address",
                        fullAddress: addressInput.trim(),
                        latitude: locationCoords.latitude,
                        longitude: locationCoords.longitude,
                        instructions: addressInstructions.trim() || undefined
                    })
                }, session);
                deliveryAddressId = createdAddress.id;
            }
            const order = await request("/orders/checkout", {
                method: "POST",
                body: JSON.stringify({
                    restaurantId: selectedRestaurant.id,
                    deliveryAddressId,
                    subtotalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
                    deliveryFee: Number(selectedRestaurant.deliveryFee ?? 0),
                    discountAmount: 0,
                    totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0) + Number(selectedRestaurant.deliveryFee ?? 0),
                    customerNotes: addressInstructions.trim() || undefined,
                    paymentMethod,
                    items: cartItems
                })
            }, session);
            await loadPrivateData(session);
            setTrackedOrder(order);
            setTrackingDelivery(null);
            setTimeline([]);
            setEta(null);
            setCart({});
            setCheckoutStatus("Order placed successfully.");
            setActiveScreen("tracking");
            void loadTracking(order.id);
        }
        catch (err) {
            setCheckoutStatus(err instanceof Error ? err.message : "Unable to place order.");
        }
        finally {
            setCheckoutLoading(false);
        }
    }
    function signOut() {
        react_native_1.Alert.alert("Logout", "Do you want to logout", [
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
                }
            }
        ]);
    }
    const cartCount = (0, react_1.useMemo)(() => Object.values(cart).reduce((sum, count) => sum + count, 0), [cart]);
    const total = (0, react_1.useMemo)(() => menu.reduce((sum, item) => sum + (cart[item.id] ?? 0) * Number(item.price ?? 0), 0), [cart, menu]);
    const favoriteIds = favorites.map((item) => item.restaurantId ?? item.restaurant?.id);
    const featuredRestaurants = (0, react_1.useMemo)(() => restaurants.filter((restaurant) => restaurant.isFeatured).slice(0, 5), [restaurants]);
    const promoRestaurant = featuredRestaurants[0] ?? restaurants[0] ?? null;
    const displayedLocation = locationLabel ?? profile?.customerProfile?.defaultAddress ?? "Accra, Ghana";
    const filteredRestaurants = (0, react_1.useMemo)(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query)
            return restaurants;
        return restaurants.filter((restaurant) => [restaurant.name, restaurant.category?.name, restaurant.storyHeadline, restaurant.storyBody]
            .map((value) => String(value ?? "").toLowerCase())
            .some((value) => value.includes(query)));
    }, [restaurants, searchQuery]);
    const categoryChips = (0, react_1.useMemo)(() => {
        const names = Array.from(new Set(restaurants
            .map((restaurant) => restaurant.category?.name)
            .filter((value) => Boolean(value))));
        return names.slice(0, 4);
    }, [restaurants]);
    const popularItems = (0, react_1.useMemo)(() => {
        if (!selectedRestaurant || !menu.length)
            return [];
        return menu.slice(0, 4);
    }, [menu, selectedRestaurant]);
    const recentOrders = (0, react_1.useMemo)(() => orders.slice(0, 6), [orders]);
    const nav = ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.bottomNavWrap, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.bottomNav, children: [[
                    { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
                    { id: "orders", label: "Orders", icon: "receipt-outline", activeIcon: "receipt" },
                    { id: "saved", label: "Saved", icon: "heart-outline", activeIcon: "heart" },
                    { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" }
                ].map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.navItem, onPress: () => {
                        setActiveTab(item.id);
                        if (item.id === "home")
                            setActiveScreen("browse");
                    }, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: activeTab === item.id ? item.activeIcon : item.icon, size: 18, color: activeTab === item.id ? "#ffffff" : "#9ca3af" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.navLabel, activeTab === item.id && styles.navLabelActive], children: item.label })] }, item.id))), (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.navItem, onPress: () => {
                        setActiveTab("home");
                        setActiveScreen("cart");
                    }, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: activeScreen === "cart" ? "bag" : "bag-outline", size: 18, color: activeScreen === "cart" ? "#ffffff" : "#9ca3af" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.navLabel, activeScreen === "cart" && styles.navLabelActive], children: "Cart" }), cartCount > 0 ? (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.badge, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.badgeText, children: cartCount }) }) : null] })] }) }));
    const authForm = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authInline, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Access your BiteHub account." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: authMode === "signin"
                    ? "Sign in to load your live BiteHub orders, favorites, and profile."
                    : authMode === "signup"
                        ? "Create a new customer account and start ordering."
                        : "Request a reset token, then set a new password right here." }), authMode === "signup" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: firstName, onChangeText: setFirstName, placeholder: "First name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: lastName, onChangeText: setLastName, placeholder: "Last name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: phone, onChangeText: setPhone, placeholder: "Phone number", placeholderTextColor: "#9ca3af", style: styles.input, keyboardType: "phone-pad" })] })) : null, (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: email, onChangeText: setEmail, placeholder: "Email", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), authMode !== "forgot" ? (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: password, onChangeText: setPassword, placeholder: "Password", placeholderTextColor: "#9ca3af", style: styles.input, secureTextEntry: true }) : null, authMode === "forgot" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: resetToken, onChangeText: setResetToken, placeholder: "Reset token", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: resetPasswordValue, onChangeText: setResetPasswordValue, placeholder: "New password", placeholderTextColor: "#9ca3af", style: styles.input, secureTextEntry: true })] })) : null, error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, authMessage ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.success, children: authMessage }) : null, authMode === "signin" ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleSignIn(), disabled: loadingAuth, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loadingAuth ? "Signing in..." : "Sign in" }) })) : null, authMode === "signup" ? ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleSignUp(), disabled: loadingAuth, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loadingAuth ? "Creating account..." : "Create account" }) })) : null, authMode === "forgot" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleForgotPassword(), disabled: loadingAuth, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loadingAuth ? "Preparing..." : "Send reset token" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryGhostButton, onPress: () => void handleResetPassword(), disabled: loadingAuth, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryGhostText, children: loadingAuth ? "Updating..." : "Reset password" }) })] })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authLinks, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { resetAuthFeedback(); setAuthMode("signin"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "signin" && styles.authLinkActive], children: "Sign in" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { resetAuthFeedback(); setAuthMode("signup"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "signup" && styles.authLinkActive], children: "Sign up" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { resetAuthFeedback(); setAuthMode("forgot"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "forgot" && styles.authLinkActive], children: "Forgot password" }) })] })] }));
    const authGateScreen = ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.authGateScrollContent, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authGateShell, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authGateHero, children: [(0, jsx_runtime_1.jsx)(react_native_1.Image, { source: customerLogo, style: styles.brandLogoLarge, resizeMode: "contain" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.authGateTitle, children: "Access your BiteHub account." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.authGateCopy, children: "Sign in to load your live BiteHub orders, favorites, profile, and personalized delivery flows." })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.authGateCard, children: authForm })] }) }));
    if (showSplash || !sessionReady) {
        return (0, jsx_runtime_1.jsx)(BiteHubSplash_1.BiteHubSplash, { accentColor: "#cc0000", label: "BiteHub Customer", logoSource: customerLogo });
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_safe_area_context_1.SafeAreaView, { style: styles.safeArea, children: [(0, jsx_runtime_1.jsx)(expo_status_bar_1.StatusBar, { style: "dark" }), activeTab === "home" && activeScreen === "browse" ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [(0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.shopScroll, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shopHeader, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shopHeaderTop, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shopLocationPill, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "location-outline", size: 15, color: "#111827" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.shopLocationText, children: displayedLocation })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.shopCartButton, onPress: () => setActiveScreen("cart"), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "bag-handle-outline", size: 18, color: "#111827" }), cartCount > 0 ? (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.shopCartBadge, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.badgeText, children: cartCount }) }) : null] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.shopHeroTitle, children: "Get Your Favorite Dishes Delivered Fresh" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shopSearchBar, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "search-outline", size: 18, color: "#9ca3af" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: searchQuery, onChangeText: setSearchQuery, style: styles.shopSearchInput, placeholder: "Search", placeholderTextColor: "#9ca3af" }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => void refreshLocation(), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: locating ? "sync-outline" : "options-outline", size: 18, color: "#6b7280" }) })] }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, promoRestaurant ? ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.promoCard, onPress: () => void openRestaurant(promoRestaurant), children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.promoTextWrap, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.promoTitle, children: "Order a Set With 40% discount" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.promoButton, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.promoButtonText, children: "Order Now" }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.promoArt, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.foodOrbLarge }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.foodOrbSmall }), (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "fast-food", size: 68, color: "#8d2d00" })] })] })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sectionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.shopSectionTitle, children: "Category" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionLink, children: "See All" })] }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.categoryRow, children: (categoryChips.length ? categoryChips : ["Burger", "Pizza", "Meat", "Drinks"]).map((category, index) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: [styles.categoryChipCard, index === 0 && styles.categoryChipCardActive], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.categoryChipIcon, index === 0 && styles.categoryChipIconActive], children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: index % 2 === 0 ? "fast-food-outline" : "pizza-outline", size: 20, color: index === 0 ? "#d9480f" : "#6b7280" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.categoryChipText, index === 0 && styles.categoryChipTextActive], children: category })] }, category))) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sectionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.shopSectionTitle, children: "Popular Food" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionLink, children: "See All" })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.popularGrid, children: (popularItems.length ? popularItems : filteredRestaurants.slice(0, 4)).map((item, index) => {
                                    const title = item.name ?? item.restaurant?.name ?? "BiteHub";
                                    const subtitle = item.price ? formatMoney(Number(item.price ?? 0)) : item.category?.name ?? "Fresh pick";
                                    const badgeCount = item.price ? cart[item.id] ?? 0 : 0;
                                    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: [styles.foodCard, index % 2 === 0 ? styles.foodCardMint : styles.foodCardBlue], onPress: () => item.price ? setCart((current) => ({ ...current, [item.id]: (current[item.id] ?? 0) + 1 })) : void openRestaurant(item), children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.foodPlate, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: index % 2 === 0 ? "fast-food" : "pizza", size: 52, color: "#7c2d12" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.foodCardTitle, children: title }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.foodCardFooter, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.foodCardMeta, children: subtitle }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.foodCardCart, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "bag-handle", size: 14, color: "#ffffff" }), badgeCount > 0 ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.foodCardCartCount, children: badgeCount }) : null] })] })] }, item.id ?? `${title}-${index}`));
                                }) })] }), cartCount > 0 ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.footer, children: (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.checkout, onPress: () => setActiveScreen("cart"), children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.checkoutBadge, children: [cartCount, " item", cartCount > 1 ? "s" : ""] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.checkoutText, children: "Continue to payment" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.checkoutSubtext, children: "Tap here to review your order, address, and payment method." })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.checkoutAmount, children: formatMoney(total + Number(selectedRestaurant?.deliveryFee ?? 0)) })] }) })) : null, nav] })) : null, activeTab === "home" && activeScreen === "menu" ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [(0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.detailScroll, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailHero, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.detailTopButton, onPress: () => setActiveScreen("browse"), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "chevron-back", size: 18, color: "#111827" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.detailTopButton, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: favoriteIds.includes(selectedRestaurant?.id) ? "heart" : "heart-outline", size: 18, color: "#111827" }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.detailHeroPlate, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "fast-food", size: 128, color: "#8d2d00" }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailContent, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailTitle, children: selectedRestaurant?.name ?? "Restaurant" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailSubhead, children: selectedHighlights?.restaurant?.storyHeadline ?? "Taste the burger that brings joy to every bite." }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailPriceRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailPrice, children: formatMoney(Number(menu[0]?.price ?? selectedRestaurant?.averageMealPrice ?? 0)) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.detailFavButton, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "heart-outline", size: 18, color: "#6b7280" }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailMetaRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailMetaPill, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "star", size: 14, color: "#f59e0b" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailMetaText, children: selectedRestaurant?.ratingAverage?.toFixed?.(1) ?? "4.6" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailMetaPill, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "time-outline", size: 14, color: "#111827" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.detailMetaText, children: [selectedRestaurant?.deliveryTimeEstimateMin ?? 20, "-", selectedRestaurant?.deliveryTimeEstimateMax ?? 25, " min"] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailMetaPill, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "flame-outline", size: 14, color: "#111827" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.detailMetaText, children: [menu[0]?.calories ?? 110, " Kcal"] })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailOwnerRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.detailOwnerAvatar, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailOwnerInitial, children: selectedRestaurant?.name?.slice(0, 1) ?? "B" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailOwnerName, children: selectedHighlights?.restaurant?.chefNote ? "Chef Note" : "Prepared fresh" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailOwnerSubtext, children: selectedHighlights?.restaurant?.chefNote ?? "Loved by local customers for bold flavors and careful prep." })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailOwnerActions, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "chatbubble-ellipses-outline", size: 18, color: "#111827" }), (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "call-outline", size: 18, color: "#111827" })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailSectionTitle, children: "Description" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailDescription, children: selectedHighlights?.restaurant?.storyBody ?? selectedRestaurant?.description ?? "Burger Bang delivers house favorites with juicy patties, fresh toppings, and signature sauces built to satisfy every craving." }), (selectedHighlights?.dietaryTags ?? []).length ? (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tagWrap, children: selectedHighlights.dietaryTags.map((tag) => (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tagPill, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tagText, children: tag.name }) }, tag.id)) }) : null, (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailSectionTitle, children: "More from this kitchen" }), menu.map((item) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailMenuRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.detailMenuIcon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: item.isSignature ? "sparkles" : "restaurant-outline", size: 22, color: "#8d2d00" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailMenuTitle, children: item.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: item.description ?? "Freshly made and ready to order." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.price, children: formatMoney(Number(item.price ?? 0)) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.qtyRow, children: [(cart[item.id] ?? 0) > 0 ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.qtyAlt, onPress: () => setCart((current) => ({ ...current, [item.id]: Math.max(0, (current[item.id] ?? 0) - 1) })), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.qtyAltText, children: "-" }) }) : null, (cart[item.id] ?? 0) > 0 ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.qtyCount, children: cart[item.id] }) : null, (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.qty, onPress: () => setCart((current) => ({ ...current, [item.id]: (current[item.id] ?? 0) + 1 })), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.qtyText, children: "+" }) })] })] }, item.id))] })] }), cartCount > 0 ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailFooter, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailQuantityBar, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.detailQuantityButton, onPress: () => setCart((current) => { const next = { ...current }; const firstItem = menu[0]; if (!firstItem)
                                            return current; next[firstItem.id] = Math.max(0, (next[firstItem.id] ?? 0) - 1); return next; }), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.qtyAltText, children: "-" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailQuantityValue, children: cartCount }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.detailQuantityButton, onPress: () => setCart((current) => { const next = { ...current }; const firstItem = menu[0]; if (!firstItem)
                                            return current; next[firstItem.id] = (next[firstItem.id] ?? 0) + 1; return next; }), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.qtyAltText, children: "+" }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.detailCheckoutWrap, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailCheckoutHint, children: "Ready to pay?" }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.detailAddButton, onPress: () => setActiveScreen("cart"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.detailAddButtonText, children: "Continue to Checkout" }) })] })] }) : null] }) : null, activeTab === "home" && activeScreen === "cart" ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.headerRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.iconButton, onPress: () => setActiveScreen("menu"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.iconButtonText, children: "Back" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "Checkout" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.scroll, children: [menu.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.card, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.thumb, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.thumbText, children: item.name?.slice(0, 1) ?? "M" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: item.name }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Qty ", (cart[item.id] ?? 0)] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.price, children: formatMoney(Number(item.price ?? 0) * (cart[item.id] ?? 0)) })] })] }, item.id)), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Delivery Address" }), addresses.length ? (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.restaurantChoiceRow, children: addresses.map((address) => (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.restaurantChoice, selectedAddressId === address.id && styles.restaurantChoiceActive], onPress: () => { setSelectedAddressId(address.id); setAddressInput(address.fullAddress ?? ""); setAddressInstructions(address.instructions ?? ""); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.restaurantChoiceText, selectedAddressId === address.id && styles.restaurantChoiceTextActive], children: address.label }) }, address.id)) }) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "No saved addresses yet. Add one below." }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: addressLabelInput, onChangeText: setAddressLabelInput, placeholder: "Address label", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: addressInput, onChangeText: (value) => { setSelectedAddressId(""); setAddressInput(value); }, placeholder: "Full delivery address", placeholderTextColor: "#9ca3af", style: styles.input, multiline: true }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: addressInstructions, onChangeText: setAddressInstructions, placeholder: "Delivery instructions", placeholderTextColor: "#9ca3af", style: styles.input, multiline: true })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Payment Method" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.actionRow, children: ["CASH", "CARD", "MOBILE_MONEY"].map((method) => (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.toggleChip, paymentMethod === method && styles.toggleChipActive], onPress: () => setPaymentMethod(method), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.toggleChipText, paymentMethod === method && styles.toggleChipTextActive], children: method.replaceAll("_", " ") }) }, method)) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Order Summary" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Items total: ", formatMoney(total)] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Delivery fee: ", formatMoney(Number(selectedRestaurant?.deliveryFee ?? 0))] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.price, children: ["Total: ", formatMoney(total + Number(selectedRestaurant?.deliveryFee ?? 0))] }), checkoutStatus ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: checkoutStatus }) : null, (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void placeOrder(), disabled: checkoutLoading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: checkoutLoading ? "Placing order..." : "Place Order" }) })] })] })] }) : null, activeTab === "orders" ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [!session ? authGateScreen : (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.ordersScroll, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.ordersPageTitle, children: "Orders" }), recentOrders.map((order, index) => (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: [styles.orderShowcaseCard, index % 2 === 0 ? styles.orderShowcaseGreen : styles.orderShowcaseBlue], onPress: () => { setTrackedOrder(order); setActiveTab("home"); setActiveScreen("tracking"); void loadTracking(order.id); }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.orderShowcaseHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.orderBadge, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.orderBadgeText, children: order.restaurant?.name?.slice(0, 1) ?? "B" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.orderShowcaseTitle, children: order.restaurant?.name ?? "BiteHub Kitchen" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: String(order.status).replaceAll("_", " ") })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.orderPriceChip, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.orderPriceChipText, children: formatMoney(Number(order.totalAmount ?? 0)) }) })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.orderFoodHero, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: index % 2 === 0 ? "fast-food" : "pizza", size: 92, color: "#8d2d00" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.orderCourierRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.orderCourierAvatar, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.orderCourierInitial, children: order.rider?.user?.firstName?.slice(0, 1) ?? "A" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.detailOwnerName, children: [order.rider?.user?.firstName ?? "Assigned", " ", order.rider?.user?.lastName ?? "Rider"] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: order.deliveryAddress?.label ?? "Pickup and delivery in progress" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.orderActions, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "location-outline", size: 18, color: "#111827" }), (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "call-outline", size: 18, color: "#111827" })] })] })] }, order.id)), !recentOrders.length ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "No orders yet" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Once you place an order, it will appear here in the cleaner card stack." })] }) : null] }), nav] }) : null, activeTab === "saved" ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [!session ? authGateScreen : (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.scroll, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "Saved Restaurants" }), favorites.map((favorite) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.card, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.thumb, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.thumbText, children: favorite.restaurant?.name?.slice(0, 1) ?? "S" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: favorite.restaurant?.name ?? "Restaurant" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: favorite.restaurant?.address ?? "" })] })] }, favorite.id))] }), nav] }) : null, activeTab === "profile" ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [!session ? authGateScreen : (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.scroll, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "My Profile" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.profileCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.avatar, children: (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.avatarText, children: [profile?.firstName?.[0] ?? session.user.firstName[0], profile?.lastName?.[0] ?? session.user.lastName[0]] }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardTitle, children: [profile?.firstName ?? session.user.firstName, " ", profile?.lastName ?? session.user.lastName] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: profile?.email ?? session.user.email }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: profile?.customerProfile?.defaultAddress ?? "No default address set" })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Loyalty" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Tier: ", retentionOverview?.loyaltyWallet?.tier ?? profile?.customerProfile?.loyaltyWallet?.tier ?? "CORE"] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.price, children: [retentionOverview?.loyaltyWallet?.pointsBalance ?? profile?.customerProfile?.loyaltyWallet?.pointsBalance ?? 0, " points"] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.actionRow, children: (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void createMealPlan(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: "Create meal plan" }) }) }), supportStatus ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: supportStatus }) : null] }), retentionOverview?.subscriptions?.length ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Subscriptions" }), retentionOverview.subscriptions.map((subscription) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.collectionReason, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitleSmall, children: subscription.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: subscription.benefitsSummary })] }, subscription.id))] }) : null, retentionOverview?.mealPlans?.length ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Meal plans" }), retentionOverview.mealPlans.map((plan) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.collectionReason, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitleSmall, children: plan.title }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [plan.goal ?? "Personal plan", " | ", plan.mealsPerWeek, " meals/week"] })] }, plan.id))] }) : null, retentionOverview?.scheduledOrders?.length ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Scheduled orders" }), retentionOverview.scheduledOrders.map((scheduled) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.collectionReason, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitleSmall, children: scheduled.title }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [scheduled.restaurant?.name ?? "Restaurant", " | ", scheduled.cadenceLabel] })] }, scheduled.id))] }) : null, retentionOverview?.reorderSuggestions?.length ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Reorder suggestions" }), retentionOverview.reorderSuggestions.map((suggestion) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.collectionReason, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitleSmall, children: suggestion.restaurantName }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: (suggestion.topItems ?? []).join(", ") })] }, suggestion.orderId))] }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Account" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Sign out of your BiteHub customer session on this device." }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: signOut, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: "Sign Out" }) })] })] }), nav] }) : null, activeTab === "home" && activeScreen === "tracking" ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.shell, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.headerRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.iconButton, onPress: () => setActiveScreen("browse"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.iconButtonText, children: "Back" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "Track Order" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.scroll, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: trackedOrder?.restaurant?.name ?? selectedRestaurant?.name ?? "BiteHub order" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: trackedOrder?.id ?? "Live tracking" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.price, children: ["ETA ", eta?.etaMinutes ?? "--", " min | ", eta?.confidencePercent ?? "--", "% confidence"] }), eta?.delayReason ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: eta.delayReason }) : null] }), trackingDelivery?.riderProfile ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Your rider" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [trackingDelivery.riderProfile.user?.firstName ?? "Rider", " ", trackingDelivery.riderProfile.user?.lastName ?? "", trackingDelivery.riderProfile.vehicleType ? ` | ${trackingDelivery.riderProfile.vehicleType}` : ""] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: typeof trackingDelivery.riderProfile.currentLatitude === "number" && typeof trackingDelivery.riderProfile.currentLongitude === "number" ? `Last known location: ${trackingDelivery.riderProfile.currentLatitude.toFixed(5)}, ${trackingDelivery.riderProfile.currentLongitude.toFixed(5)}` : "Live rider location will appear once the rider is active." }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void callRider(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: "Call rider" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void openRiderLocation(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: "Open rider location" }) })] })] }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Timeline" }), timeline.length ? timeline.map((event) => (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.timelineRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.timelineDot }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitleSmall, children: event.title }), event.description ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: event.description }) : null] })] }, event.id)) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Tracking data will appear here when the order moves." })] }), session && trackedOrder ? (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.summary, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: "Need help?" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: supportMessage, onChangeText: setSupportMessage, placeholder: "Describe the issue with this order", placeholderTextColor: "#9ca3af", style: styles.input }), supportStatus ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: supportStatus }) : null, (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void createSupportTicket(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: "Contact Support" }) })] }) : null] })] }) : null] }));
}
const pill = { borderRadius: 999, overflow: "hidden" };
const styles = react_native_1.StyleSheet.create({
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
    toggleChipTextActive: { color: "#c2410c" }
});
