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
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const BiteHubSplash_1 = require("./components/BiteHubSplash");
const sessionStorageKey = "bitehub_vendor_session";
const queryClient = new react_query_1.QueryClient({
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
const vendorLogo = require("./assets/bitehub-icon.png");
const currencyFormatter = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2
});
function formatMoney(value) {
    return currencyFormatter.format(Number(value ?? 0));
}
const statusAccent = {
    PENDING: { bg: "#dbeafe", text: "#1d4ed8", label: "New" },
    ACCEPTED: { bg: "#fef3c7", text: "#b45309", label: "Accepted" },
    PREPARING: { bg: "#ffedd5", text: "#c2410c", label: "Preparing" },
    READY_FOR_PICKUP: { bg: "#dcfce7", text: "#15803d", label: "Ready" },
    REJECTED: { bg: "#fee2e2", text: "#dc2626", label: "Rejected" },
    DELIVERED: { bg: "#f3f4f6", text: "#6b7280", label: "Delivered" }
};
const orderFilters = [
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
function normalizeOpeningHours(input) {
    if (!Array.isArray(input) || !input.length) {
        return openingHoursTemplate.map((row) => ({ ...row }));
    }
    return openingHoursTemplate.map((row, index) => {
        const match = input.find((entry) => entry?.label === row.label) ?? input[index];
        return {
            label: row.label,
            open: String(match?.open ?? row.open),
            close: String(match?.close ?? row.close),
            isClosed: Boolean(match?.isClosed ?? row.isClosed)
        };
    });
}
function App() {
    return ((0, jsx_runtime_1.jsx)(react_query_1.QueryClientProvider, { client: queryClient, children: (0, jsx_runtime_1.jsx)(AppContent, {}) }));
}
function AppContent() {
    const [showSplash, setShowSplash] = (0, react_1.useState)(true);
    const [sessionReady, setSessionReady] = (0, react_1.useState)(false);
    const [session, setSession] = (0, react_1.useState)(null);
    const tanstackQueryClient = (0, react_query_1.useQueryClient)();
    const [activeTab, setActiveTab] = (0, react_1.useState)("dashboard");
    const [authMode, setAuthMode] = (0, react_1.useState)("signin");
    const [orderFilter, setOrderFilter] = (0, react_1.useState)("all");
    const [firstName, setFirstName] = (0, react_1.useState)("");
    const [lastName, setLastName] = (0, react_1.useState)("");
    const [businessName, setBusinessName] = (0, react_1.useState)("");
    const [phone, setPhone] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [resetToken, setResetToken] = (0, react_1.useState)("");
    const [resetPasswordValue, setResetPasswordValue] = (0, react_1.useState)("");
    const [error, setError] = (0, react_1.useState)(null);
    const [authMessage, setAuthMessage] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [dashboard, setDashboard] = (0, react_1.useState)(null);
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [orders, setOrders] = (0, react_1.useState)([]);
    const [restaurants, setRestaurants] = (0, react_1.useState)([]);
    const [menuItems, setMenuItems] = (0, react_1.useState)([]);
    const [forecasts, setForecasts] = (0, react_1.useState)(null);
    const [settingsSaving, setSettingsSaving] = (0, react_1.useState)(false);
    const [editingPayout, setEditingPayout] = (0, react_1.useState)(false);
    const [menuFormOpen, setMenuFormOpen] = (0, react_1.useState)(false);
    const [restaurantFormOpen, setRestaurantFormOpen] = (0, react_1.useState)(false);
    const [editingItemId, setEditingItemId] = (0, react_1.useState)(null);
    const [selectedRestaurantId, setSelectedRestaurantId] = (0, react_1.useState)("");
    const [settingsDraft, setSettingsDraft] = (0, react_1.useState)({
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
    const [menuDraft, setMenuDraft] = (0, react_1.useState)({
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
    const [editingRestaurantId, setEditingRestaurantId] = (0, react_1.useState)(null);
    const [restaurantDraft, setRestaurantDraft] = (0, react_1.useState)({
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
    const [busyItemId, setBusyItemId] = (0, react_1.useState)(null);
    const [busyOrderId, setBusyOrderId] = (0, react_1.useState)(null);
    const [busyRestaurantId, setBusyRestaurantId] = (0, react_1.useState)(null);
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
    async function fetchVendorDataBundle(activeSession) {
        const [dashboardData, orderData, restaurantData, menuData, forecastData, notificationData] = await Promise.all([
            request("/vendors/dashboard", {}, activeSession),
            request("/vendors/orders", {}, activeSession),
            request("/vendors/restaurants/me", {}, activeSession),
            request("/vendors/menu-items", {}, activeSession),
            request("/vendors/forecasts", {}, activeSession),
            request("/notifications", {}, activeSession)
        ]);
        return { dashboardData, orderData, restaurantData, menuData, forecastData, notificationData };
    }
    function applyVendorBundle(bundle) {
        setDashboard(bundle.dashboardData);
        setOrders(bundle.orderData);
        setRestaurants(bundle.restaurantData);
        setMenuItems(bundle.menuData);
        setForecasts(bundle.forecastData);
        setNotifications(bundle.notificationData);
        setSelectedRestaurantId((current) => current || bundle.restaurantData[0]?.id || "");
    }
    const vendorDataQuery = (0, react_query_1.useQuery)({
        queryKey: ["vendor-data", session?.user?.email ?? "guest"],
        queryFn: () => fetchVendorDataBundle(session),
        enabled: Boolean(session)
    });
    async function loadVendorData(activeSession) {
        const bundle = await tanstackQueryClient.fetchQuery({
            queryKey: ["vendor-data", activeSession.user.email ?? activeSession.user.firstName ?? "vendor"],
            queryFn: () => fetchVendorDataBundle(activeSession)
        });
        applyVendorBundle(bundle);
    }
    (0, react_1.useEffect)(() => {
        if (vendorDataQuery.data) {
            applyVendorBundle(vendorDataQuery.data);
        }
    }, [vendorDataQuery.data]);
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
                await loadVendorData(restored);
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
    async function handleSignIn() {
        clearAuthFeedback();
        setLoading(true);
        try {
            const payload = await request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            if (payload.user?.role !== "VENDOR")
                throw new Error("This account does not have vendor access.");
            const nextSession = { accessToken: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user };
            setSession(nextSession);
            await loadVendorData(nextSession);
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
            const payload = await request("/auth/register/vendor", {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create vendor account.");
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
    async function updateRestaurantMode(restaurantId, operatingMode) {
        if (!session)
            return;
        setBusyRestaurantId(restaurantId);
        setError(null);
        try {
            await request("/vendors/operating-state", {
                method: "PATCH",
                body: JSON.stringify({
                    restaurantId,
                    operatingMode,
                    pauseReason: operatingMode === "PAUSED" ? "Paused from vendor app" : undefined
                })
            }, session);
            await loadVendorData(session);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update operating state.");
        }
        finally {
            setBusyRestaurantId(null);
        }
    }
    async function updateOrderStatus(orderId, status) {
        if (!session)
            return;
        setBusyOrderId(orderId);
        setError(null);
        try {
            await request(`/vendors/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, session);
            await loadVendorData(session);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update order status.");
        }
        finally {
            setBusyOrderId(null);
        }
    }
    async function saveVendorSettings(nextDraft = settingsDraft) {
        if (!session || !selectedSettingsRestaurant)
            return;
        setSettingsSaving(true);
        setError(null);
        try {
            const refreshed = await request("/vendors/settings", {
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
            }, session);
            setDashboard(refreshed);
            setRestaurants(refreshed?.restaurants ?? []);
            const refreshedRestaurant = (refreshed?.restaurants ?? []).find((restaurant) => restaurant.id === selectedSettingsRestaurant.id) ??
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to save vendor settings.");
        }
        finally {
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
    function startEditItem(item) {
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
    function startEditRestaurant(restaurant) {
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
            }
            else {
                await request("/vendors/menu-items", { method: "POST", body: JSON.stringify(payload) }, session);
            }
            await loadVendorData(session);
            resetMenuDraft();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to save menu item.");
        }
        finally {
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
        const nextImage = asset.base64 && asset.mimeType ? `data:${asset.mimeType};base64,${asset.base64}` : asset.uri;
        setMenuDraft((current) => ({
            ...current,
            imageUrl: nextImage
        }));
    }
    async function toggleItemAvailability(item) {
        if (!session)
            return;
        setBusyItemId(item.id);
        setError(null);
        try {
            await request(`/vendors/menu-items/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: item.status === "AVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE" })
            }, session);
            await loadVendorData(session);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update item availability.");
        }
        finally {
            setBusyItemId(null);
        }
    }
    async function deleteItem(itemId) {
        if (!session)
            return;
        setBusyItemId(itemId);
        setError(null);
        try {
            await request(`/vendors/menu-items/${itemId}`, { method: "DELETE" }, session);
            await loadVendorData(session);
            if (editingItemId === itemId)
                resetMenuDraft();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete item.");
        }
        finally {
            setBusyItemId(null);
        }
    }
    async function submitRestaurant() {
        if (!session)
            return;
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
            }
            else {
                await request("/vendors/restaurants", { method: "POST", body: JSON.stringify(payload) }, session);
            }
            await loadVendorData(session);
            resetRestaurantDraft();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to save restaurant.");
        }
        finally {
            setBusyRestaurantId(null);
        }
    }
    function signOut() {
        react_native_1.Alert.alert("Logout", "Do you want to logout", [
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
    (0, react_1.useEffect)(() => {
        if (!session)
            return;
        void loadVendorData(session).catch((err) => setError(err instanceof Error ? err.message : "Unable to refresh vendor data."));
    }, [session]);
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => setShowSplash(false), 2300);
        return () => clearTimeout(timer);
    }, []);
    const selectedSettingsRestaurant = (0, react_1.useMemo)(() => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? restaurants[0] ?? null, [restaurants, selectedRestaurantId]);
    const vendorName = dashboard?.businessName ?? (businessName || "BiteHub Vendor");
    const vendorDisplayName = session ? `${session.user.firstName} ${session.user.lastName}`.trim() : "Vendor";
    const liveRestaurants = restaurants.filter((restaurant) => restaurant.operatingMode === "LIVE");
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);
    const pendingOrders = orders.filter((order) => order.status === "PENDING");
    const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
    const vendorPayoutForOrder = (order) => Number(order?.settlement?.vendorPayoutAmount ?? order?.subtotalAmount ?? 0);
    const grossSalesForOrder = (order) => Number(order?.settlement?.vendorGrossSales ?? order?.subtotalAmount ?? order?.totalAmount ?? 0);
    const averageRating = restaurants.length
        ? restaurants.reduce((sum, restaurant) => sum + Number(restaurant.averageRating ?? 0), 0) / restaurants.length
        : 0;
    const payoutDue = (0, react_1.useMemo)(() => orders.reduce((sum, order) => sum + vendorPayoutForOrder(order), 0), [orders]);
    const grossSales = (0, react_1.useMemo)(() => orders.reduce((sum, order) => sum + grossSalesForOrder(order), 0), [orders]);
    const topItems = (0, react_1.useMemo)(() => [...menuItems].sort((a, b) => Number(b?._count?.orderItems ?? 0) - Number(a?._count?.orderItems ?? 0)).slice(0, 5), [menuItems]);
    const groupedMenuItems = (0, react_1.useMemo)(() => {
        return menuItems.reduce((groups, item) => {
            const key = item.category?.name ?? item.restaurant?.name ?? "Menu";
            groups[key] = [...(groups[key] ?? []), item];
            return groups;
        }, {});
    }, [menuItems]);
    const filteredOrders = (0, react_1.useMemo)(() => {
        if (orderFilter === "all")
            return orders;
        const statusMap = {
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
    const restaurantCreator = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: editingRestaurantId ? "Edit Restaurant" : restaurants.length ? "Add Restaurant" : "Create Your First Restaurant" }), !restaurantFormOpen ? ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.primarySmallButton, onPress: () => setRestaurantFormOpen(true), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "add", size: 14, color: "#ffffff" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryMiniButtonText, children: "New" })] })) : null] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Each vendor account can manage multiple restaurants. Add or update one here to keep your dashboard and menu tools current." }), restaurantFormOpen ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.name, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, name: value })), placeholder: "Restaurant name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.address, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, address: value })), placeholder: "Restaurant address", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.description, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, description: value })), placeholder: "Short description", placeholderTextColor: "#9ca3af", style: styles.input, multiline: true }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.storyHeadline, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, storyHeadline: value })), placeholder: "Story headline", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.storyBody, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, storyBody: value })), placeholder: "Story body", placeholderTextColor: "#9ca3af", style: styles.input, multiline: true }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.inlineInputs, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.deliveryFee, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, deliveryFee: value })), placeholder: "Delivery fee", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput], keyboardType: "numeric" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.minimumOrderAmount, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, minimumOrderAmount: value })), placeholder: "Minimum order", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput], keyboardType: "numeric" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.inlineInputs, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.estimatedDeliveryMins, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, estimatedDeliveryMins: value })), placeholder: "Delivery mins", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput], keyboardType: "numeric" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: restaurantDraft.priceBand, onChangeText: (value) => setRestaurantDraft((current) => ({ ...current, priceBand: value })), placeholder: "Price band", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryMiniButton, onPress: () => void submitRestaurant(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryMiniButtonText, children: busyRestaurantId === (editingRestaurantId ?? "create") ? "Saving..." : editingRestaurantId ? "Save restaurant" : "Create restaurant" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.outlineButton, onPress: resetRestaurantDraft, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.outlineButtonText, children: "Cancel" }) })] })] })) : null] }));
    const weeklyRevenue = (0, react_1.useMemo)(() => {
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
                if (diff >= 0 && diff < 7)
                    totals[diff] += vendorPayoutForOrder(order);
            }
        });
        const max = Math.max(...totals, 1);
        return totals.map((value, index) => ({ label: labels[index], value, height: Math.max(12, Math.round((value / max) * 100)) }));
    }, [orders]);
    (0, react_1.useEffect)(() => {
        if (!dashboard)
            return;
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
        return (0, jsx_runtime_1.jsx)(BiteHubSplash_1.BiteHubSplash, { accentColor: "#cc0000", label: "BiteHub Vendor", logoSource: vendorLogo, subtitle: "Own the rush with confidence." });
    }
    if (!session) {
        return ((0, jsx_runtime_1.jsxs)(react_native_safe_area_context_1.SafeAreaView, { style: styles.safeArea, children: [(0, jsx_runtime_1.jsx)(expo_status_bar_1.StatusBar, { style: "dark" }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: styles.authScrollContent, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authShell, children: [(0, jsx_runtime_1.jsx)(react_native_1.Image, { source: vendorLogo, style: styles.authLogo, resizeMode: "contain" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroTitle, children: "Run a restaurant brand, not just an order queue." }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.body, children: "Create a vendor account, recover access, or sign in to manage live BiteHub restaurants." }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "VENDOR APP" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardTitle, children: authMode === "signin" ? "Sign in to manage your store." : authMode === "signup" ? "Create your vendor account." : "Reset your vendor password." }), authMode === "signup" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: firstName, onChangeText: setFirstName, placeholder: "First name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: lastName, onChangeText: setLastName, placeholder: "Last name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: businessName, onChangeText: setBusinessName, placeholder: "Business name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: phone, onChangeText: setPhone, placeholder: "Phone number", placeholderTextColor: "#9ca3af", style: styles.input })] })) : null, (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: email, onChangeText: setEmail, placeholder: "Email", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), authMode !== "forgot" ? (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: password, onChangeText: setPassword, placeholder: "Password", placeholderTextColor: "#9ca3af", style: styles.input, secureTextEntry: true }) : null, authMode === "forgot" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: resetToken, onChangeText: setResetToken, placeholder: "Reset token", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: resetPasswordValue, onChangeText: setResetPasswordValue, placeholder: "New password", placeholderTextColor: "#9ca3af", style: styles.input, secureTextEntry: true })] })) : null, error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, authMessage ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.success, children: authMessage }) : null, authMode === "signin" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleSignIn(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loading ? "Signing in..." : "Sign in" }) }) : null, authMode === "signup" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleSignUp(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loading ? "Creating..." : "Create account" }) }) : null, authMode === "forgot" ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: () => void handleForgotPassword(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: loading ? "Preparing..." : "Send reset token" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.secondaryButton, onPress: () => void handleResetPassword(), disabled: loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.secondaryButtonText, children: loading ? "Updating..." : "Reset password" }) })] }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.authLinks, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { clearAuthFeedback(); setAuthMode("signin"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "signin" && styles.authLinkActive], children: "Sign in" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { clearAuthFeedback(); setAuthMode("signup"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "signup" && styles.authLinkActive], children: "Sign up" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => { clearAuthFeedback(); setAuthMode("forgot"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.authLink, authMode === "forgot" && styles.authLinkActive], children: "Forgot password" }) })] })] })] }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_safe_area_context_1.SafeAreaView, { style: styles.safeArea, children: [(0, jsx_runtime_1.jsx)(expo_status_bar_1.StatusBar, { style: "dark" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.headerLeft, children: [(0, jsx_runtime_1.jsx)(react_native_1.Image, { source: vendorLogo, style: styles.logoBadge, resizeMode: "contain" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: vendorDisplayName }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.subtle, children: [vendorName, " \u00B7 ", liveRestaurants.length ? `${liveRestaurants.length} live restaurant${liveRestaurants.length > 1 ? "s" : ""}` : "No restaurant connected yet"] })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.headerRight, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.notificationIcon, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "notifications-outline", size: 18, color: "#6b7280" }), unreadNotifications.length ? (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.notificationBadge, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.notificationBadgeText, children: unreadNotifications.length }) }) : null] }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { contentContainerStyle: styles.scroll, showsVerticalScrollIndicator: false, children: [error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, activeTab === "dashboard" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroLabel, children: "Estimated payout" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroValue, children: formatMoney(payoutDue) }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.heroSub, children: ["Net vendor earnings after BiteHub commission across ", orders.length, " orders"] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.statGrid, children: [
                                    { label: "Orders Today", value: String(orders.length), sub: `${pendingOrders.length} pending`, icon: "receipt-outline", color: "#3b82f6" },
                                    { label: "Avg. Rating", value: averageRating ? averageRating.toFixed(1) : "--", sub: `${restaurants.length} restaurants`, icon: "star-outline", color: "#f59e0b" },
                                    { label: "Menu Items", value: String(menuItems.length), sub: `${topItems.length} active leaders`, icon: "restaurant-outline", color: "#f97316" },
                                    { label: "Delivered", value: String(deliveredOrders.length), sub: "Completed fulfillment", icon: "checkmark-circle-outline", color: "#22c55e" }
                                ].map((card) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.statIcon, { backgroundColor: card.color }], children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: card.icon, size: 16, color: "#ffffff" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statValue, children: card.value }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: card.label }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statSub, children: card.sub })] }, card.label))) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "New Orders" }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => setActiveTab("orders"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.inlineAction, children: "View all" }) })] }), pendingOrders.length ? pendingOrders.slice(0, 4).map((order) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.orderCardCompact, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: order.id }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [order.customer?.firstName ?? "Customer", " ", order.customer?.lastName ?? ""] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: (order.items ?? []).map((item) => `${item.menuItem?.name ?? "Item"} x${item.quantity}`).join(", ") || "No order items" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metric, children: formatMoney(Number(order.totalAmount ?? 0)) })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryMiniButton, onPress: () => void updateOrderStatus(order.id, "ACCEPTED"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryMiniButtonText, children: busyOrderId === order.id ? "..." : "Accept" }) })] }, order.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No new orders right now." })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Alerts" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.inlineAction, children: [unreadNotifications.length, " unread"] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => void markAllNotificationsRead(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.inlineAction, children: "Mark all read" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => void clearReadNotifications(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.inlineAction, children: "Clear read" }) })] })] }), notifications.length ? notifications.slice(0, 4).map((notification) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.listRow, onPress: () => void markNotificationRead(notification.id), children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.settingIcon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "notifications-outline", size: 16, color: "#f97316" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: notification.title }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: notification.body })] })] }, notification.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "Order alerts will appear here as customers place new orders." })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Top Selling Items" }), topItems.length ? topItems.map((item, index) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.listRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.rankChip, children: ["#", index + 1] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: item.name }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [item.restaurant?.name ?? "Restaurant", " | ", item._count?.orderItems ?? 0, " orders"] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metric, children: formatMoney(Number(item.price ?? 0)) })] }, item.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No menu sales yet. Add your first item to start tracking demand." })] }), restaurantCreator] })) : null, activeTab === "orders" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.filterRow, children: orderFilters.map((filter) => ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.filterChip, orderFilter === filter.id && styles.filterChipActive], onPress: () => setOrderFilter(filter.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.filterChipText, orderFilter === filter.id && styles.filterChipTextActive], children: filter.label }) }, filter.id))) }), filteredOrders.length ? filteredOrders.map((order) => {
                                const accent = statusAccent[order.status] ?? statusAccent.PENDING;
                                return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: order.id }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [order.customer?.firstName ?? "Customer", " ", order.customer?.lastName ?? "", " | ", order.restaurant?.name ?? "Restaurant"] })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.statusPill, { backgroundColor: accent.bg }], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.statusPillText, { color: accent.text }], children: accent.label }) })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: (order.items ?? []).map((item) => `${item.menuItem?.name ?? "Item"} x${item.quantity}`).join(", ") || "No order items" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: order.deliveryAddress?.fullAddress ?? "No delivery address available" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metric, children: formatMoney(Number(order.totalAmount ?? 0)) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [order.status === "PENDING" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.chipButton, onPress: () => void updateOrderStatus(order.id, "ACCEPTED"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.chipText, children: busyOrderId === order.id ? "..." : "Accept" }) }) : null, order.status === "PENDING" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.outlineButton, onPress: () => void updateOrderStatus(order.id, "REJECTED"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.outlineButtonText, children: "Reject" }) }) : null, order.status === "ACCEPTED" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.chipButton, onPress: () => void updateOrderStatus(order.id, "PREPARING"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.chipText, children: busyOrderId === order.id ? "..." : "Start Prep" }) }) : null, order.status === "PREPARING" ? (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.chipButton, onPress: () => void updateOrderStatus(order.id, "READY_FOR_PICKUP"), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.chipText, children: busyOrderId === order.id ? "..." : "Mark Ready" }) }) : null] })] }, order.id));
                            }) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No orders match this filter yet." })] })) : null, activeTab === "menu" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Menu Items" }), (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.primarySmallButton, onPress: startCreateItem, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "add", size: 14, color: "#ffffff" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primarySmallButtonText, children: "Add Item" })] })] }), !restaurants.length ? restaurantCreator : null, menuFormOpen ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: editingItemId ? "Edit Item" : "Add New Item" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Everything saved here goes straight to your real vendor menu." }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.restaurantChoiceRow, children: restaurants.map((restaurant) => ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.restaurantChoice, selectedRestaurantId === restaurant.id && styles.restaurantChoiceActive], onPress: () => setSelectedRestaurantId(restaurant.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.restaurantChoiceText, selectedRestaurantId === restaurant.id && styles.restaurantChoiceTextActive], children: restaurant.name }) }, restaurant.id))) }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.name, onChangeText: (value) => setMenuDraft((current) => ({ ...current, name: value })), placeholder: "Item name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.description, onChangeText: (value) => setMenuDraft((current) => ({ ...current, description: value })), placeholder: "Description", placeholderTextColor: "#9ca3af", style: styles.input, multiline: true }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.imagePickerRow, children: [menuDraft.imageUrl ? (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: menuDraft.imageUrl }, style: styles.menuPreviewImage, resizeMode: "cover" }) : (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuPreviewPlaceholder, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "image-outline", size: 20, color: "#9ca3af" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryMiniButton, onPress: () => void pickMenuImage(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryMiniButtonText, children: menuDraft.imageUrl ? "Change image" : "Pick image" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Image is stored with the menu item and can be reused across BiteHub surfaces." })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.imageUrl, onChangeText: (value) => setMenuDraft((current) => ({ ...current, imageUrl: value })), placeholder: "Image URL (optional)", placeholderTextColor: "#9ca3af", style: styles.input, autoCapitalize: "none" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.price, onChangeText: (value) => setMenuDraft((current) => ({ ...current, price: value })), placeholder: "Price (GHS)", placeholderTextColor: "#9ca3af", style: styles.input, keyboardType: "numeric" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.preparationMins, onChangeText: (value) => setMenuDraft((current) => ({ ...current, preparationMins: value })), placeholder: "Preparation minutes", placeholderTextColor: "#9ca3af", style: styles.input, keyboardType: "numeric" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.badgeText, onChangeText: (value) => setMenuDraft((current) => ({ ...current, badgeText: value })), placeholder: "Badge text (optional)", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.inlineInputs, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.spiceLevel, onChangeText: (value) => setMenuDraft((current) => ({ ...current, spiceLevel: value })), placeholder: "Spice", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput], keyboardType: "numeric" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: menuDraft.calories, onChangeText: (value) => setMenuDraft((current) => ({ ...current, calories: value })), placeholder: "Calories", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput], keyboardType: "numeric" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.toggleChip, menuDraft.isSignature && styles.toggleChipActive], onPress: () => setMenuDraft((current) => ({ ...current, isSignature: !current.isSignature })), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.toggleChipText, menuDraft.isSignature && styles.toggleChipTextActive], children: "Signature" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.toggleChip, menuDraft.isFeatured && styles.toggleChipActive], onPress: () => setMenuDraft((current) => ({ ...current, isFeatured: !current.isFeatured })), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.toggleChipText, menuDraft.isFeatured && styles.toggleChipTextActive], children: "Featured" }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryMiniButton, onPress: () => void submitMenuItem(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryMiniButtonText, children: busyItemId === (editingItemId ?? "new") ? "Saving..." : editingItemId ? "Save changes" : "Create item" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.outlineButton, onPress: resetMenuDraft, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.outlineButtonText, children: "Cancel" }) })] })] })) : null, Object.entries(groupedMenuItems).length ? Object.entries(groupedMenuItems).map(([group, items]) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuSectionTitle, children: group }), items.map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuItemCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuThumb, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "restaurant-outline", size: 20, color: "#f97316" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: item.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metric, children: formatMoney(Number(item.price ?? 0)) }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [item._count?.orderItems ?? 0, " orders total"] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: item.description ?? "No description yet." })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.iconActionColumn, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => void toggleItemAvailability(item), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: item.status === "AVAILABLE" ? "eye-outline" : "eye-off-outline", size: 20, color: item.status === "AVAILABLE" ? "#16a34a" : "#9ca3af" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => startEditItem(item), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "create-outline", size: 18, color: "#6b7280" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => void deleteItem(item.id), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "trash-outline", size: 18, color: "#f87171" }) })] })] }, item.id)))] }, group))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No menu items yet. Add your first item to start taking orders." })] })) : null, activeTab === "analytics" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.analyticsGrid, children: [
                                    { label: "Vendor Payout", value: formatMoney(payoutDue), sub: "Net amount due after BiteHub commission" },
                                    { label: "Total Orders", value: String(orders.length), sub: `${deliveredOrders.length} delivered` },
                                    { label: "Gross Sales", value: formatMoney(grossSales), sub: "Customer food spend before platform deductions" },
                                    { label: "Avg. Order Value", value: orders.length ? formatMoney(Math.round(grossSales / orders.length)) : formatMoney(0), sub: "Average gross food value per order" },
                                    { label: "Menu Reach", value: String(menuItems.length), sub: "Active menu items tracked" }
                                ].map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: item.label }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.analyticsValue, children: item.value }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: item.sub })] }, item.label))) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Revenue by Day" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.barRow, children: weeklyRevenue.map((day, index) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.barItem, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.barFill, index === weeklyRevenue.length - 2 ? styles.barFillActive : null, { height: `${day.height}%` }] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.barLabel, children: day.label })] }, `${day.label}-${index}`))) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Forecasts" }), (forecasts?.forecasts ?? []).length ? (forecasts?.forecasts ?? []).map((forecast) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.listRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: forecast.restaurant?.name ?? "Restaurant" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: forecast.windowLabel ?? String(forecast.forecastDate).slice(0, 10) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.metric, children: [forecast.expectedOrders ?? 0, " orders"] })] }, forecast.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No forecast snapshots yet." })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Quality Signals" }), (forecasts?.qualityScores ?? []).length ? (forecasts?.qualityScores ?? []).map((score) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.listRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: score.scoreType }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: score.notes ?? "Latest vendor quality snapshot" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metric, children: Number(score.scoreValue ?? 0).toFixed(1) })] }, score.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No quality scores yet." })] })] })) : null, activeTab === "settings" ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Restaurant Profile" }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => setRestaurantFormOpen((current) => !current), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.inlineAction, children: restaurantFormOpen ? "Hide form" : "Add restaurant" }) })] }), restaurants.length ? restaurants.map((restaurant) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.restaurantProfileCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.restaurantAvatar, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "restaurant", size: 22, color: "#ffffff" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: restaurant.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: restaurant.category?.name ?? "Restaurant" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: restaurant.address }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: ["Delivery fee ", formatMoney(Number(restaurant.deliveryFee ?? 0)), " | Min. order ", formatMoney(Number(restaurant.minimumOrderAmount ?? 0))] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.inlineIconButton, onPress: () => startEditRestaurant(restaurant), children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "create-outline", size: 18, color: "#f97316" }) })] }, restaurant.id))) : (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No restaurant profile is connected to this vendor yet." })] }), restaurantFormOpen ? restaurantCreator : null, restaurants.length ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Settings Scope" }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.restaurantChoiceRow, children: restaurants.map((restaurant) => ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.restaurantChoice, selectedSettingsRestaurant?.id === restaurant.id && styles.restaurantChoiceActive], onPress: () => setSelectedRestaurantId(restaurant.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.restaurantChoiceText, selectedSettingsRestaurant?.id === restaurant.id && styles.restaurantChoiceTextActive], children: restaurant.name }) }, restaurant.id))) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Operations" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.settingRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: "Restaurant Status" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Toggle open/closed" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.switchTrack, settingsDraft.isOpen && styles.switchTrackActive], onPress: () => {
                                                            const nextDraft = { ...settingsDraft, isOpen: !settingsDraft.isOpen };
                                                            setSettingsDraft(nextDraft);
                                                            void saveVendorSettings(nextDraft);
                                                        }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.switchThumb, settingsDraft.isOpen && styles.switchThumbActive] }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.settingRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: "Auto-accept Orders" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Skip manual approval" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.switchTrack, settingsDraft.autoAcceptOrders && styles.switchTrackActive], onPress: () => {
                                                            const nextDraft = { ...settingsDraft, autoAcceptOrders: !settingsDraft.autoAcceptOrders };
                                                            setSettingsDraft(nextDraft);
                                                            void saveVendorSettings(nextDraft);
                                                        }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.switchThumb, settingsDraft.autoAcceptOrders && styles.switchThumbActive] }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.hoursBlock, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: "Opening Hours" }), settingsDraft.openingHours.map((entry, index) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.hoursRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.hoursRowHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMetaStrong, children: entry.label }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.hoursValue, entry.isClosed && styles.hoursClosed], children: entry.isClosed ? "Closed" : `${entry.open || "--"} - ${entry.close || "--"}` })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.inlineInputs, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: entry.open, onChangeText: (value) => setSettingsDraft((current) => ({
                                                                            ...current,
                                                                            openingHours: current.openingHours.map((hour, hourIndex) => hourIndex === index ? { ...hour, open: value, isClosed: false } : hour)
                                                                        })), placeholder: "8:00 AM", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput] }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: entry.close, onChangeText: (value) => setSettingsDraft((current) => ({
                                                                            ...current,
                                                                            openingHours: current.openingHours.map((hour, hourIndex) => hourIndex === index ? { ...hour, close: value, isClosed: false } : hour)
                                                                        })), placeholder: "10:00 PM", placeholderTextColor: "#9ca3af", style: [styles.input, styles.halfInput] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.outlineButton, styles.closedToggle], onPress: () => setSettingsDraft((current) => ({
                                                                    ...current,
                                                                    openingHours: current.openingHours.map((hour, hourIndex) => hourIndex === index ? { ...hour, isClosed: !hour.isClosed } : hour)
                                                                })), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.outlineButtonText, children: entry.isClosed ? "Re-open day" : "Mark closed" }) })] }, entry.label))), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryMiniButton, onPress: () => void saveVendorSettings(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryMiniButtonText, children: settingsSaving ? "Saving..." : "Save hours" }) })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Notifications" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.settingRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: "New Orders" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Alert for every incoming order" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.switchTrack, settingsDraft.notifyOnNewOrders && styles.switchTrackActive], onPress: () => {
                                                            const nextDraft = { ...settingsDraft, notifyOnNewOrders: !settingsDraft.notifyOnNewOrders };
                                                            setSettingsDraft(nextDraft);
                                                            void saveVendorSettings(nextDraft);
                                                        }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.switchThumb, settingsDraft.notifyOnNewOrders && styles.switchThumbActive] }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.settingRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: "Promotions" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: "Platform deals and campaigns" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.switchTrack, settingsDraft.notifyOnPromotions && styles.switchTrackActive], onPress: () => {
                                                            const nextDraft = { ...settingsDraft, notifyOnPromotions: !settingsDraft.notifyOnPromotions };
                                                            setSettingsDraft(nextDraft);
                                                            void saveVendorSettings(nextDraft);
                                                        }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.switchThumb, settingsDraft.notifyOnPromotions && styles.switchThumbActive] }) })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Payout Details" }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => {
                                                            if (editingPayout) {
                                                                void saveVendorSettings();
                                                            }
                                                            else {
                                                                setEditingPayout(true);
                                                            }
                                                        }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.inlineAction, children: editingPayout ? (settingsSaving ? "Saving..." : "Save") : "Edit" }) })] }), editingPayout ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: settingsDraft.payoutBankName, onChangeText: (value) => setSettingsDraft((current) => ({ ...current, payoutBankName: value })), placeholder: "Bank name", placeholderTextColor: "#9ca3af", style: styles.input }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: settingsDraft.payoutAccountNumber, onChangeText: (value) => setSettingsDraft((current) => ({ ...current, payoutAccountNumber: value })), placeholder: "Account number", placeholderTextColor: "#9ca3af", style: styles.input, keyboardType: "number-pad" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: settingsDraft.payoutAccountName, onChangeText: (value) => setSettingsDraft((current) => ({ ...current, payoutAccountName: value })), placeholder: "Account name", placeholderTextColor: "#9ca3af", style: styles.input })] })) : ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.payoutCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.settingIcon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "card-outline", size: 18, color: "#6b7280" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: settingsDraft.payoutBankName ? `${settingsDraft.payoutBankName} · ${settingsDraft.payoutAccountNumber || "No account number"}` : "No payout account set" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: settingsDraft.payoutAccountName || vendorName })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.verificationBadge, settingsDraft.payoutVerified ? styles.verificationBadgeActive : null], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.verificationBadgeText, settingsDraft.payoutVerified ? styles.verificationBadgeTextActive : null], children: settingsDraft.payoutVerified ? "Verified" : "Pending" }) })] }))] })] })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "No restaurant operations to configure yet." })), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panel, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.panelTitle, children: "Account" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.listRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.settingIcon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "person-outline", size: 16, color: "#6b7280" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.rowTitle, children: [session.user.firstName, " ", session.user.lastName] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cardMeta, children: session.user.email ?? email })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.listRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.settingIcon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: "business-outline", size: 16, color: "#6b7280" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.rowTitle, children: vendorName }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.cardMeta, children: [restaurants.length, " restaurants linked"] })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: styles.primaryButton, onPress: signOut, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.primaryButtonText, children: "Sign Out" }) })] })] })) : null] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.nav, children: [
                    { id: "dashboard", label: "Dashboard", icon: "grid-outline", activeIcon: "grid" },
                    { id: "orders", label: "Orders", icon: "receipt-outline", activeIcon: "receipt" },
                    { id: "menu", label: "Menu", icon: "restaurant-outline", activeIcon: "restaurant" },
                    { id: "analytics", label: "Analytics", icon: "bar-chart-outline", activeIcon: "bar-chart" },
                    { id: "settings", label: "Settings", icon: "settings-outline", activeIcon: "settings" }
                ].map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { style: styles.navItem, onPress: () => setActiveTab(item.id), children: [(0, jsx_runtime_1.jsx)(vector_icons_1.Ionicons, { name: (activeTab === item.id ? item.activeIcon : item.icon), size: 18, color: activeTab === item.id ? "#f97316" : "#9ca3af" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.navLabel, activeTab === item.id && styles.navLabelActive], children: item.label })] }, item.id))) })] }));
}
const styles = react_native_1.StyleSheet.create({
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
