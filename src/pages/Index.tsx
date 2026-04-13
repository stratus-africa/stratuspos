import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusiness } from "@/contexts/BusinessContext";
import { useDashboard } from "@/hooks/useDashboard";
import { DollarSign, ShoppingCart, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  total: { label: "Sales (KES)", color: "hsl(var(--primary))" },
  revenue: { label: "Revenue (KES)", color: "hsl(var(--primary))" },
};

const Dashboard = () => {
  const { business, currentLocation } = useBusiness();
  const { todaySales, todayCount, todayProfit, todayExpenses, salesTrend, topProducts, lowStockItems, loading } =
    useDashboard();

  const stats = [
    {
      title: "Today's Sales",
      value: `KES ${todaySales.toLocaleString()}`,
      icon: DollarSign,
      sub: `${todayCount} transactions`,
      color: "text-blue-500",
    },
    {
      title: "Items Sold",
      value: `${todayCount}`,
      icon: ShoppingCart,
      sub: "Today",
      color: "text-green-500",
    },
    {
      title: "Low Stock Items",
      value: `${lowStockItems.length}`,
      icon: Package,
      sub: lowStockItems.length > 0 ? `${lowStockItems.length} alerts` : "All stocked",
      color: lowStockItems.length > 0 ? "text-orange-500" : "text-green-500",
    },
    {
      title: "Profit Today",
      value: `KES ${todayProfit.toLocaleString()}`,
      icon: todayProfit >= 0 ? TrendingUp : TrendingDown,
      sub: `Expenses: KES ${todayExpenses.toLocaleString()}`,
      color: todayProfit >= 0 ? "text-green-500" : "text-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {business?.name} — {currentLocation?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesTrend.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(parseISO(v), "dd MMM")}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => format(parseISO(v as string), "dd MMM yyyy")}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-total)"
                    fill="var(--color-total)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No sales data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `KES ${v.toLocaleString()}`} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="product_name"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_revenue" name="Revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No product sales yet. Make your first sale!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* P&L Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit & Loss (Today)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sales Revenue</span>
              <span className="font-medium">KES {todaySales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-medium text-red-500">- KES {todayExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm font-medium">Net Profit</span>
              <span className={`font-bold ${todayProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                KES {todayProfit.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {lowStockItems.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.slice(0, 5).map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.quantity === 0 ? "destructive" : "secondary"}>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.threshold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
