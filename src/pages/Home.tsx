// src/pages/Home.tsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart, X, Search,
  ShoppingBag, Trash2, Moon, Sun, 
  LogOut, Check, Edit2, ChevronRight
} from "lucide-react";
import type { CartItemType, ProductType, UserType } from "../types";

const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Electronics", icon: "📱", sub: ["Phones", "Laptops", "Headphones"] },
  { name: "Fashion", icon: "👕", sub: ["Men", "Women", "Kids"] },
  { name: "Home", icon: "🏠", sub: ["Furniture", "Decor", "Appliances"] },
  { name: "Wellness", icon: "🌿", sub: ["Fitness", "Supplements", "Care"] },
];

interface HomeProps {
  cart: CartItemType[];
  setCart: (cart: CartItemType[]) => void;
}

export default function Home({ cart, setCart }: HomeProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // --- STATE ---
  const [user, setUser] = useState<UserType & { is_admin?: boolean } | null>(null);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // Filter States from URL
  const category = searchParams.get("cat") || "All";
  const subCategory = searchParams.get("sub") || null;
  const searchTerm = searchParams.get("q") || "";

  // --- AUTH ---
  const fetchUserDetails = useCallback(async (email: string) => {
    const { data } = await supabase.from("user_table").select("*").eq("email", email).single();
    if (data) {
      setUser({ id: data.id, name: data.username, email: data.email, is_admin: data.is_admin });
      setNewName(data.username);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) fetchUserDetails(session.user.email);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) fetchUserDetails(session.user.email);
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [fetchUserDetails]);

  // --- SEARCH & FILTER LOGIC ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("*");
      
      if (category !== "All") {
        query = query.eq("category", category);
      }
      if (subCategory) {
        query = query.eq("sub_category", subCategory);
      }
      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [category, subCategory, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- ACTIONS ---
  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    const { error } = await supabase.from("user_table").update({ username: newName }).eq("id", user.id);
    if (!error) {
      setUser({ ...user, name: newName });
      setIsEditingName(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("cart");
    setUser(null);
    setCart([]);
    setShowProfileMenu(false);
    navigate("/");
  };

  const addToCart = (product: ProductType) => {
    if (!user) return navigate("/login");
    const existing = cart.find((item) => item.id === product.id);
    const updated = existing 
      ? cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { ...product, quantity: 1 }];
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-slate-900"}`}>
      
      {/* NAVBAR */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          {/* Logo */}
          <div className="flex items-center gap-4 cursor-pointer min-w-fit" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><ShoppingBag size={22} /></div>
            <h1 className="text-2xl font-black tracking-tighter">AURORE<span className="text-indigo-500">.</span></h1>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..."
              className={`w-full pl-12 pr-4 py-2.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? "bg-slate-900 border-slate-800" : "bg-gray-100 border-transparent"}`}
              value={searchTerm}
              onChange={(e) => setSearchParams({ q: e.target.value, cat: category })}
            />
          </div>

          {/* Nav Icons */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setDarkMode(!darkMode); localStorage.setItem("theme", !darkMode ? "dark" : "light"); }} className="p-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-800">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-900">
                  <span className="text-sm font-bold hidden sm:block">{user.name}</span>
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 py-2 overflow-hidden z-[60]">
                    <div className="px-4 py-3 border-b dark:border-slate-800">
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-800 rounded px-2 py-1 text-sm outline-none" />
                          <button onClick={handleUpdateName} className="text-green-500"><Check size={16}/></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black truncate">{user.name}</p>
                          <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-indigo-500"><Edit2 size={14}/></button>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{user.email}</p>
                    </div>
                    {user.is_admin && (
                      <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 font-bold border-b dark:border-slate-800">Admin Dashboard</button>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold transition-colors"><LogOut size={16} /> Logout</button>
                  </div>
                )}
                
                <button onClick={() => setShowCart(true)} className="relative p-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
                </button>
              </div>
            ) : (
              <button onClick={() => navigate("/login")} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR: Categories */}
        <aside className="lg:w-64 space-y-10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 px-4">Departments</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <button 
                    onClick={() => setSearchParams({ cat: cat.name })} 
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${category === cat.name ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-gray-200 dark:hover:bg-slate-800"}`}
                  >
                    <span className="flex items-center gap-3">{cat.icon} {cat.name}</span>
                    {cat.sub && <ChevronRight size={14} className={category === cat.name ? "rotate-90 transition-transform" : ""} />}
                  </button>
                  
                  {/* Subcategories (Visible only when parent is selected) */}
                  {category === cat.name && cat.sub && (
                    <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 pl-4">
                      {cat.sub.map(sub => (
                        <button 
                          key={sub}
                          onClick={() => setSearchParams({ cat: cat.name, sub: sub })}
                          className={`w-full text-left py-2 text-xs font-bold transition-colors ${subCategory === sub ? "text-indigo-500" : "text-slate-500 hover:text-indigo-400"}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <section className="flex-1">
          <header className="mb-10">
            <h2 className="text-3xl font-black mb-2">{category} {subCategory && `> ${subCategory}`}</h2>
            <p className="text-slate-500 text-sm font-medium">Found {products.length} items in this collection</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
               Array(6).fill(0).map((_, i) => <div key={i} className="h-96 rounded-[2.5rem] bg-gray-200 dark:bg-slate-900 animate-pulse" />)
            ) : products.length > 0 ? (
              products.map((p) => (
                <div key={p.id} className="group rounded-[2.5rem] p-5 border dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10">
                  <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 bg-gray-100 dark:bg-slate-800">
                    <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={p.name} />
                  </div>
                  <div className="px-2">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">{p.category}</p>
                    <h3 className="font-bold text-lg truncate mb-4">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black">${p.price}</span>
                      <button 
                        onClick={() => addToCart(p)} 
                        className="p-4 bg-indigo-600 text-white rounded-[1.2rem] hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                      >
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold">No products found</h3>
                <p className="text-slate-500 mt-2">Try adjusting your filters or search term.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)} />
          <aside className={`relative w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform duration-300 ${darkMode ? "bg-slate-950 text-white" : "bg-white"}`}>
            <div className="p-8 flex items-center justify-between border-b dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-black">My Cart</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{cart.length} Items</p>
              </div>
              <button onClick={() => setShowCart(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-900">
                    <img src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                    <p className="text-indigo-600 font-black mb-2">${item.price}</p>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-bold text-slate-500 uppercase">Quantity: {item.quantity}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCart(cart.filter(i => i.id !== item.id))} 
                    className="p-2 h-fit text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-20">
                  <ShoppingBag size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                  <p className="text-slate-500 font-bold">Your cart is empty</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-end mb-8">
                <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Subtotal</span>
                <span className="text-4xl font-black">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => navigate("/checkout")} 
                disabled={cart.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-indigo-600/20"
              >
                Go to Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}