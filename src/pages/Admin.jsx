import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Trash2, Plus, Package, CheckCircle } from "lucide-react";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
  });
  const [filter, setFilter] = useState("pending"); // filter orders

  // --- FETCH PRODUCTS ---
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.log("Fetch error:", error);
    else setProducts(data);
  };

  // --- FETCH ORDERS ---
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.log("Fetch orders error:", error);
    else setOrders(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // --- ADD PRODUCT ---
  const handleAddProduct = async () => {
    const { error } = await supabase
      .from("products")
      .insert([{ ...newProduct, price: parseFloat(newProduct.price) }]);

    if (error) console.log("Insert error:", error);
    else {
      setNewProduct({ name: "", price: "", image: "", description: "" });
      fetchProducts();
    }
  };

  // --- DELETE PRODUCT ---
  const handleDeleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) console.log("Delete error:", error);
    else fetchProducts();
  };

  // --- APPROVE ORDER ---
  const handleApproveOrder = async (id) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "received" })
      .eq("id", id);
    if (error) console.log("Approve order error:", error);
    else fetchOrders();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-10">
        <Package size={28} className="text-blue-500" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* ADD PRODUCT PANEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Plus size={18} />
            Add Product
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newProduct.image}
              onChange={(e) =>
                setNewProduct({ ...newProduct, image: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            />
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAddProduct}
              className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-lg p-3 font-semibold"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-6">Products</h2>
          {products.length === 0 ? (
            <p className="text-slate-400">No products found.</p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <p className="text-blue-400 font-bold mt-1">${p.price}</p>
                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                      {p.description}
                    </p>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="mt-4 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- ORDERS PANEL --- */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Orders</h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setFilter("pending")}
                className={`px-3 py-1 rounded ${
                  filter === "pending" ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("received")}
                className={`px-3 py-1 rounded ${
                  filter === "received" ? "bg-indigo-600" : "bg-slate-800"
                }`}
              >
                Received
              </button>
            </div>

            {orders.filter(o => o.status === filter).length === 0 ? (
              <p className="text-slate-400">No {filter} orders found.</p>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((o) => o.status === filter)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-blue-400">
                          {order.user_name} ({order.user_email})
                        </span>
                        <span className="text-sm text-slate-400">
                          ${order.total_price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm mb-2">
                        Address: {order.address}
                      </div>
                      <div className="text-slate-400 text-sm mb-2">
                        Items:
                        <ul className="ml-4 list-disc">
                          {order.items.map((item, i) => (
                            <li key={i}>
                              {item.name} x {item.quantity ?? 1} (${item.price})
                            </li>
                          ))}
                        </ul>
                      </div>
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleApproveOrder(order.id)}
                          className="mt-2 px-4 py-2 bg-green-600 rounded hover:bg-green-500 flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      )}
                      {order.status === "received" && (
                        <span className="text-green-400 font-bold">Received ✅</span>
                      )}
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