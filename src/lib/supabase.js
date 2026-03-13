import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dngabmkaxninvtuxcyta.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ2FibWtheG5pbnZ0dXhjeXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzQ5MDUsImV4cCI6MjA4ODcxMDkwNX0.Pz1Avs3pbAKDGFH_r3Xyhhjoms6XwjuaIyLnSb4bFXA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all products from the "products" table
 * @returns {Promise<Array>} array of product objects
 */
export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data;
}

/**
 * Add a new order to the "orders" table
 * @param {Array} cartItems - array of product objects in the cart
 * @param {String} customerName - customer full name
 * @param {String} customerAddress - customer address
 * @returns {Promise<Boolean>} true if order created successfully
 */
export async function addOrder(cartItems, customerName, customerAddress) {
  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  const { error } = await supabase.from("orders").insert([
    {
      items: cartItems,
      total,
      customer_name: customerName,
      customer_address: customerAddress,
    },
  ]);
  if (error) {
    console.error("Error placing order:", error);
    return false;
  }
  return true;
}

/**
 * Fetch all orders (optional, for admin view)
 * @returns {Promise<Array>} array of orders
 */
export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data;
}