import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live password validation checklist
  const criteria = {
    length: newPassword.length >= 9,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid =
    criteria.length && criteria.upper && criteria.lower && criteria.special;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from URL. Please use the link sent to your email.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your new password meets all complexity requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to reset password. The reset link may have expired or already been used.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs mb-2">
            <Layers className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set New Password
          </h1>
          <p className="text-sm text-slate-500">
            Create a new strong password for your Brightloop account
          </p>
        </div>

        {!token && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">
                  Missing Reset Token
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  No reset token was found in the URL. Please click the full
                  link provided in your reset email or request a new one.
                </p>
              </div>
            </div>
            <Link
              to="/forgot-password"
              className="inline-block text-xs font-semibold text-amber-900 underline hover:text-amber-950"
            >
              Request a new reset link &rarr;
            </Link>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Password reset successfully
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Your password has been updated. You can now sign in with your
                  new credentials.
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                disabled={!token}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-50"
              />

              {/* Password Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 mb-1">
                  Password Requirements:
                </p>
                <div
                  className={`flex items-center gap-2 ${
                    criteria.length ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {criteria.length ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>At least 9 characters</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    criteria.upper ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {criteria.upper ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>At least one uppercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    criteria.lower ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {criteria.lower ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>At least one lowercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    criteria.special ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {criteria.special ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>At least one special character</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                disabled={!token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !isPasswordValid}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Resetting password..." : "Reset Password"}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
