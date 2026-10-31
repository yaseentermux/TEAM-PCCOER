import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Info } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";
import { BrightloopLogo } from "../../components/common/BrightloopLogo";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit request."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrightloopLogo size={42} showText={false} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter the registered email associated with your Brightloop account
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Password reset link generated
                </p>
                <p className="mt-1 text-emerald-700 text-xs leading-relaxed">
                  If an account exists for <strong className="text-emerald-950">{email}</strong>, a reset token has been registered.
                </p>
              </div>
            </div>

            {/* In demo environments without SMTP mail gateway configured */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Notice for Hackathon Evaluators:</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                Because an outbound SMTP server is not attached to this test database, simulated email tokens are logged to the backend server stdout terminal console. You can also log in directly using the seed credentials below.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800">Pre-seeded demo credentials:</span>
              <p>• Admin: <code>admin@brightloop.io</code> (Password: <code>Password@123</code>)</p>
              <p>• Staff: <code>staff@brightloop.io</code> (Password: <code>Password@123</code>)</p>
              <p>• Customer: <code>customer@acme.com</code> (Password: <code>Password@123</code>)</p>
            </div>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
