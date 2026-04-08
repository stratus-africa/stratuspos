import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusiness } from "@/contexts/BusinessContext";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { business, currentLocation } = useBusiness();

  const stats = [
    { title: "Today's Sales", value: "KES 0", icon: DollarSign, change: "+0%" },
    { title: "Items Sold", value: "0", icon: ShoppingCart, change: "+0%" },
    { title: "Low Stock Items", value: "0", icon: Package, change: "0 alerts" },
    { title: "Profit Today", value: "KES 0", icon: TrendingUp, change: "+0%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to {business?.name} — {currentLocation?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No sales yet. Start by adding products and making your first sale!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No stock alerts. Add products and inventory to get started.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
