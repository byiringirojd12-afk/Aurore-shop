// src/pages/Admin.tsx
import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { 
  Trash2, Plus, Package, CheckCircle, 
  UploadCloud, X, Loader2, DollarSign, 
  ShoppingBag, Clock, Layers, LayoutGrid
} from "lucide-react";

interface ProductType {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category_id?: string;
}

interface CategoryType {
  id: string;
  name: string;
  slug: string;
}

interface OrderType {
  id: number;
  user_name: string;
  total_price: number;
  status: "pending" | "received";
  items: any[];
  created_at: string;
}

export default function Admin() {
  // --- STATE ---
  const [view, setView] = useState<"orders" | "products" | "categories">("orders");
  const [products, setProducts] = useState<ProductType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prods } = await supabase.from("products").select("*").order("id", { ascending: false });
      const { data: ords } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      
      setProducts(prods || []);
      setOrders(ords || []);
      setCategories(cats || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- HANDLERS ---
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || !imageFile) return alert("Required fields missing.");
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      await supabase.storage.from("product-images").upload(fileName, imageFile);
      const { data: imgData } = supabase.storage.from("product-images").getPublicUrl(fileName);

      const { error } = await supabase.from("products").insert([{
        name, 
        price: parseFloat(price), 
        description, 
        image: imgData.publicUrl,
        category_id: categoryId || null
      }]);

      if (error) throw error;
      setName(""); setPrice(""); setCategoryId(""); setImagePreview(null);
      fetchData();
    } catch (err) { alert("Upload failed."); } finally { setIsUploading(false); }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    const slug = newCatName.toLowerCase().replace(/ /g, "-");
    const { error } = await supabase.from("categories").insert([{ name: newCatName, slug }]);
    if (!error) { setNewCatName(""); fetchData(); }
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Delete category? Products in this category will become uncategorized.")) {
      await supabase.from("categories").delete().eq("id", id);
      fetchData();
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">CONTROL<span className="text-indigo-500">.</span></h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Management Terminal</p>
          </div>
          
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            {[
              { id: "orders", icon: ShoppingBag, label: "Orders" },
              { id: "products", icon: Package, label: "Stock" },
              { id: "categories", icon: Layers, label: "Categories" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${view === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-white"}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <DollarSign className="text-indigo-500 mb-2" size={20} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Revenue</p>
                <p className="text-2xl font-black">${totalRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <ShoppingBag className="text-amber-500 mb-2" size={20} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Orders</p>
                <p className="text-2xl font-black">{orders.length}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <Package className="text-emerald-500 mb-2" size={20} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Products</p>
                <p className="text-2xl font-black">{products.length}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <Layers className="text-purple-500 mb-2" size={20} />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Categories</p>
                <p className="text-2xl font-black">{categories.length}</p>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] sticky top-10">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Plus className="text-indigo-500" size={20}/> New Release
              </h2>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="group relative aspect-video rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-500 transition-all cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer p-4">
                      <UploadCloud size={32} className="text-slate-700 group-hover:text-indigo-500 mb-2" />
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Upload Asset</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                      }} />
                    </label>
                  )}
                </div>

                <input 
                  placeholder="Item Name" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={name} onChange={e => setName(e.target.value)} required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" placeholder="Price ($)" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={price} onChange={e => setPrice(e.target.value)} required
                  />
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-slate-400"
                    value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  >
                    <option value="">Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <textarea 
                  placeholder="Description..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={description} onChange={e => setDescription(e.target.value)}
                />

                <button 
                  disabled={isUploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Publish to Store"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: LISTS */}
          <div className="lg:col-span-8">
            
            {/* VIEW: ORDERS */}
            {view === "orders" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <LayoutGrid className="text-indigo-500" /> ACTIVE QUEUE
                </h3>
                {orders.length === 0 ? (
                  <div className="p-20 border-2 border-dashed border-slate-900 rounded-[3rem] text-center text-slate-700 font-bold">No orders found.</div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">TXN #{order.id.toString().slice(-4)}</p>
                        <h4 className="text-xl font-bold">{order.user_name}</h4>
                        <p className="text-slate-500 text-xs font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-2xl font-black">${order.total_price.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mt-2 ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {order.status}
                        </span>
                      </div>
                      <button 
                        onClick={async () => {
                           const next = order.status === 'pending' ? 'received' : 'pending';
                           await supabase.from("orders").update({ status: next }).eq("id", order.id);
                           fetchData();
                        }}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500 transition-all"
                      >
                        <CheckCircle className={order.status === 'received' ? 'text-emerald-500' : 'text-slate-600'} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VIEW: CATEGORIES */}
            {view === "categories" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800">
                  <input 
                    placeholder="New Category Name..." 
                    className="flex-1 bg-transparent outline-none text-sm font-bold px-2"
                    value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  />
                  <button onClick={handleAddCategory} className="bg-indigo-600 p-3 rounded-2xl hover:bg-indigo-500 transition-all">
                    <Plus size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex justify-between items-center group">
                      <div>
                        <h4 className="font-bold text-lg">{cat.name}</h4>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">/{cat.slug}</p>
                      </div>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="p-3 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW: PRODUCTS */}
            {view === "products" && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {products.map(p => (
                   <div key={p.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl flex items-center gap-4 group">
                     <img src={p.image} className="w-16 h-16 rounded-2xl object-cover" alt={p.name} />
                     <div className="flex-1">
                        <h4 className="font-bold text-sm truncate">{p.name}</h4>
                        <p className="text-indigo-500 font-black text-xs">${p.price}</p>
                     </div>
                     <button 
                       onClick={async () => { if(confirm("Delete?")) { await supabase.from("products").delete().eq("id", p.id); fetchData(); } }}
                       className="p-3 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                 ))}
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}