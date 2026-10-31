// [M4] STAND-IN for M1's router, layouts and login, so the billing feature can run until M1's client lands.
import { useState } from "react";
import { createBrowserRouter, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { billingAdminRoutes, billingMenu, billingPortalRoutes } from "@/features/billing/routes";

type Me = { id: number; name: string; email: string; role: "ADMIN" | "INTERNAL" | "CUSTOMER" };
const useMe = () => useQuery({ queryKey: ["me"], queryFn: async () => (await api.get<{ data: Me }>("/auth/me")).data.data, retry: false });

function Login() {
  const [email, setEmail] = useState("admin@brightloop.test");
  const [password, setPassword] = useState("Admin@1234");
  const qc = useQueryClient();
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const me = (await api.post<{ data: Me }>("/auth/login", { email, password })).data.data;
      qc.clear();
      nav(me.role === "CUSTOMER" ? "/portal/invoices" : "/app/dashboard");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const quick = (e: string, p: string) => { setEmail(e); setPassword(p); };
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <form onSubmit={submit} className="w-80 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Brightloop: sign in</h1>
        <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="p">Password</Label><Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full">Sign in</Button>
        <div className="flex flex-wrap gap-2 text-xs text-indigo-700">
          <button type="button" onClick={() => quick("admin@brightloop.test", "Admin@1234")}>Admin</button>
          <button type="button" onClick={() => quick("staff@brightloop.test", "Staff@1234")}>Staff</button>
          <button type="button" onClick={() => quick("customer@brightloop.test", "Customer@1234")}>Customer</button>
        </div>
      </form>
    </div>
  );
}

function Shell({ portal = false }: { portal?: boolean }) {
  const { data: me, isLoading } = useMe();
  const nav = useNavigate();
  const qc = useQueryClient();
  if (isLoading) return null;
  if (!me) return <Navigate to="/login" replace />;
  if (portal !== (me.role === "CUSTOMER")) return <Navigate to={me.role === "CUSTOMER" ? "/portal/invoices" : "/app/dashboard"} replace />;
  const menu = portal ? [{ label: "My invoices", to: "/portal/invoices" }] : billingMenu;
  const logout = async () => { await api.post("/auth/logout"); qc.clear(); nav("/login"); };
  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white">
      <aside className="w-56 shrink-0 border-r bg-white p-4 print:hidden">
        <p className="mb-6 text-lg font-bold text-indigo-700">Brightloop</p>
        <nav className="space-y-1">
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} className={({ isActive }) => cn("block rounded-md px-3 py-1.5 text-sm", isActive ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100")}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t pt-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">{me.name}</p><p>{me.role}</p>
          <button className="mt-2 text-indigo-700" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 print:p-0"><Outlet /></main>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/app", element: <Shell />, children: billingAdminRoutes },
  { path: "/portal", element: <Shell portal />, children: billingPortalRoutes },
  { path: "*", element: <Navigate to="/app/dashboard" replace /> },
]);
