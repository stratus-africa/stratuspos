import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Clock } from "lucide-react";
import { useExpiringBatches } from "@/hooks/useProductBatches";
import { useBusiness } from "@/contexts/BusinessContext";
import { differenceInDays, format } from "date-fns";

interface DashboardBottomRowProps {
  data: {
    todaySales: number;
    todayExpenses: number;
    todayProfit: number;
    lowStockItems: {
      product_id: string;
      product_name: string;
      quantity: number;
      threshold: number;
    }[];
  };
}

export function DashboardBottomRow({ data }: DashboardBottomRowProps) {
  const { todaySales, todayExpenses, todayProfit, lowStockItems } = data;
  const { business } = useBusiness();
  const isPharmacy = (business as any)?.business_type === "pharmacy";
  const { data: expiring = [] } = useExpiringBatches(60);

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
            <span className="font-medium text-destructive">- KES {todayExpenses.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="text-sm font-medium">Net Profit</span>
            <span className={`font-bold ${todayProfit >= 0 ? "text-green-500" : "text-destructive"}`}>
              KES {todayProfit.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

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
  );
}
