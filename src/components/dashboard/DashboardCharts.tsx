import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";

const chartConfig = {
  total: { label: "Sales (KES)", color: "hsl(var(--primary))" },
  revenue: { label: "Revenue (KES)", color: "hsl(var(--primary))" },
};

interface DashboardChartsProps {
  salesTrend: { date: string; total: number; count: number }[];
  topProducts: { product_id: string; product_name: string; total_qty: number; total_revenue: number }[];
}

export function DashboardCharts({ salesTrend, topProducts }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Trend (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {salesTrend.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), "dd MMM")} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => format(parseISO(v as string), "dd MMM yyyy")} />} />
                <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No sales data yet.</p>
          )}
        </CardContent>
      </Card>

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
                <YAxis type="category" dataKey="product_name" width={100} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total_revenue" name="Revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No product sales yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
