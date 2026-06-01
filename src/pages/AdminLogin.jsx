import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Nesprávne prihlasovacie údaje");
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">
          Admin Login
        </h1>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-2xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-2xl px-4 py-3"
          />

          <button
            onClick={login}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold"
          >
            Prihlásiť sa
          </button>

          <Link
            to="/"
            className="block text-center mt-4 text-slate-500 font-semibold hover:text-slate-900"
          >
            ← Späť na rezervácie
          </Link>
        </div>
      </div>
    </div>
  );
}