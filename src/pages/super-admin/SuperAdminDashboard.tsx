import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  Building2, Users, Tag, CreditCard, Loader2, TrendingUp, Activity, Shield,
} from "lucide-react";

type Sub = { id: string; status: string; user_id: string; product_id: string | null; created_at: string | null };
type Biz = { id: string; name: string; is_active: boolean; created_at: string | null };
type Profile = { id: string; full_name: string | null; email: string | null; created_at: string };

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  trialing: "bg-blue-50 text-blue-700",
  past_due: "bg-amber-50 text-amber-700",
  canceled: "bg-rose-50 text-rose-700",
  paused: "bg-muted text-muted-foreground",
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [packagesCount, setPackagesCount] = useState(0);
  const [superAdminCount, setSuperAdminCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [subsRes, bizRes, profRes, pkgRes, saRes] = await Promise.all([
        supabase.from("subscriptions").select("id,status,user_id,product_id,created_at").order("created_at", { ascending: false }),
        supabase.from("businesses").select("id,name,is_active,created_at").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name,email,created_at").order("created_at", { ascending: false }),
        supabase.from("subscription_packages").select("id", { count: "exact", head: true }),
        supabase.from("super_admins").select("id", { count: "exact", head: true }),
      ]);
      setSubs((subsRes.data || []) as Sub[]);
      setBusinesses((bizRes.data || []) as Biz[]);
      setProfiles((profRes.data || []) as Profile[]);
      setPackagesCount(pkgRes.count || 0);
      setSuperAdminCount(saRes.count || 0);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const activeBiz = businesses.filter((b) => b.is_active).length;
    const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing").length;
    return {
      tenants: businesses.length,
      activeBiz,
      users: profiles.length,
      activeSubs,
    };
  }, [businesses, subs, profiles]);

  const signupsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const m = format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM");
      map.set(m, 0);
    }
    businesses.forEach((b) => {
      if (!b.created_at) return;
      const m = format(new Date(b.created_at), "yyyy-MM");
      if (map.has(m)) map.set(m, (map.get(m) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      month: format(new Date(k + "-01"), "MMM"),
      tenants: v,
    }));
  }, [businesses]);

  const recentBiz = businesses.slice(0, 5);
  const recentUsers = profiles.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: "Total Tenants", value: stats.tenants, sub: `${stats.activeBiz} active`, icon: Building2, iconBg: "bg-emerald-600" },
    { label: "Total Users", value: stats.users, sub: "Across all tenants", icon: Users, iconBg: "bg-blue-500" },
    { label: "Active Subscriptions", value: stats.activeSubs, sub: `${subs.length} total`, icon: CreditCard, iconBg: "bg-violet-500" },
    { label: "Plans", value: packagesCount, sub: `${superAdminCount} super admins`, icon: Tag, iconBg: "bg-amber-500" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Tenants, users, and platform health at a glance.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-lg ${s.iconBg} flex items-center justify-center text-white shrink-0`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</div>
              <div className="text-2xl font-bold tracking-tight truncate">{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Tenant Signups (Last 12 Months)</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupsByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="bizGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="tenants" stroke="hsl(160 84% 39%)" strokeWidth={2.5} fill="url(#bizGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Subscription Status</h3>
          </div>
          <div className="space-y-3">
            {(["active", "trialing", "past_due", "canceled", "paused"] as const).map((st) => {
              const c = subs.filter((s) => s.status === st).length;
              return (
                <div key={st} className="flex items-center justify-between text-sm">
                  <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[st]}`}>
                    {st.replace("_", " ")}
                  </span>
                  <span className="font-semibold">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-border rounded-xl">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-semibold">Recent Tenants</h3>
            </div>
            <Link to="/super-admin/businesses" className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentBiz.length === 0 && <p className="p-5 text-sm text-muted-foreground">No tenants yet.</p>}
            {recentBiz.map((b) => (
              <Link key={b.id} to={`/super-admin/businesses/${b.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.created_at && format(new Date(b.created_at), "MMM dd, yyyy")}</div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {b.is_active ? "Active" : "Suspended"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-semibold">Recent Users</h3>
            </div>
            <Link to="/super-admin/users" className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.length === 0 && <p className="p-5 text-sm text-muted-foreground">No users yet.</p>}
            {recentUsers.map((u) => (
              <Link key={u.id} to={`/super-admin/users/${u.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{u.full_name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email || "—"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{format(new Date(u.created_at), "MMM dd")}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
