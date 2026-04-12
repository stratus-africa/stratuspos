import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ShoppingCart, TrendingUp } from "lucide-react";

interface PlatformStats {
  totalBusinesses: number;
  totalUsers: number;
  totalSales: number;
  totalRevenue: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalBusinesses: 0,
    totalUsers: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [bizRes, profileRes, salesRes] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("sales").select("total"),
      ]);

      setStats({
        totalBusinesses: bizRes.count || 0,
        totalUsers: profileRes.count || 0,
        totalSales: salesRes.data?.length || 0,
        totalRevenue: salesRes.data?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-blue-500" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-green-500" },
    { title: "Total Sales", value: stats.totalSales, icon: ShoppingCart, color: "text-orange-500" },
    { title: "Total Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground">Overview of all businesses on the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
