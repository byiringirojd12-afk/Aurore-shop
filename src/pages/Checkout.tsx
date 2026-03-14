// src/pages/Checkout.tsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { 
  ArrowLeft, CreditCard, MapPin, User, 
  CheckCircle2, Package, ShoppingBag, Loader2 
} from "lucide-react";
import type { CartItemType } from "../types";

interface CheckoutProps {
  cart: CartItemType[];
  setCart: (cart: CartItemType[]) => void;
}

export default function Checkout({ cart, setCart }: CheckoutProps) {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [formData, setFormData] = useState({ name: "", address: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [darkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // Sync user info if logged in
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.name) {
      setFormData(prev => ({ ...prev, name: storedUser.name }));
    }
  }, []);

  // --- CALCULATIONS ---
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const shipping = 0.00; // Free shipping logic
  const total = subtotal + shipping;

  // --- HANDLE SUBMIT ---
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      const { error } = await supabase.from("orders").insert([
        {
          user_name: formData.name,
          user_email: storedUser.email || "guest",
          address: formData.address,
          phone: formData.phone,
          total_price: total,
          items: cart, // Supabase handles this as JSONB
          status: "pending",
          created_at: new Date()
        },
      ]);

      if (error) throw error;

      setSuccess(true);
      setCart([]);
      localStorage.removeItem("cart");
    } catch (err) {
      console.error("Order error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-slate-900"}`}>
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Order Confirmed!</h1>
          <p className="text-slate-400 leading-relaxed">
            Thank you for your purchase. We've received your order and our team is preparing your package for delivery.
          </p>
          <div className="pt-6">
            <button
              onClick={() => navigate("/")}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
            >
              Back to Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-slate-900"}`}>
      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors font-bold text-sm mb-8"
        >
          <ArrowLeft size={18} /> BACK TO SHOP
        </button>
        <h1 className="text-4xl font-black tracking-tight mb-2">Checkout</h1>
        <p className="text-slate-400">Complete your details to finalize the order.</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT: FORM */}
        <div className="lg:col-span-7 space-y-8">
          <section className={`p-8 rounded-[2.5rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl"><MapPin size={20} /></div>
              <h2 className="text-xl font-bold">Shipping Information</h2>
            </div>
            
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all ${darkMode ? "bg-slate-800 focus:ring-2 focus:ring-indigo-500" : "bg-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"}`}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-4 rounded-2xl outline-none transition-all ${darkMode ? "bg-slate-800 focus:ring-2 focus:ring-indigo-500" : "bg-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"}`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={`w-full px-4 py-4 rounded-2xl outline-none transition-all resize-none ${darkMode ? "bg-slate-800 focus:ring-2 focus:ring-indigo-500" : "bg-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"}`}
                  placeholder="Street name, Apartment, City, Postal Code"
                />
              </div>
            </form>
          </section>

          <section className={`p-8 rounded-[2.5rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500 text-white rounded-2xl"><CreditCard size={20} /></div>
              <h2 className="text-xl font-bold">Payment Method</h2>
            </div>
            <div className={`p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-500/5 flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Package size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm">Cash on Delivery</p>
                  <p className="text-xs text-slate-400">Pay when you receive your package</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-4 border-indigo-600 bg-white" />
            </div>
          </section>
        </div>

        {/* RIGHT: SUMMARY */}
        <div className="lg:col-span-5">
          <div className={`sticky top-32 p-8 rounded-[2.5rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-xl shadow-gray-200/50"}`}>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              Order Summary <span className="text-sm font-normal text-slate-400">({cart.length} items)</span>
            </h3>

            <div className="max-h-60 overflow-y-auto mb-8 pr-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t dark:border-slate-800 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shipping</span>
                <span className="text-green-500 font-bold uppercase text-xs">Calculated at next step</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t dark:border-slate-800">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-4xl font-black text-indigo-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              form="checkout-form"
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full mt-8 bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-indigo-500/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>Confirm Order <ShoppingBag size={20} /></>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
              Secure Checkout • 256-bit Encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}