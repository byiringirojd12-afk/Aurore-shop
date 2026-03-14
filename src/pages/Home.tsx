// src/pages/Home.tsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart, X, Search,
  ShoppingBag, Trash2, LayoutGrid,
  LogOut, ChevronRight, ArrowRight
} from "lucide-react";
import type { CartItemType, ProductType, UserType } from "../types";

interface CategoryType {
  id: string;
  name: string;
  slug: string;
}

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
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Filter States
  const activeCategoryId = searchParams.get("cat") || "all";
  const searchTerm = searchParams.get("q") || "";

  // --- DATA FETCHING ---
  const fetchInitialData = useCallback(async () => {
    const [catRes, sessionRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.auth.getSession()
    ]);

    setCategories(catRes.data || []);

    const session = sessionRes.data.session;
    if (session?.user?.email) {
      const { data: userData } = await supabase
        .from("user_table")
        .select("*")
        .eq("email", session.user.email)
        .single();
      
      if (userData) {
        setUser({ 
          id: userData.id, 
          name: userData.username, 
          email: userData.email, 
          is_admin: userData.is_admin 
        });
      }
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("*");
      if (activeCategoryId !== "all") query = query.eq("category_id", activeCategoryId);
      if (searchTerm) query = query.ilike("name", `%${searchTerm}%`);

      const { data, error } = await query.order("id", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategoryId, searchTerm]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // --- ACTIONS ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("cart");
    setUser(null);
    setCart([]);
    setShowProfileMenu(false);
    navigate("/");
  };

  const addToCart = (product: ProductType) => {
    const existing = cart.find((item) => item.id === product.id);
    const updated = existing 
      ? cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { ...product, quantity: 1 }];
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    setShowCart(true); 
  };

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans antialiased selection:bg-indigo-500/30">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          {/* LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => navigate("/")}>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-all">
              <ShoppingBag size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase italic">
              AURORE<span className="text-indigo-500">.</span>
            </h1>
          </div>

          {/* SEARCH */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search products..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all text-sm placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchParams({ q: e.target.value, cat: activeCategoryId })}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)} 
                  className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-300 border border-slate-700 hover:border-slate-500 transition-all"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-800/50">
                       <p className="text-xs font-bold text-white">{user.name}</p>
                       <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    {user.is_admin && (
                      <button 
                        onClick={() => navigate("/admin")} 
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 text-indigo-400"
                      >
                        Admin Panel <ArrowRight size={12} />
                      </button>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/5 transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => setShowCart(true)} 
                  className="relative p-2.5 bg-white text-slate-950 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                >
                  <ShoppingCart size={18} strokeWidth={2} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate("/login")} 
                className="px-6 py-2 bg-white text-slate-950 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR */}
        <aside className="lg:w-60 shrink-0">
          <div className="sticky top-32">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 px-2">Categories</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSearchParams({ cat: "all" })} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeCategoryId === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
              >
                <LayoutGrid size={14} /> All Products
              </button>

              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => setSearchParams({ cat: cat.id })} 
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeCategoryId === cat.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}
                >
                  <span className="truncate">{cat.name}</span>
                  <ChevronRight size={12} className={activeCategoryId === cat.id ? "opacity-100" : "opacity-0"} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* PRODUCT SECTION */}
        <section className="flex-1">
          <header className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">
              {activeCategoryId === "all" ? "Latest Drops" : categories.find(c => c.id === activeCategoryId)?.name}
            </h2>
            <p className="text-slate-500 text-[11px] font-medium mt-1 uppercase tracking-widest">{products.length} Products Available</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
               Array(6).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-3xl bg-slate-900 animate-pulse" />)
            ) : products.length > 0 ? (
              products.map((p) => (
                <div key={p.id} className="group">
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-slate-900 border border-slate-800 transition-all group-hover:border-indigo-500/30">
                    <img 
                      src={p.image} 
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                      alt={p.name} 
                    />
                  </div>
                  
                  <div className="px-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-white truncate max-w-[70%]">{p.name}</h3>
                      <span className="text-sm font-bold text-indigo-400">${p.price}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mt-1">Limited Release</p>
                    
                    <button 
                      onClick={() => addToCart(p)} 
                      className="w-full mt-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all active:scale-95"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center rounded-3xl border border-slate-900 bg-slate-900/20">
                <p className="text-slate-600 text-[11px] font-bold uppercase tracking-widest">No results found</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <aside className="relative w-full max-w-sm h-full bg-slate-950 border-l border-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 flex items-center justify-between border-b border-slate-900">
              <h2 className="text-lg font-bold tracking-tight uppercase italic">Your Bag</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-900 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 py-1">
                    <h4 className="text-[11px] font-bold text-white uppercase truncate">{item.name}</h4>
                    <p className="text-indigo-400 font-bold text-sm mt-1">${item.price}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Qty: {item.quantity}</p>
                      <button 
                        onClick={() => {
                            const updated = cart.filter(i => i.id !== item.id);
                            setCart(updated);
                            localStorage.setItem("cart", JSON.stringify(updated));
                        }} 
                        className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-slate-600 text-xs font-medium py-10 italic">Empty bag</p>}
            </div>

            <div className="p-8 border-t border-slate-900 bg-slate-900/30">
              <div className="flex justify-between items-end mb-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                <span className="text-2xl font-bold text-white tracking-tight">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => navigate("/checkout")} 
                disabled={cart.length === 0}
                className="w-full bg-white text-slate-950 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-20"
              >
                Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}