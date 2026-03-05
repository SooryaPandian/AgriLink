import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { LogIn, Eye, EyeOff, Sun, Moon, Sprout } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== "buyer") {
        toast.error("This portal is for buyers only. Use the mobile app for farmer access.");
        return;
      }
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-green-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Theme toggle */}
      <button onClick={toggle} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
        {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-sky-500" />}
      </button>

      <div className="w-full max-w-md z-10">
        {/* Card */}
        <div className="rounded-2xl border p-8 shadow-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 mb-2 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-lg shadow-green-900/40">
              <Sprout size={32} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-green-500 to-amber-500 bg-clip-text text-transparent">AgriLink</span>
            <h1 className="mt-3 text-xl font-bold" style={{ color: "var(--text)" }}>Buyer Portal</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Sign in to manage your crop contracts</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Email</label>
              <input
                type="email"
                placeholder="company@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30"
            >
              {loading
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <LogIn size={18} />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-green-500 hover:text-green-400">Register as Buyer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
