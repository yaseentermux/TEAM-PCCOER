import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const homePath = user?.role === "CUSTOMER" ? "/portal" : "/app/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-500 mb-2">
          <FileQuestion className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            404 — Page Not Found
          </h1>
          <p className="text-sm text-slate-500">
            The page you are looking for doesn't exist, has been removed, or is
            temporarily unavailable.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to={user ? homePath : "/login"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            {user ? "Back to Dashboard" : "Go to Login"}
          </Link>
        </div>
      </div>
    </div>
  );
};
