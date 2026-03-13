import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin"; // Your admin page

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

function App() {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  const currentUser = getCurrentUser();

  // Check if logged in
  const isLoggedIn = () => !!currentUser;

  // Check if admin
  const isAdmin = () => currentUser?.is_admin;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
        <Route
          path="/login"
          element={isLoggedIn() ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isLoggedIn() ? <Navigate to="/" replace /> : <Signup />}
        />

        {/* Protected Routes */}
        <Route
          path="/checkout"
          element={
            isLoggedIn() ? <Checkout cart={cart} /> : <Navigate to="/login" replace />
          }
        />

        {/* Admin-only route */}
        <Route
          path="/admin"
          element={isAdmin() ? <AdminLogin /> : <Navigate to="/" replace />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;