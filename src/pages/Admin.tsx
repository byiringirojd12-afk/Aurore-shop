// src/pages/Admin.tsx
import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { 
  Trash2, Plus, Package, CheckCircle, 
  UploadCloud, X, Loader2, DollarSign, 
  ShoppingBag, Clock 
} from "lucide-react";

interface ProductType {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface OrderType {
  id: number;
  user_name: string;
  user_email: string;
  address: string;
  phone?: string;
  total_price: number;
  status: "pending" | "received";
  items: any[];
  created_at: string;
}

export default function Admin() {
  // --- STATE ---
  const [products, setProducts] = useState<ProductType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<"pending" | "received">("pending");

  // New Product State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prods } = await supabase.from("products").select("*").order("id", { ascending: false });
      const { data: ords } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setProducts(prods || []);
      setOrders(ords || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- IMAGE LOGIC ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToSupabase = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // --- ACTIONS ---
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || !imageFile) return alert("Please fill all required fields.");

    setIsUploading(true);
    try {
      const publicUrl = await uploadToSupabase(imageFile);
      const { error } = await supabase.from("products").insert([
        { name, price: parseFloat(price), description, image: publicUrl }
      ]);

      if (error) throw error;

      // Reset Form
      setName(""); setPrice(""); setDescription(""); setImageFile(null); setImagePreview(null);
      fetchData();
      alert("Product added successfully!");
    } catch (err) {
      alert("Upload failed. Check your storage bucket permissions.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateStatus = async (id: number, current: string) => {
    const nextStatus = current === "pending" ? "received" : "pending";
    await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    fetchData();
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Delete this product?")) {
      await supabase.from("products").delete().eq("id", id);
      fetchData();
    }
  };

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="text-indigo-500 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="md:col-span-1">
            <h1 className="text-3xl font-black tracking-tight">DASHBOARD<span className="text-indigo-500">.</span></h1>
            <p className="text-slate-500 text-sm">Store Management</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><DollarSign size={20}/></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Revenue</p><p className="text-xl font-black">${totalRevenue.toFixed(0)}</p></div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><ShoppingBag size={20}/></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Orders</p><p className="text-xl font-black">{orders.length}</p></div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><Package size={20}/></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Stock</p><p className="text-xl font-black">{products.length}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* LEFT: PRODUCT CREATION */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] sticky top-10">
              <h2 className="text-xl font-bold mb-8">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-5">
                
                <div className="group relative aspect-video rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-500 transition-all">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button"
                        onClick={() => {setImageFile(null); setImagePreview(null)}}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer px-4 text-center">
                      <UploadCloud size={32} className="text-slate-600 mb-2 group-hover:text-indigo-500" />
                      <p className="text-[10px] font-black uppercase text-slate-500">Device Upload</p>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="space-y-4">
                  <input 
                    placeholder="Product Name" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={name} onChange={e => setName(e.target.value)} required
                  />
                  <input 
                    type="number" step="0.01" placeholder="Price ($)" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={price} onChange={e => setPrice(e.target.value)} required
                  />
                  <textarea 
                    placeholder="Product description..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm h-28 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={description} onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : <><Plus size={20}/> Release Product</>}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: ORDERS & INVENTORY */}
          <div className="lg:col-span-8 space-y-12">
            
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">Order Queue</h2>
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {["pending", "received"].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setOrderFilter(f as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${orderFilter === f ? "bg-indigo-600 text-white" : "text-slate-500"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {orders.filter(o => o.status === orderFilter).length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[2.5rem]">
                    <Clock className="mx-auto text-slate-800 mb-2" size={40} />
                    <p className="text-slate-600 font-bold">No {orderFilter} orders.</p>
                  </div>
                ) : (
                  orders.filter(o => o.status === orderFilter).map(order => (
                    <div key={order.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-slate-700 transition-all">
                      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                        <div>
                          <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-1">Customer Details</p>
                          <h4 className="text-lg font-bold">{order.user_name}</h4>
                          <p className="text-slate-500 text-sm">{order.user_email} • {order.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">${order.total_price.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-600 font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-3">
                          {order.items.slice(0, 4).map((item: any, i: number) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden ring-1 ring-slate-800">
                              <img src={item.image} className="w-full h-full object-cover" alt="Item" />
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleUpdateStatus(order.id, order.status)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                            order.status === "pending" ? "bg-green-600 hover:bg-green-500 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {order.status === "pending" ? <><CheckCircle size={14}/> Ship Order</> : "Shipped"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-8">Stock Inventory</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="group bg-slate-900/40 border border-slate-800 p-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-slate-900 transition-all">
                    <img src={p.image} className="w-16 h-16 rounded-xl object-cover" alt={p.name} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{p.name}</h4>
                      <p className="text-indigo-500 font-black">${p.price}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}