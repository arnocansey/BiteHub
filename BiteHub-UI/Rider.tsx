import { useState } from "react";
import {
  MapPin, Navigation, Phone, CheckCircle2, Clock, DollarSign, TrendingUp,
  Star, Package, ArrowRight, Bell, Home, ClipboardList, BarChart2, User,
  Bike, AlertCircle, ChevronRight, Edit3, Shield, HelpCircle, LogOut,
  ToggleLeft, ToggleRight, CreditCard, Camera, Settings, MessageSquare,
} from "lucide-react";

const assignments = [
  {
    id: "#ORD-8821", restaurant: "Spice Garden", restaurantAddr: "23 Broad St, Lagos Island",
    customer: "Adaeze M.", customerAddr: "15 Awolowo Rd, Ikoyi",
    amount: 6000, distance: "2.4 km", eta: "8 min", status: "pickup", earnings: 450,
  },
  {
    id: "#ORD-8819", restaurant: "Burger Republic", restaurantAddr: "7 Marina St, Lagos",
    customer: "Fatima B.", customerAddr: "9 Kingsway Rd, Ikoyi",
    amount: 1800, distance: "3.1 km", eta: "12 min", status: "queued", earnings: 350,
  },
];

const deliveryHistory = [
  { id: "#ORD-8815", restaurant: "Spice Garden", customer: "Emeka T.", earnings: 420, date: "Today, 10:22 AM", status: "delivered" },
  { id: "#ORD-8810", restaurant: "Pizza Palace", customer: "Ngozi A.", earnings: 380, date: "Today, 8:45 AM", status: "delivered" },
  { id: "#ORD-8802", restaurant: "Sushi House", customer: "Chidi O.", earnings: 500, date: "Yesterday, 6:15 PM", status: "delivered" },
  { id: "#ORD-8795", restaurant: "Burger Republic", customer: "Fatima B.", earnings: 310, date: "Yesterday, 1:30 PM", status: "cancelled" },
];

type Tab = "home" | "deliveries" | "earnings" | "profile";

const statusColor: Record<string, string> = {
  pickup: "bg-amber-100 text-amber-700", in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700", queued: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-700",
};

export function Rider() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, string>>(
    Object.fromEntries(assignments.map((a) => [a.id, a.status]))
  );
  const [isOnline, setIsOnline] = useState(true);
  const [notifNewOrders, setNotifNewOrders] = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all");

  const nextLabel: Record<string, string> = { pickup: "Confirm Pickup", in_transit: "Mark Delivered", queued: "Start Delivery" };
  const nextStatus: Record<string, string> = { queued: "pickup", pickup: "in_transit", in_transit: "delivered" };

  const weeklyEarnings = [2100, 3400, 2800, 4100, 3600, 5200, 4700];
  const totalToday = 3850;

  const BottomNav = () => (
    <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around flex-shrink-0">
      {([
        { id: "home" as Tab, icon: Home, label: "Home" },
        { id: "deliveries" as Tab, icon: ClipboardList, label: "Deliveries" },
        { id: "earnings" as Tab, icon: BarChart2, label: "Earnings" },
        { id: "profile" as Tab, icon: User, label: "Profile" },
      ] as const).map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? "text-orange-500" : "text-gray-400"}`}>
          <tab.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-[390px] h-[844px] bg-gray-50 font-sans flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">🚴</div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Emmanuel Okafor</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-gray-500">4.9 · Top Rider</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <button onClick={() => setIsOnline((o) => !o)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isOnline ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
              {isOnline ? "● Online" : "○ Offline"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Home ── */}
        {activeTab === "home" && (
          <div className="px-5 pb-6 pt-5">
            <div className="relative bg-gradient-to-br from-indigo-100 via-blue-50 to-green-100 rounded-3xl h-48 flex items-center justify-center shadow-sm overflow-hidden">
              <div className="flex flex-col items-center">
                <Bike className="w-12 h-12 text-orange-500 mb-2" />
                {isOnline ? <p className="text-sm font-semibold text-gray-700">You're online · Waiting for orders</p>
                  : <p className="text-sm font-semibold text-gray-400">You're offline</p>}
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 text-orange-500" /> Lagos Island, Lagos
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Today's Earnings", value: `₦${totalToday.toLocaleString()}`, icon: DollarSign, color: "bg-orange-500" },
                { label: "Deliveries", value: "8", icon: Package, color: "bg-blue-500" },
                { label: "Online Hours", value: "6.5h", icon: Clock, color: "bg-green-500" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                  <div className={`w-8 h-8 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}><s.icon className="w-4 h-4 text-white" /></div>
                  <p className="font-bold text-gray-800 text-sm">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {assignments.filter((a) => deliveryStatus[a.id] !== "delivered" && deliveryStatus[a.id] !== "queued").map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">Active Delivery</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${statusColor[deliveryStatus[order.id]]}`}>
                    {deliveryStatus[order.id].replace("_", " ")}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-orange-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400">Pickup from</p>
                      <p className="font-semibold text-gray-800 text-sm">{order.restaurant}</p>
                      <p className="text-xs text-gray-500">{order.restaurantAddr}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"><MapPin className="w-4 h-4 text-green-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400">Deliver to</p>
                      <p className="font-semibold text-gray-800 text-sm">{order.customer}</p>
                      <p className="text-xs text-gray-500">{order.customerAddr}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" /> {order.eta}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Navigation className="w-3 h-3" /> {order.distance}</div>
                  <div className="ml-auto text-orange-500 font-bold text-sm">₦{order.earnings}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Call Customer
                  </button>
                  <button onClick={() => setDeliveryStatus((s) => ({ ...s, [order.id]: nextStatus[s[order.id]] || "delivered" }))}
                    className="flex-1 bg-orange-500 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    {nextLabel[deliveryStatus[order.id]]} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {assignments.filter((a) => deliveryStatus[a.id] === "queued").map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm mt-3 border border-dashed border-gray-200">
                <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-amber-500" /><p className="text-sm font-semibold text-gray-700">Next Assignment</p></div>
                <p className="text-sm text-gray-600">{order.restaurant} → {order.customer}</p>
                <p className="text-xs text-gray-400 mt-1">{order.distance} away · Est. ₦{order.earnings}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Deliveries ── */}
        {activeTab === "deliveries" && (
          <div className="px-5 pb-6 pt-5">
            <p className="font-semibold text-gray-800 mb-1">Delivery History</p>
            <p className="text-xs text-gray-400 mb-4">All your completed and active trips</p>
            <div className="flex gap-2 mb-4">
              {["all", "delivered", "cancelled"].map((f) => (
                <button key={f} onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${historyFilter === f ? "bg-orange-500 text-white" : "bg-white shadow-sm text-gray-600"}`}>{f}</button>
              ))}
            </div>
            {/* Active */}
            {assignments.filter((a) => deliveryStatus[a.id] !== "delivered").map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border-l-4 border-orange-400">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800 text-sm">{order.id}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${statusColor[deliveryStatus[order.id]]}`}>
                    {deliveryStatus[order.id].replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{order.restaurant} → {order.customer}</p>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{order.distance}</span>
                  <span className="text-xs text-gray-500">{order.eta}</span>
                  <span className="ml-auto text-orange-500 font-bold text-sm">₦{order.earnings}</span>
                </div>
                {nextStatus[deliveryStatus[order.id]] && (
                  <button onClick={() => setDeliveryStatus((s) => ({ ...s, [order.id]: nextStatus[s[order.id]] }))}
                    className="w-full mt-3 bg-orange-500 text-white text-sm font-bold py-2.5 rounded-xl">
                    {nextLabel[deliveryStatus[order.id]]}
                  </button>
                )}
              </div>
            ))}
            {/* History */}
            {deliveryHistory.filter(d => historyFilter === "all" ? true : d.status === historyFilter).map((d) => (
              <div key={d.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800 text-sm">{d.id}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[d.status]}`}>{d.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{d.restaurant} → {d.customer}</p>
                <p className="text-xs text-gray-400 mt-0.5">{d.date}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Delivery fee</span>
                  <span className={`font-bold text-sm ${d.status === "cancelled" ? "text-gray-400 line-through" : "text-green-500"}`}>+₦{d.earnings}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Earnings ── */}
        {activeTab === "earnings" && (
          <div className="px-5 pb-6 pt-5">
            <div className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-3xl p-5 text-white mb-4">
              <p className="text-sm opacity-80">Total Earnings This Week</p>
              <p className="text-4xl font-bold mt-1">₦{weeklyEarnings.reduce((a, b) => a + b, 0).toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2 text-sm opacity-80"><TrendingUp className="w-4 h-4" /> +23% vs last week</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <p className="font-semibold text-gray-800 mb-3">Daily Breakdown</p>
              <div className="flex items-end gap-2 h-24">
                {weeklyEarnings.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t-lg ${i === 5 ? "bg-orange-500" : "bg-orange-200"}`} style={{ height: `${Math.round((h / 5200) * 100)}%` }} />
                    <span className="text-[9px] text-gray-400">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            {[
              { label: "Today", value: `₦${totalToday.toLocaleString()}`, sub: "8 deliveries", detail: "₦3,200 tips + ₦650 base" },
              { label: "This Week", value: `₦${weeklyEarnings.reduce((a,b)=>a+b,0).toLocaleString()}`, sub: "47 deliveries", detail: "" },
              { label: "This Month", value: "₦118,400", sub: "182 deliveries", detail: "" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    {s.detail && <p className="text-xs text-gray-300 mt-0.5">{s.detail}</p>}
                  </div>
                  <p className="font-bold text-orange-500 text-lg">{s.value}</p>
                </div>
              </div>
            ))}
            {/* Payout */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">Payout Account</p>
                <button className="text-xs text-orange-500 font-medium">Edit</button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">GTBank · **** 3821</p>
                  <p className="text-xs text-gray-400">Emmanuel Okafor</p>
                </div>
                <span className="ml-auto text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">Active</span>
              </div>
              <button className="w-full mt-3 bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm">Request Payout</button>
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        {activeTab === "profile" && (
          <div className="pb-6">
            {/* Hero card */}
            <div className="bg-white px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-18 h-18 w-[72px] h-[72px] bg-orange-100 rounded-full flex items-center justify-center text-5xl">👨‍🦱</div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center border border-gray-100">
                    <Camera className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-base">Emmanuel Okafor</p>
                  <p className="text-xs text-gray-400 mt-0.5">+234 801 234 5678</p>
                  <p className="text-xs text-gray-400">emmanuel@email.com</p>
                  <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-xs font-semibold text-gray-600">4.9 · Top Rider</span></div>
                </div>
                <button className="p-2 rounded-xl bg-orange-50"><Edit3 className="w-4 h-4 text-orange-500" /></button>
              </div>
              {/* Stats row */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                {[
                  { label: "Rider rank", value: "Top 5%" },
                  { label: "On-time rate", value: "98%" },
                  { label: "Trips", value: "182" },
                  { label: "With us", value: "1 yr" },
                ].map((s, i) => (
                  <div key={s.label} className={`flex-1 text-center ${i < 3 ? "border-r border-gray-100" : ""}`}>
                    <p className="font-bold text-gray-800 text-sm">{s.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle info */}
            <div className="px-5 mt-4">
              <p className="font-semibold text-gray-800 text-sm mb-3">Vehicle Details</p>
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                {[
                  { label: "Vehicle", value: "Honda CB150" },
                  { label: "License Plate", value: "LSD-342-KE" },
                  { label: "Colour", value: "Red" },
                  { label: "Insurance", value: "Valid till Dec 2026" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <span className="text-sm font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
                <button className="w-full mt-3 border border-orange-200 text-orange-500 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" /> Update Vehicle Info
                </button>
              </div>

              {/* Availability settings */}
              <p className="font-semibold text-gray-800 text-sm mb-3">Preferences</p>
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                {[
                  { label: "New Order Alerts", sub: "Sound & vibrate", value: notifNewOrders, set: setNotifNewOrders },
                  { label: "Earnings Notifications", sub: "Payment updates", value: notifEarnings, set: setNotifEarnings },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between mb-4 last:mb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                    <button onClick={() => item.set(v => !v)}>
                      {item.value ? <ToggleRight className="w-8 h-8 text-orange-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Support links */}
              <p className="font-semibold text-gray-800 text-sm mb-3">Support & Account</p>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                {[
                  { icon: HelpCircle, label: "Help Centre", sub: "FAQs and guides" },
                  { icon: MessageSquare, label: "Chat Support", sub: "Talk to an agent" },
                  { icon: Shield, label: "Privacy & Safety", sub: "Your data" },
                  { icon: Settings, label: "App Settings", sub: "Language, theme" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                ))}
              </div>
              <button className="w-full bg-red-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center"><LogOut className="w-4 h-4 text-red-500" /></div>
                <span className="text-sm font-semibold text-red-500">Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
