// src/App.tsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin"; // Changed from AdminLogin to Admin
import AdminLogin from "./pages/AdminLogin";

import type { CartItemType, UserType } from "./types";

export default function App() {
  // --- USER STATE ---
  // We use state here so that when a user logs in, the whole app re-renders and routes open up.
  const [user, setUser] = useState<(UserType & { is_admin?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  // --- CART STATE ---
  const [cart, setCart] = useState<CartItemType[]>(() => {
    const stored = localStorage.getItem("cart");
    try {
      return stored ? (JSON.parse(stored) as CartItemType[]) : [];
    } catch {
      return [];
    }
  });

  // --- AUTH LISTENER ---
  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for sign-in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (email: string) => {
    const { data } = await supabase
      .from("user_table")
      .select("*")
      .eq("email", email)
      .single();
    
    if (data) {
      setUser({ id: data.id, name: data.username, email: data.email, is_admin: data.is_admin });
    }
    setLoading(false);
  };

  // --- SYNC CART ---
  const updateCart = (updatedCart: CartItemType[]) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  if (loading) return null; // Or a loading spinner

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC HOME */}
        <Route path="/" element={<Home cart={cart} setCart={updateCart} />} />

        {/* AUTH ROUTES */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" replace /> : <Signup />}
        />

        {/* PROTECTED CHECKOUT */}
        <Route
          path="/checkout"
          element={
            user ? (
              <Checkout cart={cart} setCart={updateCart} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ADMIN ROUTES */}
        {/* If user is admin, show Dashboard. If not logged in, show AdminLogin. If logged in but not admin, go Home. */}
        <Route
          path="/admin"
          element={
            user?.is_admin ? (
              <Admin /> 
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <AdminLogin />
            )
          }
        />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}