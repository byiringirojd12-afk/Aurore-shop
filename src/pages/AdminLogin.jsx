import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function CreateAdmin() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 1️⃣ Check current user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
  }, []);

  if (!currentUser?.is_admin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>Only admins can create new admin accounts.</p>
      </div>
    );
  }

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError("");

    try {
      // 2️⃣ Sign up new user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error("User creation failed");

      const userId = authData.user.id;

      // 3️⃣ Insert into user_table as admin
      const { error: insertError } = await supabase
        .from("user_table")
        .insert([
          {
            email,
            username,
            user_id: userId,
            is_admin: true, // explicitly set as admin
          },
        ]);

      if (insertError) throw insertError;

      alert("Admin user created successfully!");
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Admin creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Admin</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-4 border rounded-lg outline-none"
        />
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
          onClick={handleCreateAdmin}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          disabled={loading}
        >
          {loading ? "Creating admin..." : "Create Admin"}
        </button>
      </div>
    </div>
  );
}