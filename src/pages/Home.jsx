import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart,
  Search,
  Heart,
  X,
  Star,
  ArrowRight,
  ShoppingBag,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";

const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Electronics", sub: ["Phones", "Laptops", "Headphones"] },
  { name: "Fashion", sub: ["Men", "Women", "Kids"] },
  { name: "Home", sub: ["Furniture", "Decor", "Appliances"] },
  { name: "Wellness", sub: ["Fitness", "Supplements", "Care"] },
];

export default function Home({ cart = [], setCart }) {
  const navigate = useNavigate();

  // --- STATE ---
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [subCategory, setSubCategory] = useState(null);
  const [priceRange, setPriceRange] = useState(2000);
  const [showCart, setShowCart] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // --- LOAD CART FROM LOCALSTORAGE ---
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // --- FETCH USER ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData.session?.user?.email;
        if (!email) return;

        const { data: userData, error } = await supabase
          .from("user_table")
          .select("username, is_admin")
          .eq("email", email)
          .single();

        if (error) throw error;

        const userObj = { email, username: userData.username, is_admin: userData.is_admin };
        setUser(userObj);
        localStorage.setItem(userData.is_admin ? "admin" : "user", JSON.stringify(userObj));

        // ⚠️ No automatic navigation for admins here
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser({ email: "", username: "Guest" });
      }
    };

    fetchUser();
  }, []);

  // --- FETCH PRODUCTS (debounced) ---
  useEffect(() => {
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        let query = supabase.from("products").select("*");

        if (category !== "All") query = query.eq("category", category);
        if (subCategory) query = query.eq("sub_category", subCategory);
        if (searchTerm) query = query.ilike("name", `%${searchTerm}%`);
        query = query.lte("price", priceRange);

        const { data, error } = await query;
        if (error) throw error;
        setProducts(data ?? []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [category, subCategory, priceRange, searchTerm]);

  // --- CART LOGIC ---
  const addToCart = (product) => {
    if (!user) return navigate("/login");

    let updated = cart.map((item) =>
      item.id === product.id
        ? { ...item, quantity: Math.min((item.quantity || 1) + 1, 99) }
        : item
    );

    if (!updated.find((i) => i.id === product.id)) updated.push({ ...product, quantity: 1 });

    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeFromCart = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + (Number(item.price ?? 0) * (item.quantity ?? 1)), 0),
    [cart]
  );

  // --- LIGHT/DARK MODE ---
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-900 text-white" : "bg-[#FDFDFD] text-slate-900"} font-sans`}>
      {/* NAVBAR */}
      <nav className={`sticky top-0 z-50 ${darkMode ? "bg-slate-950/90 border-slate-700" : "bg-white/80 border-slate-100"} backdrop-blur-md border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <ShoppingBag size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tighter">
              AURORE<span className="text-indigo-500">.</span>
            </h1>
          </div>

          {/* SEARCH */}
          <div className="hidden md:flex flex-1 max-w-md relative mx-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search items..."
              className={`w-full ${darkMode ? "bg-slate-800 text-white" : "bg-slate-100"} border-none rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm`}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* USER / CART / MODE */}
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-indigo-50 transition">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <>
                <span className="font-bold text-indigo-500">Hello, {user.username || "User"}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.removeItem("user");
                    localStorage.removeItem("admin");
                    localStorage.removeItem("cart");
                    setUser(null);
                    setCart([]);
                    navigate("/");
                  }}
                  className="px-4 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Sign Up
                </button>
              </>
            )}

            <button
              onClick={() => (user ? setShowCart(true) : navigate("/login"))}
              className="group relative flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-all"
            >
              <ShoppingCart size={18} />
              <span className="font-bold text-sm border-l border-white/20 pl-2">{cart.length}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-12 py-12">
        {/* SIDEBAR */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-28">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Collections</h3>
            <nav className="space-y-1">
              {CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <button
                    onClick={() => { setCategory(cat.name); setSubCategory(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-semibold ${
                      category === cat.name ? "bg-indigo-50 text-indigo-700" : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{cat.icon ?? "•"}</span>
                      {cat.name}
                    </span>
                    {cat.sub && <ChevronRight size={14} className={category === cat.name ? "rotate-90" : ""} />}
                  </button>

                  {cat.sub && category === cat.name && (
                    <div className="ml-9 mt-1 mb-4 space-y-1">
                      {cat.sub.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSubCategory(sub)}
                          className={`block w-full text-left text-xs py-1.5 transition-colors ${
                            subCategory === sub ? "text-indigo-600 font-bold" : darkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Budget</h3>
              <input
                type="range"
                min="0"
                max="2000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between mt-3 text-xs font-bold">
                <span className="text-slate-400">$0</span>
                <span className="text-indigo-600">${priceRange}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <section className="flex-1">
          <div className="mb-10">
            <h2 className="text-3xl font-black">{category === "All" ? "Featured Arrivals" : category}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Found {products.length} items.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading
              ? Array(6).fill(0).map((_, i) => (
                  <div key={i} className={`h-80 rounded-3xl animate-pulse ${darkMode ? "bg-slate-800" : "bg-slate-50"}`} />
                ))
              : products.length > 0
              ? products.map((p) => (
                  <div key={p.id} className={`group rounded-[2rem] border p-4 transition-all hover:shadow-xl ${darkMode ? "bg-slate-800 border-slate-700 hover:shadow-slate-900" : "bg-white border-slate-100 hover:shadow-slate-200/50"}`}>
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                      <img
                        src={p.image ?? "https://via.placeholder.com/400"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/50 backdrop-blur rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                        <Heart size={16} />
                      </button>
                    </div>

                    <div className="px-1">
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} className={i < Math.floor(p.rating ?? 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                        ))}
                      </div>
                      <h3 className="font-bold mb-1 line-clamp-1">{p.name ?? "Premium Product"}</h3>
                      <p className="text-slate-400 dark:text-slate-300 text-xs mb-4">
                        High-end {(p.category ?? "Collection").toLowerCase()} for your lifestyle.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black">${p.price ?? 0}</span>
                        <button
                          onClick={() => addToCart(p)}
                          className="bg-indigo-50 dark:bg-indigo-700 text-indigo-600 dark:text-white p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              : (
                <div className="col-span-full py-24 text-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 dark:text-slate-500 font-medium">No items found matching your criteria.</p>
                </div>
              )}
          </div>
        </section>
      </main>

      {/* CART DRAWER */}
      {showCart && user && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <aside className={`relative w-full max-w-sm h-full shadow-2xl flex flex-col p-8 ${darkMode ? "bg-slate-900 text-white" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black">Your Bag</h2>
              <span className="text-indigo-600 font-bold">Hello, {user.username}</span>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="font-bold">Empty bag</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} className="w-16 h-20 rounded-xl object-cover" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-indigo-600 font-black text-sm">${item.price}</p>
                      <p className="text-[10px] mt-1 uppercase font-bold">Qty: {item.quantity ?? 1}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-slate-400 text-sm font-medium">Total Balance</span>
                  <span className="text-3xl font-black">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}