import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Login failed");

      const userId = authData.user.id;

      // 2️⃣ Fetch user info from user_table
      const { data: userData, error: fetchError } = await supabase
        .from("user_table")
        .select("id, username, email, is_admin, user_id")
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // 3️⃣ Save user info locally
      localStorage.setItem("user", JSON.stringify(userData));

      // 4️⃣ Redirect based on role
      if (userData.is_admin) {
        navigate("/admin"); // admin redirect
      } else {
        navigate("/"); // normal user redirect
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border rounded-lg outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 border rounded-lg outline-none"
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Signup link */}
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}