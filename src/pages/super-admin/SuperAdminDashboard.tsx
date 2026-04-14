import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ShoppingCart, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface PlatformStats {
  totalBusinesses: number;
  totalUsers: number;
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  sales: number;
}

interface RecentBusiness {
  id: string;
  name: string;
  created_at: string;
  currency: string;
}

interface TopBusiness {
  name: string;
  revenue: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalBusinesses: 0, totalUsers: 0, totalSales: 0, totalRevenue: 0, totalExpenses: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<TopBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [bizRes, profileRes, salesRes, expenseRes, recentBizRes] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("sales").select("total, created_at, business_id"),
        supabase.from("expenses").select("amount"),
        supabase.from("businesses").select("id, name, created_at, currency").order("created_at", { ascending: false }).limit(5),
      ]);

      const salesData = salesRes.data || [];
      const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.total), 0);
      const totalExpenses = (expenseRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);

      setStats({
        totalBusinesses: bizRes.count || 0,
        totalUsers: profileRes.count || 0,
        totalSales: salesData.length,
        totalRevenue,
        totalExpenses,
      });

      setRecentBusinesses(recentBizRes.data || []);

      // Build daily revenue for last 30 days
      const dailyMap = new Map<string, { revenue: number; sales: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        dailyMap.set(d, { revenue: 0, sales: 0 });
      }
      salesData.forEach((s) => {
        const d = format(new Date(s.created_at), "yyyy-MM-dd");
        const entry = dailyMap.get(d);
        if (entry) {
          entry.revenue += Number(s.total);
          entry.sales += 1;
        }
      });
      setDailyRevenue(
        Array.from(dailyMap.entries()).map(([date, val]) => ({
          date: format(new Date(date), "dd MMM"),
          ...val,
        }))
      );

      // Top businesses by revenue
      const bizRevenueMap = new Map<string, number>();
      salesData.forEach((s) => {
        bizRevenueMap.set(s.business_id, (bizRevenueMap.get(s.business_id) || 0) + Number(s.total));
      });
      const { data: allBiz } = await supabase.from("businesses").select("id, name");
      const bizNameMap = new Map((allBiz || []).map((b) => [b.id, b.name]));
      const topBiz = Array.from(bizRevenueMap.entries())
        .map(([id, revenue]) => ({ name: bizNameMap.get(id) || "Unknown", revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopBusinesses(topBiz);

      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-blue-500" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-green-500" },
    { title: "Total Sales", value: stats.totalSales, icon: ShoppingCart, color: "text-orange-500" },
    { title: "Platform Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-purple-500" },
    { title: "Platform Expenses", value: `KES ${stats.totalExpenses.toLocaleString()}`, icon: DollarSign, color: "text-red-500" },
    { title: "Net Profit", value: `KES ${(stats.totalRevenue - stats.totalExpenses).toLocaleString()}`, icon: ArrowUpRight, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground">Overview of all businesses on the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Businesses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Businesses by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topBusinesses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No sales data yet</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBusinesses} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Businesses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently Registered Businesses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBusinesses.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell><Badge variant="outline">{biz.currency}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(biz.created_at), "MMM dd, yyyy")}</TableCell>
                </TableRow>
              ))}
              {recentBusinesses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No businesses yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
