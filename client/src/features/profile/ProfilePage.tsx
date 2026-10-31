import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/common/PageHeader";

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile info state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [user]);

  // Password checklist criteria
  const criteria = {
    length: newPassword.length >= 9,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isNewPasswordValid =
    criteria.length && criteria.upper && criteria.lower && criteria.special;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!user) return;

    if (user.role !== "ADMIN") {
      setProfileError(
        "Self-service profile editing is currently restricted to administrators. Please contact your system administrator to update account information.",
      );
      return;
    }

    setProfileLoading(true);
    try {
      await api.patch(`/users/${user.id}`, {
        name: name.trim(),
        phone: phone.trim() || null,
      });
      await refreshUser();
      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      setProfileError(getErrorMessage(err, "Failed to update profile."));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!isNewPasswordValid) {
      setPasswordError("New password does not meet complexity requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(getErrorMessage(err, "Failed to change password."));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your account profile details and security settings"
        breadcrumbs={[
          { label: "Dashboard", href: user?.role === "CUSTOMER" ? "/portal" : "/app/dashboard" },
          { label: "Profile" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500">
                Update your personal name and contact details
              </p>
            </div>
          </div>

          {user?.role !== "ADMIN" && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Self-service profile updates are managed by administrators. You can view your current account details below.
              </span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                disabled={user?.role !== "ADMIN" || profileLoading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400">
                Email address cannot be changed directly
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                disabled={user?.role !== "ADMIN" || profileLoading}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Role
              </label>
              <input
                type="text"
                disabled
                value={user?.role || ""}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold uppercase tracking-wider cursor-not-allowed"
              />
            </div>

            {user?.role === "ADMIN" && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {profileLoading ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Security & Password
              </h2>
              <p className="text-xs text-slate-500">
                Update your account password
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="•••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />

              {/* Password Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 mb-1">
                  New Password Requirements:
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading || !isNewPasswordValid}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {passwordLoading ? "Updating Password..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
