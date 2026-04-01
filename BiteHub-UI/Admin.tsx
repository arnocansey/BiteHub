import { useState } from "react";
import {
  LayoutDashboard, Store, Bike, Users, ShoppingBag, BarChart2, Settings,
  Bell, TrendingUp, TrendingDown, Star, MapPin, AlertTriangle, CheckCircle2,
  XCircle, Eye, Search, ChevronDown, MoreHorizontal, Package, Clock, Shield,
  ToggleLeft, ToggleRight, CreditCard, Globe, Mail, Phone, Lock, UserCheck,
  AlertOctagon, FileText, Download, Filter, RefreshCw,
} from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "₦8.4M", change: "+18%", up: true, icon: TrendingUp, color: "from-orange-400 to-orange-600" },
  { label: "Active Orders", value: "142", change: "+12%", up: true, icon: Package, color: "from-blue-400 to-blue-600" },
  { label: "Active Riders", value: "38", change: "-3%", up: false, icon: Bike, color: "from-green-400 to-green-600" },
  { label: "Vendors", value: "94", change: "+5%", up: true, icon: Store, color: "from-purple-400 to-purple-600" },
  { label: "Users", value: "12.4K", change: "+22%", up: true, icon: Users, color: "from-pink-400 to-pink-600" },
  { label: "Avg. Rating", value: "4.7", change: "+0.1", up: true, icon: Star, color: "from-amber-400 to-amber-600" },
];

const recentOrders = [
  { id: "#ORD-8821", customer: "Adaeze M.", vendor: "Spice Garden", rider: "Emmanuel O.", amount: 6000, status: "in_transit" },
  { id: "#ORD-8820", customer: "Chidi O.", vendor: "Burger Republic", rider: "Tunde A.", amount: 2200, status: "delivered" },
  { id: "#ORD-8819", customer: "Fatima B.", vendor: "Pizza Palace", rider: "Kemi L.", amount: 1800, status: "preparing" },
  { id: "#ORD-8818", customer: "Emeka T.", vendor: "Sushi House", rider: "—", amount: 2500, status: "cancelled" },
  { id: "#ORD-8817", customer: "Ngozi A.", vendor: "Spice Garden", rider: "Bola S.", amount: 3400, status: "delivered" },
];

const vendors = [
  { name: "Spice Garden", cuisine: "Indian · Nigerian", orders: 386, rating: 4.8, revenue: "₦1.24M", status: "active" },
  { name: "Burger Republic", cuisine: "American", orders: 212, rating: 4.6, revenue: "₦680K", status: "active" },
  { name: "Pizza Palace", cuisine: "Italian", orders: 178, rating: 4.7, revenue: "₦590K", status: "suspended" },
  { name: "Sushi House", cuisine: "Japanese", orders: 95, rating: 4.9, revenue: "₦380K", status: "active" },
];

const riders = [
  { name: "Emmanuel O.", rating: 4.9, deliveries: 182, status: "online", earnings: "₦48.2K" },
  { name: "Tunde A.", rating: 4.7, deliveries: 134, status: "online", earnings: "₦35.6K" },
  { name: "Kemi L.", rating: 4.8, deliveries: 201, status: "delivering", earnings: "₦52.1K" },
  { name: "Bola S.", rating: 4.5, deliveries: 87, status: "offline", earnings: "₦22.8K" },
];

const statusColors: Record<string, string> = {
  in_transit: "bg-blue-100 text-blue-700", delivered: "bg-green-100 text-green-700",
  preparing: "bg-amber-100 text-amber-700", cancelled: "bg-red-100 text-red-700",
  active: "bg-green-100 text-green-700", suspended: "bg-red-100 text-red-700",
  online: "bg-green-100 text-green-700", offline: "bg-gray-100 text-gray-500",
  delivering: "bg-blue-100 text-blue-700",
};

const alerts = [
  { msg: "Vendor 'Pizza Palace' received 3 complaints", type: "warn", time: "5 min ago" },
  { msg: "Rider Bola S. went offline mid-delivery", type: "error", time: "12 min ago" },
  { msg: "New vendor application: 'Mama's Kitchen'", type: "info", time: "34 min ago" },
];

type Tab = "overview" | "orders" | "vendors" | "riders" | "users" | "analytics" | "compliance" | "settings";

export function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoPayouts, setAutoPayouts] = useState(true);
  const [fraudDetection, setFraudDetection] = useState(true);
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, string>>(
    Object.fromEntries(vendors.map(v => [v.name, v.status]))
  );

  const sidebarMain: { id: Tab; icon: React.ElementType; label: string; badge?: string }[] = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "orders", icon: ShoppingBag, label: "Orders", badge: "142" },
    { id: "vendors", icon: Store, label: "Vendors" },
    { id: "riders", icon: Bike, label: "Riders" },
    { id: "users", icon: Users, label: "Users" },
  ];
  const sidebarBottom: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "compliance", icon: Shield, label: "Compliance" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-full h-[860px] bg-gray-50 font-sans flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-sm">🍽️</div>
            <div><p className="font-bold text-gray-800 text-sm">QuickServe</p><p className="text-[10px] text-orange-500 font-semibold">ADMIN PANEL</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarMain.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? "bg-orange-50 text-orange-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge && <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
          {sidebarBottom.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? "bg-orange-50 text-orange-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>
        <div className="px-4 pb-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm">👩‍💼</div>
          <div><p className="text-xs font-semibold text-gray-700">Chioma Eze</p><p className="text-[10px] text-gray-400">Super Admin</p></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="bg-white px-6 py-3 border-b border-gray-100 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
              placeholder="Search orders, vendors, riders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative"><Bell className="w-5 h-5 text-gray-500 cursor-pointer" /><span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">3</span></div>
            <button className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-600">Today <ChevronDown className="w-3 h-3" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center flex-shrink-0`}><s.icon className="w-5 h-5 text-white" /></div>
                    <div>
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className="font-bold text-gray-800 text-lg leading-tight">{s.value}</p>
                      <div className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-green-500" : "text-red-500"}`}>
                        {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {s.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-gray-800">Recent Orders</p>
                    <button onClick={() => setActiveTab("orders")} className="text-xs text-orange-500 font-medium">View all</button>
                  </div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-50">{["Order ID","Customer","Vendor","Rider","Amount","Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-700">{o.id}</td>
                          <td className="px-4 py-3 text-gray-600">{o.customer}</td>
                          <td className="px-4 py-3 text-gray-600">{o.vendor}</td>
                          <td className="px-4 py-3 text-gray-600">{o.rider}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">₦{o.amount.toLocaleString()}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full font-bold capitalize text-[10px] ${statusColors[o.status]}`}>{o.status.replace("_"," ")}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white rounded-2xl shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100"><p className="font-semibold text-gray-800">Alerts</p></div>
                  <div className="p-4 space-y-3">
                    {alerts.map((alert, i) => (
                      <div key={i} className={`p-3 rounded-xl text-xs ${alert.type==="error"?"bg-red-50":alert.type==="warn"?"bg-amber-50":"bg-blue-50"}`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${alert.type==="error"?"text-red-500":alert.type==="warn"?"text-amber-500":"text-blue-500"}`} />
                          <div><p className={`font-medium ${alert.type==="error"?"text-red-700":alert.type==="warn"?"text-amber-700":"text-blue-700"}`}>{alert.msg}</p><p className="text-gray-400 mt-1">{alert.time}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                    <p className="font-semibold text-gray-800 mb-3 text-sm">Revenue (7 days)</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[42,65,38,80,55,90,72].map((h,i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full rounded-t ${i===5?"bg-orange-500":"bg-orange-200"}`} style={{height:`${h}%`}} />
                          <span className="text-[8px] text-gray-400">{["M","T","W","T","F","S","S"][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {activeTab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-800">All Orders</p>
                <div className="flex gap-2">
                  {["All","Active","Delivered","Cancelled"].map((f) => <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white shadow-sm text-gray-600 border border-gray-100">{f}</button>)}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">{["Order ID","Customer","Vendor","Rider","Amount","Status","Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-700">{o.id}</td>
                        <td className="px-4 py-3 text-gray-600">{o.customer}</td>
                        <td className="px-4 py-3 text-gray-600">{o.vendor}</td>
                        <td className="px-4 py-3 text-gray-600">{o.rider}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">₦{o.amount.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full font-bold capitalize text-[10px] ${statusColors[o.status]}`}>{o.status.replace("_"," ")}</span></td>
                        <td className="px-4 py-3"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Vendors ── */}
          {activeTab === "vendors" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-800">Vendors</p>
                <button className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl">+ Add Vendor</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {vendors.map((v) => {
                  const status = vendorStatuses[v.name];
                  return (
                    <div key={v.name} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">🍛</div>
                          <div><p className="font-semibold text-gray-800 text-sm">{v.name}</p><p className="text-xs text-gray-400">{v.cuisine}</p></div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[status]}`}>{status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
                        <div className="text-center"><p className="font-bold text-gray-800 text-sm">{v.orders}</p><p className="text-[10px] text-gray-400">Orders</p></div>
                        <div className="text-center"><p className="font-bold text-gray-800 text-sm flex items-center justify-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{v.rating}</p><p className="text-[10px] text-gray-400">Rating</p></div>
                        <div className="text-center"><p className="font-bold text-gray-800 text-sm">{v.revenue}</p><p className="text-[10px] text-gray-400">Revenue</p></div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> View</button>
                        {status === "active"
                          ? <button onClick={() => setVendorStatuses(s => ({...s, [v.name]: "suspended"}))} className="flex-1 bg-red-50 text-red-500 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Suspend</button>
                          : <button onClick={() => setVendorStatuses(s => ({...s, [v.name]: "active"}))} className="flex-1 bg-green-50 text-green-500 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Activate</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Riders ── */}
          {activeTab === "riders" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-800">Riders</p>
                <div className="flex gap-2">{["All","Online","Delivering","Offline"].map((f) => <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white shadow-sm text-gray-600 border border-gray-100">{f}</button>)}</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">{["Rider","Status","Rating","Deliveries","Earnings","Location","Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {riders.map((r) => (
                      <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-sm">🚴</div><span className="font-semibold text-gray-700">{r.name}</span></div></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full font-bold capitalize text-[10px] ${statusColors[r.status]}`}>{r.status}</span></td>
                        <td className="px-4 py-3"><span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {r.rating}</span></td>
                        <td className="px-4 py-3 text-gray-600">{r.deliveries}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{r.earnings}</td>
                        <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-400"><MapPin className="w-3 h-3" /> Lagos</span></td>
                        <td className="px-4 py-3"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-4"><p className="font-semibold text-gray-800">Customers</p></div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: "Total Users", value: "12,400", icon: Users, color: "bg-blue-500" },
                  { label: "Active Today", value: "834", icon: Clock, color: "bg-green-500" },
                  { label: "New This Month", value: "1,204", icon: TrendingUp, color: "bg-orange-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center`}><s.icon className="w-4 h-4 text-white" /></div>
                    <div><p className="text-xs text-gray-400">{s.label}</p><p className="font-bold text-gray-800">{s.value}</p></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100"><p className="font-semibold text-gray-800 text-sm">Recent Customers</p></div>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">{["Customer","Email","Orders","Total Spent","Joined","Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      { name: "Adaeze M.", email: "adaeze@email.com", orders: 14, spent: "₦42,000", joined: "Jan 2026" },
                      { name: "Chidi O.", email: "chidi@email.com", orders: 8, spent: "₦21,600", joined: "Feb 2026" },
                      { name: "Fatima B.", email: "fatima@email.com", orders: 23, spent: "₦68,200", joined: "Nov 2025" },
                      { name: "Emeka T.", email: "emeka@email.com", orders: 5, spent: "₦12,500", joined: "Mar 2026" },
                    ].map((u) => (
                      <tr key={u.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-sm">👤</div><span className="font-semibold text-gray-700">{u.name}</span></div></td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-gray-600">{u.orders}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{u.spent}</td>
                        <td className="px-4 py-3 text-gray-500">{u.joined}</td>
                        <td className="px-4 py-3"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {activeTab === "analytics" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="font-semibold text-gray-800">Platform Analytics</p>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 border border-gray-200 bg-white text-gray-600 text-xs font-medium px-3 py-2 rounded-xl"><Filter className="w-3 h-3" /> Filter</button>
                  <button className="flex items-center gap-1 border border-gray-200 bg-white text-gray-600 text-xs font-medium px-3 py-2 rounded-xl"><Download className="w-3 h-3" /> Export</button>
                </div>
              </div>
              {/* Revenue chart */}
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-gray-800">Revenue Trend</p>
                  <div className="flex gap-1">{["7D","30D","90D","1Y"].map((t,i) => <button key={t} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${i===1?"bg-orange-500 text-white":"text-gray-400"}`}>{t}</button>)}</div>
                </div>
                <div className="flex items-end gap-2 h-28">
                  {[38,52,45,68,58,75,62,80,55,70,85,72].map((h,i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t ${i===9?"bg-orange-500":"bg-orange-200"}`} style={{height:`${h}%`}} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: "GMV (Gross)", value: "₦8.4M", change: "+18%", up: true },
                  { label: "Commission", value: "₦1.26M", change: "+18%", up: true },
                  { label: "Avg. Order Value", value: "₦3,850", change: "+5%", up: true },
                  { label: "Refunds Issued", value: "₦42K", change: "+2%", up: false },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                    <span className={`text-xs font-bold ${s.up?"text-green-500":"text-red-500"}`}>{s.change} this month</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Top vendors */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3 text-sm">Top Vendors</p>
                  {vendors.map((v, i) => (
                    <div key={v.name} className="flex items-center gap-3 mb-3 last:mb-0">
                      <span className="text-xs font-bold text-gray-400 w-4">#{i+1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{v.name}</p>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-1.5 bg-orange-400 rounded-full" style={{width:`${Math.round((v.orders/400)*100)}%`}} /></div>
                      </div>
                      <span className="text-xs text-gray-500">{v.revenue}</span>
                    </div>
                  ))}
                </div>
                {/* Top riders */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3 text-sm">Top Riders</p>
                  {riders.map((r, i) => (
                    <div key={r.name} className="flex items-center gap-3 mb-3 last:mb-0">
                      <span className="text-xs font-bold text-gray-400 w-4">#{i+1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{r.name}</p>
                        <div className="flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-[10px] text-gray-400">{r.rating}</span></div>
                      </div>
                      <span className="text-xs text-gray-500">{r.deliveries} trips</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Compliance ── */}
          {activeTab === "compliance" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="font-semibold text-gray-800">Compliance & Reports</p>
                <button className="flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-xl"><FileText className="w-3 h-3" /> Generate Report</button>
              </div>
              {/* Flags */}
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <p className="font-semibold text-gray-800 mb-3">Active Flags</p>
                {[
                  { type: "Vendor", name: "Pizza Palace", issue: "3 customer complaints in 7 days", severity: "high", time: "5 min ago" },
                  { type: "Rider", name: "Bola S.", issue: "Went offline mid-delivery", severity: "medium", time: "12 min ago" },
                  { type: "Order", name: "#ORD-8790", issue: "Disputed charge reported by customer", severity: "low", time: "2 hrs ago" },
                ].map((f, i) => (
                  <div key={i} className={`p-4 rounded-2xl mb-3 border-l-4 ${f.severity==="high"?"border-red-400 bg-red-50":f.severity==="medium"?"border-amber-400 bg-amber-50":"border-blue-400 bg-blue-50"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className={`w-4 h-4 ${f.severity==="high"?"text-red-500":f.severity==="medium"?"text-amber-500":"text-blue-500"}`} />
                        <span className={`text-xs font-bold uppercase ${f.severity==="high"?"text-red-600":f.severity==="medium"?"text-amber-600":"text-blue-600"}`}>{f.severity}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{f.time}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{f.type}: {f.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{f.issue}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium">Dismiss</button>
                      <button className={`text-xs text-white px-3 py-1.5 rounded-lg font-bold ${f.severity==="high"?"bg-red-500":f.severity==="medium"?"bg-amber-500":"bg-blue-500"}`}>Investigate</button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pending verifications */}
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <p className="font-semibold text-gray-800 mb-3">Pending Verifications</p>
                {[
                  { name: "Mama's Kitchen", type: "New Vendor", submitted: "2 hours ago" },
                  { name: "Yusuf A.", type: "New Rider", submitted: "4 hours ago" },
                  { name: "Bella Burgers", type: "New Vendor", submitted: "Yesterday" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 mb-3 last:mb-0 p-3 bg-gray-50 rounded-xl">
                    <UserCheck className="w-5 h-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.type} · {item.submitted}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold">Approve</button>
                      <button className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Reports table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-800 text-sm">Past Reports</p>
                  <button className="flex items-center gap-1 text-xs text-orange-500 font-medium"><Download className="w-3 h-3" /> Download All</button>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">{["Report","Period","Generated","Status","Download"].map(h => <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      { name: "Monthly Revenue", period: "March 2026", date: "Apr 1, 2026", status: "ready" },
                      { name: "Rider Performance", period: "Q1 2026", date: "Mar 31, 2026", status: "ready" },
                      { name: "Vendor Audit", period: "Feb 2026", date: "Mar 1, 2026", status: "ready" },
                    ].map((r) => (
                      <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700 flex items-center gap-2"><FileText className="w-3 h-3 text-gray-400" />{r.name}</td>
                        <td className="px-4 py-3 text-gray-500">{r.period}</td>
                        <td className="px-4 py-3 text-gray-500">{r.date}</td>
                        <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Ready</span></td>
                        <td className="px-4 py-3"><button className="text-orange-500"><Download className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {activeTab === "settings" && (
            <div>
              <p className="font-semibold text-gray-800 mb-5">Platform Settings</p>
              <div className="grid grid-cols-2 gap-4">
                {/* General */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-orange-500" /> General</p>
                  {[
                    { label: "Platform Name", value: "QuickServe" },
                    { label: "Support Email", value: "support@quickserve.ng" },
                    { label: "Support Phone", value: "+234 700 QUICK" },
                    { label: "HQ Location", value: "Lagos, Nigeria" },
                  ].map((item) => (
                    <div key={item.label} className="mb-3">
                      <p className="text-[10px] text-gray-400 mb-1">{item.label}</p>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700 font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Financial */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-orange-500" /> Financial</p>
                  {[
                    { label: "Platform Commission", value: "15%" },
                    { label: "Rider Base Pay / Trip", value: "₦350" },
                    { label: "Min. Order Value", value: "₦500" },
                    { label: "Payout Cycle", value: "Weekly (Friday)" },
                  ].map((item) => (
                    <div key={item.label} className="mb-3">
                      <p className="text-[10px] text-gray-400 mb-1">{item.label}</p>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700 font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Operations */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-orange-500" /> Operations</p>
                  {[
                    { label: "Maintenance Mode", sub: "Take platform offline", value: maintenanceMode, set: setMaintenanceMode },
                    { label: "Auto Payouts", sub: "Schedule weekly payouts", value: autoPayouts, set: setAutoPayouts },
                    { label: "Fraud Detection", sub: "AI-powered alerts", value: fraudDetection, set: setFraudDetection },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between mb-4 last:mb-0">
                      <div><p className="text-sm font-medium text-gray-800">{item.label}</p><p className="text-xs text-gray-400">{item.sub}</p></div>
                      <button onClick={() => item.set(v => !v)}>
                        {item.value ? <ToggleRight className="w-8 h-8 text-orange-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Security */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-orange-500" /> Security</p>
                  {[
                    { label: "Two-Factor Auth", sub: "Admin login 2FA", icon: Shield },
                    { label: "IP Whitelist", sub: "Restrict admin access", icon: Globe },
                    { label: "Audit Logs", sub: "View admin activity", icon: FileText },
                    { label: "Change Password", sub: "Update credentials", icon: Lock },
                  ].map((item) => (
                    <button key={item.label} className="w-full flex items-center gap-3 mb-3 last:mb-0 p-2 rounded-xl hover:bg-gray-50">
                      <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><item.icon className="w-4 h-4 text-gray-500" /></div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-300 -rotate-90" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
