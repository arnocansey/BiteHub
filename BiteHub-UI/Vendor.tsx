import { useState } from "react";
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart2, Settings,
  Bell, TrendingUp, ShoppingBag, Star, Users, Plus, Eye, EyeOff, ChevronRight,
  CheckCircle2, Clock, XCircle, Package, Toggle, Pencil, Trash2, MapPin,
  Phone, Mail, Globe, CreditCard, Shield, LogOut, ToggleLeft, ToggleRight,
  AlertTriangle, Camera,
} from "lucide-react";

const orders = [
  { id: "#ORD-8821", customer: "Adaeze M.", items: "Jollof Rice x2, Chapman", amount: 6000, status: "new", time: "2 min ago" },
  { id: "#ORD-8820", customer: "Chidi O.", items: "Egusi Soup & Eba x1", amount: 2200, status: "preparing", time: "8 min ago" },
  { id: "#ORD-8819", customer: "Fatima B.", items: "Puff Puff x6, Chapman", amount: 1800, status: "ready", time: "15 min ago" },
  { id: "#ORD-8818", customer: "Emeka T.", items: "Jollof Rice & Chicken x1", amount: 2500, status: "delivered", time: "32 min ago" },
];

const menuItems = [
  { id: 1, name: "Jollof Rice & Chicken", price: 2500, available: true, orders: 142, category: "Main" },
  { id: 2, name: "Egusi Soup & Eba", price: 2200, available: true, orders: 98, category: "Main" },
  { id: 3, name: "Puff Puff x6", price: 800, available: false, orders: 74, category: "Snacks" },
  { id: 4, name: "Chapman Drink", price: 1000, available: true, orders: 201, category: "Drinks" },
  { id: 5, name: "Fried Plantain", price: 600, available: true, orders: 56, category: "Sides" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-gray-100 text-gray-500",
};

const statusIcons: Record<string, React.ElementType> = {
  new: ShoppingBag, preparing: Clock, ready: Package, delivered: CheckCircle2,
};

type Tab = "dashboard" | "orders" | "menu" | "analytics" | "settings";

export function Vendor() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [availability, setAvailability] = useState<Record<number, boolean>>(
    Object.fromEntries(menuItems.map((i) => [i.id, i.available]))
  );
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>(
    Object.fromEntries(orders.map((o) => [o.id, o.status]))
  );
  const [isOpen, setIsOpen] = useState(true);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const nextStatus: Record<string, string> = { new: "preparing", preparing: "ready", ready: "delivered" };
  const newOrdersCount = Object.values(orderStatuses).filter((s) => s === "new").length;

  const filteredOrders = orders.filter(o =>
    activeFilter === "all" ? true : orderStatuses[o.id] === activeFilter
  );

  return (
    <div className="w-[430px] h-[860px] bg-gray-50 font-sans flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-xl">🍛</div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Spice Garden</p>
              <button onClick={() => setIsOpen(o => !o)} className={`text-xs font-medium flex items-center gap-1 ${isOpen ? "text-green-500" : "text-gray-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-400"}`}></span>
                {isOpen ? "Open" : "Closed"} · Tap to toggle
              </button>
            </div>
          </div>
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-500" />
            {newOrdersCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{newOrdersCount}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Dashboard ── */}
        {activeTab === "dashboard" && (
          <div className="px-5 pb-6 pt-5">
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Today's Revenue", value: "₦48,200", icon: TrendingUp, color: "bg-orange-500", sub: "+12% vs yesterday" },
                { label: "Orders Today", value: "24", icon: ShoppingBag, color: "bg-blue-500", sub: "8 pending" },
                { label: "Avg. Rating", value: "4.8", icon: Star, color: "bg-amber-500", sub: "from 156 reviews" },
                { label: "Active Customers", value: "1.2K", icon: Users, color: "bg-green-500", sub: "This month" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center mb-3`}><stat.icon className="w-4 h-4 text-white" /></div>
                  <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-green-500 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">New Orders</p>
                <button onClick={() => setActiveTab("orders")} className="text-xs text-orange-500 font-medium flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
              </div>
              {orders.filter((o) => orderStatuses[o.id] === "new").length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No new orders right now</p>
                : orders.filter((o) => orderStatuses[o.id] === "new").map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{order.id} · {order.customer}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.items}</p>
                        <p className="text-orange-500 font-bold text-sm mt-1">₦{order.amount.toLocaleString()}</p>
                      </div>
                      <button onClick={() => setOrderStatuses((s) => ({ ...s, [order.id]: "preparing" }))} className="bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl">Accept</button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm mt-3">
              <p className="font-semibold text-gray-800 mb-3">Weekly Revenue</p>
              <div className="flex items-end gap-2 h-20">
                {[35, 55, 40, 70, 60, 80, 65].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t-lg ${i === 5 ? "bg-orange-500" : "bg-orange-200"}`} style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-gray-400">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {activeTab === "orders" && (
          <div className="px-5 pb-6 pt-5">
            <div className="flex gap-2 mb-4 flex-wrap">
              {["all", "new", "preparing", "ready", "delivered"].map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${activeFilter === f ? "bg-orange-500 text-white" : "bg-white shadow-sm text-gray-600"}`}>{f}</button>
              ))}
            </div>
            {filteredOrders.map((order) => {
              const status = orderStatuses[order.id];
              const StatusIcon = statusIcons[status];
              return (
                <div key={order.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{order.id}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[status]}`}>{status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{order.customer} · {order.time}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.items}</p>
                      <p className="text-orange-500 font-bold text-sm mt-2">₦{order.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusIcon className={`w-5 h-5 ${status === "delivered" ? "text-gray-400" : "text-orange-500"}`} />
                      {nextStatus[status] && (
                        <button onClick={() => setOrderStatuses((s) => ({ ...s, [order.id]: nextStatus[status] }))}
                          className="text-[10px] bg-orange-500 text-white font-bold px-2.5 py-1.5 rounded-lg capitalize">
                          Mark {nextStatus[status]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Menu ── */}
        {activeTab === "menu" && (
          <div className="px-5 pb-6 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Menu Items</p>
              <button className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl"><Plus className="w-3 h-3" /> Add Item</button>
            </div>
            {["Main", "Snacks", "Sides", "Drinks"].map((cat) => {
              const items = menuItems.filter(i => i.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍲</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-orange-500 font-bold text-sm">₦{item.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.orders} orders total</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAvailability((a) => ({ ...a, [item.id]: !a[item.id] }))} title={availability[item.id] ? "Hide" : "Show"}>
                          {availability[item.id]
                            ? <Eye className="w-5 h-5 text-green-500" />
                            : <EyeOff className="w-5 h-5 text-gray-300" />}
                        </button>
                        <button className="p-1"><Pencil className="w-4 h-4 text-gray-400" /></button>
                        <button className="p-1"><Trash2 className="w-4 h-4 text-red-300" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === "analytics" && (
          <div className="px-5 pb-6 pt-5">
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Total Revenue", value: "₦1.24M", period: "This month", change: "+18%", up: true },
                { label: "Total Orders", value: "386", period: "This month", change: "+9%", up: true },
                { label: "Avg. Order Value", value: "₦3,212", period: "This month", change: "+3%", up: true },
                { label: "Cancellations", value: "12", period: "This month", change: "-5%", up: false },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.period}</p>
                  </div>
                  <span className={`text-sm font-bold ${s.up ? "text-green-500" : "text-red-500"}`}>{s.change}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm mt-3">
              <p className="font-semibold text-gray-800 mb-3">Top Selling Items</p>
              {menuItems.slice(0, 4).sort((a, b) => b.orders - a.orders).map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{item.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${Math.round((item.orders / 210) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{item.orders}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm mt-3">
              <p className="font-semibold text-gray-800 mb-3">Revenue by Day</p>
              <div className="flex items-end gap-2 h-20">
                {[35, 55, 40, 70, 60, 80, 65].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t-lg ${i === 5 ? "bg-orange-500" : "bg-orange-200"}`} style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-gray-400">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === "settings" && (
          <div className="px-5 pb-6 pt-5">

            {/* Restaurant profile */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-800">Restaurant Profile</p>
                <button className="text-xs text-orange-500 font-medium flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl relative">
                  🍛
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center">
                    <Camera className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Spice Garden</p>
                  <p className="text-xs text-gray-400 mt-0.5">Indian · Nigerian Cuisine</p>
                  <p className="text-xs text-gray-400">Est. 2021</p>
                </div>
              </div>
              {[
                { icon: MapPin, label: "23 Broad St, Lagos Island" },
                { icon: Phone, label: "+234 801 234 5678" },
                { icon: Mail, label: "spicegarden@email.com" },
                { icon: Globe, label: "www.spicegarden.ng" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 mb-3">
                  <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Operations */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <p className="font-semibold text-gray-800 mb-4">Operations</p>
              {[
                { label: "Restaurant Status", sub: "Toggle open/closed", value: isOpen, set: setIsOpen },
                { label: "Auto-accept Orders", sub: "Skip manual approval", value: autoAccept, set: setAutoAccept },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between mb-4 last:mb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                  <button onClick={() => item.set(v => !v)}>
                    {item.value
                      ? <ToggleRight className="w-8 h-8 text-orange-500" />
                      : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  </button>
                </div>
              ))}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-800 mb-2">Opening Hours</p>
                {[
                  { day: "Mon – Fri", time: "8:00 AM – 10:00 PM" },
                  { day: "Saturday", time: "9:00 AM – 11:00 PM" },
                  { day: "Sunday", time: "Closed" },
                ].map((h) => (
                  <div key={h.day} className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{h.day}</span>
                    <span className={h.time === "Closed" ? "text-red-400 font-medium" : "font-medium text-gray-700"}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <p className="font-semibold text-gray-800 mb-4">Notifications</p>
              {[
                { label: "New Orders", sub: "Alert for every incoming order", value: notifOrders, set: setNotifOrders },
                { label: "Promotions", sub: "Platform deals and campaigns", value: notifPromos, set: setNotifPromos },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between mb-4 last:mb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                  <button onClick={() => item.set(v => !v)}>
                    {item.value
                      ? <ToggleRight className="w-8 h-8 text-orange-500" />
                      : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Payout */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">Payout Details</p>
                <button className="text-xs text-orange-500 font-medium">Edit</button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">GTBank · **** 4821</p>
                  <p className="text-xs text-gray-400">Spice Garden Ltd</p>
                </div>
                <span className="ml-auto text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">Verified</span>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3">Account</p>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 mb-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Privacy & Security</span>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50">
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-500 font-medium">Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-around flex-shrink-0">
        {([
          { id: "dashboard" as Tab, icon: LayoutDashboard, label: "Dashboard" },
          { id: "orders" as Tab, icon: ClipboardList, label: "Orders" },
          { id: "menu" as Tab, icon: UtensilsCrossed, label: "Menu" },
          { id: "analytics" as Tab, icon: BarChart2, label: "Analytics" },
          { id: "settings" as Tab, icon: Settings, label: "Settings" },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? "text-orange-500" : "text-gray-400"}`}>
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
