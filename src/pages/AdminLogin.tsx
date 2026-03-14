import { useState, useEffect, type ChangeEvent } from "react"; // Added 'type' keyword
import { supabase } from "../supabaseClient";
import { ShieldAlert, ShieldCheck, UserPlus, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- TYPES ---
interface User {
  email: string;
  username: string;
  is_admin: boolean;
  user_id: string;
}

export default function CreateAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [success, setSuccess] = useState<string>("");

  // --- CHECK CURRENT USER ROLE ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  if (!currentUser?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white">
        <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 text-center max-w-md shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-8">Only active administrators can generate new admin credentials.</p>
          <button 
            onClick={() => navigate("/")}
            className="text-indigo-500 font-bold flex items-center justify-center gap-2 mx-auto hover:underline"
          >
            <ArrowLeft size={16} /> Return to Shop
          </button>
        </div>
      </div>
    );
  }

  // --- CREATE ADMIN FUNCTION ---
  const handleCreateAdmin = async () => {
    setError("");
    setSuccess("");

    if (!username || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Sign up new user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Failed to create user.");

      const userId = authData.user.id;

      // 2️⃣ Insert new admin into user_table
      const { error: insertError } = await supabase
        .from("user_table")
        .insert([
          {
            email,
            username,
            user_id: userId,
            is_admin: true,
          },
        ]);

      if (insertError) throw insertError;

      setSuccess("✅ Admin user created successfully!");
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (err: any) {
      console.error("Admin creation error:", err);
      setError(err.message || "Failed to create admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white">
      <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-indigo-500" size={24} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter">AURORE<span className="text-indigo-500">.</span> STAFF</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Create New Administrator</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold text-center">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Staff Username"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />

          <input
            type="email"
            placeholder="Staff Email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />

          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />

          <button
            onClick={handleCreateAdmin}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <UserPlus size={18} /> Grant Admin Access
              </>
            )}
          </button>

          <button 
            onClick={() => navigate("/admin")}
            className="w-full text-slate-500 text-sm font-bold py-2 hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}