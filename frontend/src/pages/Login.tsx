import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { login as loginApi, getCurrentUser } from "../api/auth";
import { Shield, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate & obtain tokens
      const tokenData = await loginApi({ email: email.trim(), password });

      // 2. Store access & refresh tokens
      setTokens(tokenData.access_token, tokenData.refresh_token);

      // 3. Fetch current user via dynamic MTD route
      const user = await getCurrentUser();
      setUser(user);

      // 4. Redirect to dashboard
      navigate("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        "Authentication failed. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl backdrop-blur-sm">
        {/* Title / Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Adaptive Cyber Defense
          </h2>
          <p className="text-sm text-slate-400">
            Sign in to access the active defense portal
          </p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@defense.local"
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-cyan-950/50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}