import { useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function Checkout({ cart, setCart }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate total price
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * (item.quantity ?? 1),
    0
  );

  // Handle order submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setLoading(true);

    try {
      // Get logged-in user info (or guest)
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userEmail = storedUser.email || "guest";

      // Insert order into Supabase
      const { data, error } = await supabase.from("orders").insert([
        {
          user_name: name,
          user_email: userEmail,
          address,
          total_price: total,
          items: cart,
          status: "pending", // default status
        },
      ]);

      if (error) throw error;

      // Success: clear cart
      setSuccess(true);
      setCart([]);
      localStorage.removeItem("cart");
    } catch (err) {
      console.error("Order error:", err);
      alert("Error placing order. Try again!");
    } finally {
      setLoading(false);
    }
  };

  // Success message
  if (success)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <h1 className="text-2xl font-bold mb-4">✅ Order Placed Successfully!</h1>
        <p className="mb-6">Your order is pending. We will contact you soon.</p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          Place Another Order
        </button>
      </div>
    );

  return (
    <>
      <Navbar cartCount={cart.length} />
      <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        {cart.length === 0 ? (
          <p className="text-center text-slate-400 font-medium">Your cart is empty.</p>
        ) : (
          <div className="mb-6">
            <h2 className="font-bold mb-2">Your Cart</h2>
            <ul className="divide-y divide-slate-200">
              {cart.map((item) => (
                <li key={item.id} className="py-2 flex justify-between">
                  <span>
                    {item.name} x {item.quantity ?? 1}
                  </span>
                  <span>${((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold mt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Placing Order..." : "Place Order (Cash on Delivery)"}
          </button>
        </form>
      </div>
    </>
  );
}