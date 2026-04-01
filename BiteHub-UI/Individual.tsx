import { useState } from "react";
import {
  Search, MapPin, Star, Clock, ChevronRight, Home, ShoppingBag, Heart,
  User, Plus, Minus, ArrowLeft, Bell, Filter, Bike, CheckCircle2, Package,
  Trash2, Edit3, Phone, Mail, LogOut, Settings, Shield, CreditCard,
  HelpCircle, ChevronDown, X, Gift,
} from "lucide-react";

const restaurants = [
  { id: 1, name: "Spice Garden", cuisine: "Indian · Nigerian", rating: 4.8, time: "25-35 min", delivery: "Free", image: "🍛", tag: "Popular", tagColor: "bg-orange-100 text-orange-700" },
  { id: 2, name: "Burger Republic", cuisine: "American · Fast Food", rating: 4.6, time: "15-25 min", delivery: "₦200", image: "🍔", tag: "New", tagColor: "bg-green-100 text-green-700" },
  { id: 3, name: "Pizza Palace", cuisine: "Italian · Pizza", rating: 4.7, time: "30-40 min", delivery: "Free", image: "🍕", tag: "Top Rated", tagColor: "bg-purple-100 text-purple-700" },
  { id: 4, name: "Sushi House", cuisine: "Japanese · Asian", rating: 4.9, time: "20-30 min", delivery: "₦150", image: "🍱", tag: "Trending", tagColor: "bg-blue-100 text-blue-700" },
];

const categories = [
  { name: "All", icon: "🍽️" }, { name: "Rice", icon: "🍚" }, { name: "Burgers", icon: "🍔" },
  { name: "Pizza", icon: "🍕" }, { name: "Sushi", icon: "🍱" }, { name: "Drinks", icon: "🧃" },
];

const menuItems = [
  { id: 1, name: "Jollof Rice & Chicken", price: 2500, desc: "Spiced tomato rice with grilled chicken", emoji: "🍗" },
  { id: 2, name: "Egusi Soup & Eba", price: 2200, desc: "Rich melon soup with cassava swallow", emoji: "🥣" },
  { id: 3, name: "Puff Puff x6", price: 800, desc: "Crispy golden fried dough balls", emoji: "🫓" },
  { id: 4, name: "Chapman Drink", price: 1000, desc: "Classic Nigerian fruit punch", emoji: "🧃" },
];

const savedRestaurants = [
  { id: 1, name: "Spice Garden", cuisine: "Indian · Nigerian", rating: 4.8, time: "25-35 min", image: "🍛" },
  { id: 3, name: "Pizza Palace", cuisine: "Italian · Pizza", rating: 4.7, time: "30-40 min", image: "🍕" },
  { id: 4, name: "Sushi House", cuisine: "Japanese · Asian", rating: 4.9, time: "20-30 min", image: "🍱" },
];

const orderHistory = [
  { id: "#ORD-8821", restaurant: "Spice Garden", items: "Jollof Rice x2, Chapman", total: 6000, status: "delivered", date: "Today, 12:45 PM", emoji: "🍛" },
  { id: "#ORD-8810", restaurant: "Burger Republic", items: "Double Burger x1, Fries", total: 4200, status: "delivered", date: "Yesterday, 7:30 PM", emoji: "🍔" },
  { id: "#ORD-8794", restaurant: "Pizza Palace", items: "Pepperoni Pizza x1", total: 5500, status: "cancelled", date: "Mar 25, 3:15 PM", emoji: "🍕" },
  { id: "#ORD-8780", restaurant: "Sushi House", items: "Salmon Roll x2, Miso", total: 8200, status: "delivered", date: "Mar 22, 1:10 PM", emoji: "🍱" },
];

type Tab = "home" | "orders" | "saved" | "profile";
type SubScreen = "browse" | "menu" | "cart" | "tracking";

const statusColor: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  in_transit: "bg-blue-100 text-blue-700",
};

export function Individual() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [subScreen, setSubScreen] = useState<SubScreen>("browse");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [trackingStep, setTrackingStep] = useState(2);
  const [savedIds, setSavedIds] = useState(new Set([1, 3, 4]));
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = menuItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);

  const addToCart = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));
  const toggleSaved = (id: number) => setSavedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const steps = [
    { label: "Order Placed", icon: CheckCircle2, done: trackingStep >= 0 },
    { label: "Preparing", icon: Package, done: trackingStep >= 1 },
    { label: "On the Way", icon: Bike, done: trackingStep >= 2 },
    { label: "Delivered", icon: Home, done: trackingStep >= 3 },
  ];

  const BottomNav = () => (
    <div className="bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-around flex-shrink-0">
      {([
        { id: "home" as Tab, icon: Home, label: "Home" },
        { id: "orders" as Tab, icon: ShoppingBag, label: "Orders" },
        { id: "saved" as Tab, icon: Heart, label: "Saved" },
        { id: "profile" as Tab, icon: User, label: "Profile" },
      ] as const).map((tab) => (
        <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "home") setSubScreen("browse"); }}
          className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? "text-orange-500" : "text-gray-400"}`}>
          <tab.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
      <button onClick={() => { setActiveTab("home"); setSubScreen("cart"); }}
        className={`flex flex-col items-center gap-1 ${subScreen === "cart" ? "text-orange-500" : "text-gray-400"}`}>
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{cartCount}</span>}
        </div>
        <span className="text-[10px] font-medium">Cart</span>
      </button>
    </div>
  );

  return (
    <div className="w-[390px] h-[844px] bg-gray-50 font-sans overflow-hidden flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════ HOME TAB ══════════ */}
      {activeTab === "home" && subScreen === "browse" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-500" /> Delivering to</p>
                <p className="font-semibold text-sm text-gray-800">Lagos Island, Lagos</p>
              </div>
              <div className="relative"><Bell className="w-6 h-6 text-gray-600" /><span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">3</span></div>
            </div>
            <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Search restaurants, food...</span>
              <button className="ml-auto bg-orange-500 p-1.5 rounded-xl"><Filter className="w-3 h-3 text-white" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-5 mt-4 bg-gradient-to-r from-orange-500 to-amber-400 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-100 font-medium">Today's Special</p>
                <p className="text-white font-bold text-lg leading-tight mt-0.5">Get 30% OFF<br />on first order</p>
                <button className="mt-3 bg-white text-orange-500 text-xs font-bold px-4 py-2 rounded-xl">Order Now</button>
              </div>
              <div className="text-6xl">🍔</div>
            </div>
            <div className="mt-5 px-5">
              <p className="font-semibold text-gray-800 mb-3">Categories</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                    className={`flex flex-col items-center gap-1 min-w-[60px] py-2 px-3 rounded-2xl text-xs font-medium transition-all ${activeCategory === cat.name ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 shadow-sm"}`}>
                    <span className="text-xl">{cat.icon}</span><span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 px-5 pb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">Nearby Restaurants</p>
                <button className="text-orange-500 text-xs font-medium">See all</button>
              </div>
              {restaurants.map((r) => (
                <div key={r.id} className="bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left w-full mb-4 cursor-pointer" onClick={() => setSubScreen("menu")}>
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">{r.image}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{r.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.tagColor}`}>{r.tag}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{r.cuisine}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-600"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {r.rating}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-600"><Clock className="w-3 h-3 text-gray-400" /> {r.time}</span>
                      <span className="text-xs text-gray-600">{r.delivery} delivery</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleSaved(r.id); }} className={`p-1.5 rounded-full flex-shrink-0 ${savedIds.has(r.id) ? "text-red-400" : "text-gray-300"}`}>
                    <Heart className={`w-4 h-4 ${savedIds.has(r.id) ? "fill-red-400" : ""}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <BottomNav />
        </div>
      )}

      {/* ── Menu Sub-screen ── */}
      {activeTab === "home" && subScreen === "menu" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSubScreen("browse")} className="p-2 rounded-xl bg-gray-100"><ArrowLeft className="w-4 h-4 text-gray-700" /></button>
              <div><p className="font-bold text-gray-800">Spice Garden</p><p className="text-xs text-gray-400">Indian · Nigerian</p></div>
              <button onClick={() => toggleSaved(1)} className="ml-auto p-2 rounded-xl bg-red-50">
                <Heart className={`w-4 h-4 ${savedIds.has(1) ? "fill-red-400 text-red-400" : "text-red-400"}`} />
              </button>
            </div>
            <div className="mt-3 flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.8</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 25-35 min</span>
              <span className="text-green-600 font-medium">● Open Now</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <p className="font-semibold text-gray-800 mt-4 mb-3">Menu</p>
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-4 mb-3 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">{item.emoji}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  <p className="text-orange-500 font-bold text-sm mt-1">₦{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cart[item.id] > 0 && <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center"><Minus className="w-3 h-3 text-orange-600" /></button>}
                  {cart[item.id] > 0 && <span className="text-sm font-bold text-gray-800 w-4 text-center">{cart[item.id]}</span>}
                  <button onClick={() => addToCart(item.id)} className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center"><Plus className="w-3 h-3 text-white" /></button>
                </div>
              </div>
            ))}
          </div>
          {cartCount > 0 && (
            <div className="px-5 pb-6 flex-shrink-0">
              <button onClick={() => setSubScreen("cart")} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5 shadow-lg shadow-orange-200">
                <span className="bg-orange-400 rounded-xl px-2 py-1 text-sm">{cartCount}</span>
                <span>View Cart</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Cart Sub-screen ── */}
      {activeTab === "home" && subScreen === "cart" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSubScreen("menu")} className="p-2 rounded-xl bg-gray-100"><ArrowLeft className="w-4 h-4 text-gray-700" /></button>
              <p className="font-bold text-gray-800">Your Cart</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {menuItems.filter((i) => cart[i.id] > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">🛒</div>
                <p className="font-semibold text-gray-700">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add items from a restaurant</p>
                <button onClick={() => setSubScreen("browse")} className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm">Browse Restaurants</button>
              </div>
            ) : (
              <>
                <p className="font-semibold text-gray-700 mt-4 mb-3">Spice Garden</p>
                {menuItems.filter((i) => cart[i.id] > 0).map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 flex items-center gap-3 shadow-sm">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-orange-500 font-bold">₦{(item.price * cart[item.id]).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"><Minus className="w-3 h-3 text-gray-600" /></button>
                      <span className="text-sm font-bold w-4 text-center">{cart[item.id]}</span>
                      <button onClick={() => addToCart(item.id)} className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center"><Plus className="w-3 h-3 text-white" /></button>
                      <button onClick={() => setCart((c) => { const n = {...c}; delete n[item.id]; return n; })} className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center ml-1">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Promo */}
                <div className="bg-orange-50 rounded-2xl p-4 mb-3 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-orange-500" />
                  <input className="flex-1 bg-transparent text-sm text-gray-600 outline-none placeholder-gray-400" placeholder="Enter promo code" />
                  <button className="text-xs text-orange-500 font-bold">Apply</button>
                </div>
                {/* Delivery address */}
                <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800 text-sm">Delivery Address</p>
                    <button className="text-xs text-orange-500 font-medium flex items-center gap-1"><Edit3 className="w-3 h-3" /> Change</button>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                    <p className="text-sm text-gray-600">15 Awolowo Rd, Ikoyi, Lagos</p>
                  </div>
                </div>
                {/* Summary */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3">Order Summary</p>
                  <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Subtotal</span><span>₦{cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Delivery fee</span><span className="text-green-500">Free</span></div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Service fee</span><span>₦150</span></div>
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-800"><span>Total</span><span>₦{(cartTotal + 150).toLocaleString()}</span></div>
                </div>
                <button onClick={() => setSubScreen("tracking")} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl mt-5 shadow-lg shadow-orange-200">
                  Place Order · ₦{(cartTotal + 150).toLocaleString()}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tracking Sub-screen ── */}
      {activeTab === "home" && subScreen === "tracking" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSubScreen("browse")} className="p-2 rounded-xl bg-gray-100"><ArrowLeft className="w-4 h-4 text-gray-700" /></button>
              <p className="font-bold text-gray-800">Track Order</p>
              <span className="ml-auto text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-1 rounded-lg">#ORD-8821</span>
            </div>
          </div>
          <div className="flex-1 px-5 pb-6 overflow-y-auto">
            <div className="mt-4 bg-gradient-to-br from-blue-100 to-green-100 rounded-3xl h-48 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              <Bike className="w-10 h-10 text-orange-500 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Rider is on the way</p>
              <div className="mt-2 bg-white px-3 py-1.5 rounded-xl shadow text-xs font-semibold text-gray-700">ETA: ~12 min</div>
            </div>
            <div className="bg-white rounded-3xl p-5 mt-4 shadow-sm">
              <p className="font-semibold text-gray-800 mb-4">Order Status</p>
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-orange-500" : "bg-gray-100"}`}>
                    <step.icon className={`w-4 h-4 ${step.done ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.done ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                    {i === trackingStep && <p className="text-xs text-orange-500">In progress...</p>}
                  </div>
                  {step.done && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-3xl p-4 mt-4 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">👨‍🦱</div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Emmanuel O.</p>
                <div className="flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-xs text-gray-500">4.9 · Your Rider</span></div>
              </div>
              <button className="ml-auto w-10 h-10 bg-green-50 rounded-full flex items-center justify-center"><span className="text-xl">📞</span></button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ORDERS TAB ══════════ */}
      {activeTab === "orders" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0">
            <p className="font-bold text-gray-800 text-lg">My Orders</p>
            <div className="flex gap-2 mt-3">
              {["All", "Active", "Delivered", "Cancelled"].map((f, i) => (
                <button key={f} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${i === 0 ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
            {orderHistory.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">{order.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 text-sm">{order.restaurant}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[order.status]}`}>{order.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{order.items}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{order.id}</p>
                    <p className="font-bold text-gray-800">₦{order.total.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {order.status === "delivered" && (
                      <button onClick={() => setSubScreen("menu")} className="border border-orange-200 text-orange-500 text-xs font-semibold px-3 py-2 rounded-xl">Reorder</button>
                    )}
                    {order.status === "in_transit" && (
                      <button onClick={() => { setActiveTab("home"); setSubScreen("tracking"); }} className="bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl">Track Order</button>
                    )}
                    {order.status === "delivered" && (
                      <button className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> Rate</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <BottomNav />
        </div>
      )}

      {/* ══════════ SAVED TAB ══════════ */}
      {activeTab === "saved" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0">
            <p className="font-bold text-gray-800 text-lg">Saved Restaurants</p>
            <p className="text-xs text-gray-400 mt-1">{savedRestaurants.filter(r => savedIds.has(r.id)).length} saved</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
            {savedRestaurants.filter(r => savedIds.has(r.id)).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">💔</div>
                <p className="font-semibold text-gray-700">No saved restaurants</p>
                <p className="text-sm text-gray-400 mt-1">Tap the heart icon to save your favourites</p>
                <button onClick={() => setActiveTab("home")} className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm">Explore Restaurants</button>
              </div>
            ) : (
              savedRestaurants.filter(r => savedIds.has(r.id)).map((r) => (
                <button key={r.id} onClick={() => { setActiveTab("home"); setSubScreen("menu"); }}
                  className="bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left w-full mb-4">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">{r.image}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.cuisine}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-600"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {r.rating}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-600"><Clock className="w-3 h-3 text-gray-400" /> {r.time}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleSaved(r.id); }} className="p-2 rounded-full text-red-400">
                    <Heart className="w-5 h-5 fill-red-400" />
                  </button>
                </button>
              ))
            )}
          </div>
          <BottomNav />
        </div>
      )}

      {/* ══════════ PROFILE TAB ══════════ */}
      {activeTab === "profile" && (
        <div className="flex flex-col h-full">
          <div className="bg-white px-5 pt-12 pb-4 flex-shrink-0 border-b border-gray-100">
            <p className="font-bold text-gray-800 text-lg">My Profile</p>
          </div>
          <div className="flex-1 overflow-y-auto pb-6">
            {/* Avatar & name */}
            <div className="bg-white px-5 py-5 flex items-center gap-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-4xl">👩🏽</div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-base">Adaeze Martins</p>
                <p className="text-xs text-gray-400 mt-0.5">adaeze@email.com</p>
                <p className="text-xs text-gray-400">+234 802 345 6789</p>
              </div>
              <button className="p-2 rounded-xl bg-orange-50"><Edit3 className="w-4 h-4 text-orange-500" /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 mx-5 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
              {[
                { label: "Orders", value: "42" },
                { label: "Reviews", value: "18" },
                { label: "Saved", value: String(savedIds.size) },
              ].map((s, i) => (
                <div key={s.label} className={`text-center py-4 ${i < 2 ? "border-r border-gray-100" : ""}`}>
                  <p className="font-bold text-gray-800 text-lg">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Delivery addresses */}
            <div className="px-5 mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800 text-sm">Delivery Addresses</p>
                <button className="text-xs text-orange-500 font-medium">+ Add</button>
              </div>
              {[
                { label: "Home", address: "15 Awolowo Rd, Ikoyi, Lagos", icon: "🏠" },
                { label: "Work", address: "23 Broad St, Lagos Island", icon: "🏢" },
              ].map((a) => (
                <div key={a.label} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center gap-3">
                  <span className="text-xl">{a.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{a.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.address}</p>
                  </div>
                  <button className="p-1"><Edit3 className="w-4 h-4 text-gray-300" /></button>
                </div>
              ))}
            </div>

            {/* Payment methods */}
            <div className="px-5 mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800 text-sm">Payment Methods</p>
                <button className="text-xs text-orange-500 font-medium">+ Add</button>
              </div>
              {[
                { type: "Visa Card", detail: "**** **** **** 4821", icon: "💳" },
                { type: "Bank Transfer", detail: "GTBank · Adaeze M.", icon: "🏦" },
              ].map((p) => (
                <div key={p.type} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{p.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.detail}</p>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">Default</span>
                </div>
              ))}
            </div>

            {/* Settings links */}
            <div className="px-5 mt-4">
              <p className="font-semibold text-gray-800 text-sm mb-2">Settings & Support</p>
              {[
                { icon: Bell, label: "Notifications", sub: "Manage alerts" },
                { icon: Shield, label: "Privacy & Security", sub: "Password, data" },
                { icon: HelpCircle, label: "Help & Support", sub: "FAQs, chat with us" },
                { icon: Settings, label: "App Settings", sub: "Language, theme" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
              <button className="w-full bg-red-50 rounded-2xl p-4 flex items-center gap-3 mt-1">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center"><LogOut className="w-4 h-4 text-red-500" /></div>
                <span className="text-sm font-semibold text-red-500">Log Out</span>
              </button>
            </div>
          </div>
          <BottomNav />
        </div>
      )}
    </div>
  );
}
