import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // --- FORM STATE ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Please enter both email and password.");
        return;
      }

      // 1️⃣ Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Login failed. Check your credentials.");

      const userId = authData.user.id;

      // 2️⃣ Fetch user info from user_table
      // FIXED: Removed the generic <UserData> to solve TS2558
      const { data: userData, error: fetchError } = await supabase
        .from("user_table")
        .select("id, username, email, is_admin, user_id")
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;
      if (!userData) throw new Error("User data not found.");

      // 3️⃣ Save user info locally (Syncing with your App.tsx logic)
      localStorage.setItem("user", JSON.stringify(userData));

      // 4️⃣ Redirect based on role
      if (userData.is_admin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl transition-all">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Enter your details to access AURORE.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm">
          New to the shop?{" "}
          <Link to="/signup" className="text-indigo-500 font-bold hover:text-indigo-400 transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}