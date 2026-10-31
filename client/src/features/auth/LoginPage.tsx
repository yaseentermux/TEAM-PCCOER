import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, KeyRound, Shield, Users, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/api";
import { BrightloopLogo } from "../../components/common/BrightloopLogo";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillQuick = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);

      // Check if user was redirected from a protected route
      const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const isFromPortal = fromPath?.startsWith("/portal");

      if (fromPath && !fromPath.startsWith("/login") && !fromPath.startsWith("/forbidden")) {
        if (user.role === "CUSTOMER" && !isFromPortal) {
          navigate("/portal", { replace: true });
          return;
        }
        if ((user.role === "ADMIN" || user.role === "INTERNAL") && isFromPortal) {
          navigate("/app/dashboard", { replace: true });
          return;
        }
        navigate(fromPath, { replace: true });
        return;
      }

      // Default role-based destinations
      if (user.role === "CUSTOMER") {
        navigate("/portal", { replace: true });
      } else {
        navigate("/app/dashboard", { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrightloopLogo size={44} showText={false} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            Welcome to Brightloop
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to manage recurring software subscriptions and billing
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Click to fill test credentials:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => fillQuick("admin@brightloop.io", "Password@123")}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Shield className="w-3 h-3 shrink-0" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuick("staff@brightloop.io", "Password@123")}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Users className="w-3 h-3 shrink-0" />
              <span>Staff</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuick("customer@acme.com", "Password@123")}
              className="px-2 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3 h-3 shrink-0" />
              <span>Customer</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
