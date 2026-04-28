import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  DollarSign, RefreshCcw, FileText, Percent, CheckCircle2, Clock, XCircle, RotateCcw,
  TrendingUp, PieChart as PieChartIcon, Loader2,
} from "lucide-react";

type Sub = {
  id: string; status: string; user_id: string; product_id: string | null;
  current_period_start: string | null; current_period_end: string | null;
  created_at: string | null; updated_at: string | null;
};

type Pkg = {
  id: string; name: string;
  monthly_price_kes: number; yearly_price_kes: number;
  paddle_product_id: string | null;
};

const fmtKes = (n: number) =>
  `KES ${new Intl.NumberFormat("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)}`;

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  trialing: "bg-blue-50 text-blue-700",
  past_due: "bg-amber-50 text-amber-700",
  canceled: "bg-rose-50 text-rose-700",
  paused: "bg-muted text-muted-foreground",
};

// Synthetic gateway pool to demo the "By Gateway" widget
const GATEWAYS = ["Stripe", "PayPal", "Bank Transfer"] as const;
const pickGateway = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return GATEWAYS[Math.abs(h) % GATEWAYS.length];
};

export default function SuperAdminPayments() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);

  useEffect(() => {
    (async () => {
      const [subsRes, pkgRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id,status,user_id,product_id,current_period_start,current_period_end,created_at,updated_at")
          .order("created_at", { ascending: false }),
        supabase.from("subscription_packages").select("id,name,monthly_price_kes,yearly_price_kes,paddle_product_id"),
      ]);
      setSubs((subsRes.data || []) as Sub[]);
      setPackages((pkgRes.data || []) as Pkg[]);
      setLoading(false);
    })();
  }, []);

  const planByProduct = useMemo(() => {
    const m = new Map<string, Pkg>();
    packages.forEach((p) => p.paddle_product_id && m.set(p.paddle_product_id, p));
    return m;
  }, [packages]);

  const planFor = (s: Sub): Pkg | undefined => (s.product_id ? planByProduct.get(s.product_id) : undefined);
  const amountFor = (s: Sub) => Number(planFor(s)?.monthly_price_kes ?? 0);

  const totals = useMemo(() => {
    let totalRevenue = 0, monthlyRevenue = 0;
    let paid = 0, pending = 0, failed = 0, refunded = 0;
    const startThisMonth = startOfMonth(new Date());
    subs.forEach((s) => {
      const amt = amountFor(s);
      if (s.status === "active" || s.status === "trialing") {
        totalRevenue += amt;
        paid += 1;
        const created = s.created_at ? new Date(s.created_at) : null;
        if (created && created >= startThisMonth) monthlyRevenue += amt;
      } else if (s.status === "past_due") pending += 1;
      else if (s.status === "canceled") failed += 1;
      else if (s.status === "paused") refunded += 1;
    });
    return { totalRevenue, monthlyRevenue, totalTransactions: subs.length, totalTax: 0, paid, pending, failed, refunded };
  }, [subs, packages]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      map.set(format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM"), 0);
    }
    subs.forEach((s) => {
      if (!s.created_at) return;
      const m = format(new Date(s.created_at), "yyyy-MM");
      if (map.has(m)) map.set(m, (map.get(m) || 0) + amountFor(s));
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      month: format(new Date(k + "-01"), "MMM yyyy"),
      revenue: v,
    }));
  }, [subs, packages]);

  const gatewayBreakdown = useMemo(() => {
    const acc = new Map<string, { count: number; revenue: number }>();
    GATEWAYS.forEach((g) => acc.set(g, { count: 0, revenue: 0 }));
    subs.forEach((s) => {
      const g = pickGateway(s.id);
      const cur = acc.get(g)!;
      cur.count += 1;
      cur.revenue += amountFor(s);
    });
    const total = subs.length || 1;
    return Array.from(acc.entries()).map(([name, v]) => ({
      name, count: v.count, revenue: v.revenue, share: (v.count / total) * 100,
    }));
  }, [subs, packages]);

  const recent = subs.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: "Total Revenue", value: fmtKes(totals.totalRevenue), icon: DollarSign, iconBg: "bg-emerald-600" },
    { label: "Monthly Revenue", value: fmtKes(totals.monthlyRevenue), icon: RefreshCcw, iconBg: "bg-emerald-500" },
    { label: "Total Transactions", value: String(totals.totalTransactions), icon: FileText, iconBg: "bg-blue-500" },
    { label: "Total Tax", value: fmtKes(totals.totalTax), icon: Percent, iconBg: "bg-amber-500" },
  ];

  const statusCards = [
    { label: "Paid", value: totals.paid, icon: CheckCircle2, color: "text-emerald-600", iconBg: "bg-emerald-100" },
    { label: "Pending", value: totals.pending, icon: Clock, color: "text-amber-600", iconBg: "bg-amber-100" },
    { label: "Failed", value: totals.failed, icon: XCircle, color: "text-rose-600", iconBg: "bg-rose-100" },
    { label: "Refunded", value: totals.refunded, icon: RotateCcw, color: "text-blue-600", iconBg: "bg-blue-100" },
  ];

  const planFromGateway = (s: Sub) => planFor(s)?.name || "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payments Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue, transactions, and payment analytics.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-lg ${s.iconBg} flex items-center justify-center text-white shrink-0`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</div>
              <div className="text-2xl font-bold tracking-tight truncate">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statusCards.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</div>
              <div className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            </div>
            <div className={`h-9 w-9 rounded-full ${s.iconBg} flex items-center justify-center`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Revenue (Last 12 Months)</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(238 84% 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(238 84% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => fmtKes(v)} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(238 84% 60%)" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">By Gateway</h3>
          </div>
          <div className="space-y-4">
            {gatewayBreakdown.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-sm font-semibold">{fmtKes(p.revenue)}</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.max(2, p.share)}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {p.count} transaction{p.count === 1 ? "" : "s"} · {p.share.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl">
        <div className="p-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Recent Payments</h3>
          </div>
          <Link to="/super-admin/subscriptions" className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-semibold py-2.5 px-5">Invoice</th>
                <th className="text-left font-semibold py-2.5 px-5">Tenant</th>
                <th className="text-left font-semibold py-2.5 px-5">Plan</th>
                <th className="text-left font-semibold py-2.5 px-5">Amount</th>
                <th className="text-left font-semibold py-2.5 px-5">Gateway</th>
                <th className="text-left font-semibold py-2.5 px-5">Status</th>
                <th className="text-left font-semibold py-2.5 px-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No payments yet.</td></tr>
              )}
              {recent.map((s, i) => {
                const date = s.created_at ? new Date(s.created_at) : new Date();
                const inv = `INV-${format(date, "yyyyMM")}-${String(i + 1).padStart(4, "0")}`;
                const statusLabel =
                  s.status === "active" || s.status === "trialing" ? "Paid" :
                  s.status === "past_due" ? "Pending" :
                  s.status === "canceled" ? "Failed" :
                  s.status === "paused" ? "Refunded" : s.status;
                return (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="py-3 px-5">
                      <Link to="/super-admin/subscriptions" className="text-emerald-700 hover:underline font-medium">{inv}</Link>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-muted-foreground truncate max-w-[260px]">{s.user_id}</td>
                    <td className="py-3 px-5">{planFromGateway(s)}</td>
                    <td className="py-3 px-5 font-semibold">{fmtKes(amountFor(s))}</td>
                    <td className="py-3 px-5">{pickGateway(s.id)}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s.status] || "bg-muted text-muted-foreground"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">{format(date, "MMM dd, yyyy")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
