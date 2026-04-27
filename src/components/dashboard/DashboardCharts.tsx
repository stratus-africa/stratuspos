import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, BarChartHorizontal } from "lucide-react";

const chartConfig = {
  total: { label: "Sales (KES)", color: "hsl(var(--primary))" },
  revenue: { label: "Revenue (KES)", color: "hsl(var(--primary))" },
};

interface DashboardChartsProps {
  salesTrend: { date: string; total: number; count: number }[];
  topProducts: { product_id: string; product_name: string; total_qty: number; total_revenue: number }[];
}

export function DashboardCharts({ salesTrend, topProducts }: DashboardChartsProps) {
  const [topProductsOrientation, setTopProductsOrientation] = useState<"horizontal" | "vertical">("horizontal");

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Top Selling Products</CardTitle>
          <ToggleGroup
            type="single"
            size="sm"
            value={topProductsOrientation}
            onValueChange={(v) => v && setTopProductsOrientation(v as "horizontal" | "vertical")}
            className="gap-0 border border-border rounded-md p-0.5"
          >
            <ToggleGroupItem
              value="horizontal"
              aria-label="Horizontal bars"
              className="h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <BarChartHorizontal className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="vertical"
              aria-label="Column chart"
              className="h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              {topProductsOrientation === "horizontal" ? (
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `KES ${v.toLocaleString()}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="product_name" width={100} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_revenue" name="Revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="product_name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_revenue" name="Revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No product sales yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
