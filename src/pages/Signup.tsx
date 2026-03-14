import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { User, Mail, Lock, UserPlus, Loader2 } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  // --- FORM STATE ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- SIGNUP HANDLER ---
  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!username || !email || !password) {
        setError("All fields are required.");
        return;
      }

      // 1️⃣ Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Signup failed.");

      const userId = authData.user.id;

      // 2️⃣ Insert user into Supabase user_table
      // FIXED: Removed <UserData> generic to resolve TS2558 build error
      const { error: insertError } = await supabase
        .from("user_table")
        .insert([
          {
            username,
            email,
            user_id: userId,
            is_admin: false, // Default role
          },
        ]);

      if (insertError) throw insertError;

      // 3️⃣ Success - Redirect to login
      alert("Account created! Please check your email for confirmation.");
      navigate("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl transition-all">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white mb-2">Create Account</h2>
          <p className="text-slate-500 text-sm">Join AURORE and start shopping.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Username"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
            />
          </div>

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
                <UserPlus size={18} /> Get Started
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-500 font-bold hover:text-indigo-400 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}