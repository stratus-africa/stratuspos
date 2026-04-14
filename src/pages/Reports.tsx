import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, FileSpreadsheet, Package, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";

const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const today = new Date().toISOString().split("T")[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

const Reports = () => {
  const { business, currentLocation } = useBusiness();
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  // Sales report
  const salesReport = useQuery({
    queryKey: ["report-sales", business?.id, from, to],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("sales")
        .select("*, customers(name), locations(name), sale_items(quantity, unit_price, discount, total, products(name, purchase_price))")
        .eq("business_id", business.id)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  // Inventory report
  const inventoryReport = useQuery({
    queryKey: ["report-inventory", business?.id, currentLocation?.id],
    queryFn: async () => {
      if (!business || !currentLocation) return [];
      const { data, error } = await supabase
        .from("inventory")
        .select("*, products(name, sku, purchase_price, selling_price, categories(name), brands(name))")
        .eq("location_id", currentLocation.id);
      if (error) throw error;
      return data;
    },
    enabled: !!business && !!currentLocation,
  });

  // Expenses for P&L
  const expensesReport = useQuery({
    queryKey: ["report-expenses", business?.id, from, to],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .eq("business_id", business.id)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  // Computed P&L
  const sales = salesReport.data || [];
  const expenses = expensesReport.data || [];
  const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);
  const totalTax = sales.reduce((s, r) => s + Number(r.tax), 0);
  const totalDiscount = sales.reduce((s, r) => s + Number(r.discount), 0);
  const totalCOGS = sales.reduce((s, sale) => {
    const items = (sale as any).sale_items || [];
    return s + items.reduce((is: number, i: any) => is + Number(i.quantity) * Number(i.products?.purchase_price || 0), 0);
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e: any) => {
    const cat = e.expense_categories?.name || "Uncategorized";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount);
  });

  // Top products by revenue
  const productRevenue: Record<string, { name: string; qty: number; revenue: number; cost: number }> = {};
  sales.forEach((sale: any) => {
    ((sale as any).sale_items || []).forEach((item: any) => {
      const name = item.products?.name || "Unknown";
      if (!productRevenue[name]) productRevenue[name] = { name, qty: 0, revenue: 0, cost: 0 };
      productRevenue[name].qty += Number(item.quantity);
      productRevenue[name].revenue += Number(item.total);
      productRevenue[name].cost += Number(item.quantity) * Number(item.products?.purchase_price || 0);
    });
  });
  const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const inventory = inventoryReport.data || [];

  // Download handlers
  const downloadSalesCSV = () => {
    const headers = ["Date", "Invoice", "Customer", "Location", "Subtotal", "Tax", "Discount", "Total", "Payment Status"];
    const rows = sales.map((s: any) => [
      new Date(s.created_at).toLocaleDateString(), s.invoice_number || "", s.customers?.name || "Walk-in",
      s.locations?.name || "", s.subtotal, s.tax, s.discount, s.total, s.payment_status,
    ].map(String));
    downloadCSV(`sales_report_${from}_to_${to}.csv`, headers, rows);
    toast.success("Sales report downloaded");
  };

  const downloadInventoryCSV = () => {
    const headers = ["Product", "SKU", "Category", "Brand", "Qty", "Low Stock Threshold", "Purchase Price", "Selling Price", "Stock Value"];
    const rows = inventory.map((i: any) => [
      i.products?.name || "", i.products?.sku || "", i.products?.categories?.name || "", i.products?.brands?.name || "",
      i.quantity, i.low_stock_threshold, i.products?.purchase_price || 0, i.products?.selling_price || 0,
      Number(i.quantity) * Number(i.products?.purchase_price || 0),
    ].map(String));
    downloadCSV(`inventory_report.csv`, headers, rows);
    toast.success("Inventory report downloaded");
  };

  const downloadPLCSV = () => {
    const headers = ["Line Item", "Amount"];
    const rows: string[][] = [
      ["Revenue", totalRevenue.toFixed(2)],
      ["Less: Cost of Goods Sold", totalCOGS.toFixed(2)],
      ["Gross Profit", grossProfit.toFixed(2)],
      ...Object.entries(expenseByCategory).map(([cat, amt]) => [`Expense: ${cat}`, amt.toFixed(2)]),
      ["Total Expenses", totalExpenses.toFixed(2)],
      ["Net Profit", netProfit.toFixed(2)],
    ];
    downloadCSV(`pl_report_${from}_to_${to}.csv`, headers, rows);
    toast.success("P&L report downloaded");
  };

  const loading = salesReport.isLoading || inventoryReport.isLoading || expensesReport.isLoading;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Date filter */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-4">
          <div>
            <Label>From</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
          </div>
          <Badge variant="outline" className="h-8">{sales.length} sales in period</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales" className="gap-1"><BarChart3 className="h-4 w-4" /> Sales</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1"><Package className="h-4 w-4" /> Inventory</TabsTrigger>
          <TabsTrigger value="pnl" className="gap-1"><TrendingUp className="h-4 w-4" /> P&L</TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Sales Report</CardTitle>
              <Button size="sm" variant="outline" onClick={downloadSalesCSV} disabled={loading}>
                <Download className="h-4 w-4 mr-1" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-lg font-bold">{sales.length}</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">{formatKES(totalRevenue)}</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Tax Collected</p><p className="text-lg font-bold">{formatKES(totalTax)}</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Discounts</p><p className="text-lg font-bold">{formatKES(totalDiscount)}</p></CardContent></Card>
              </div>

              {/* Top products */}
              {topProducts.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Top Selling Products</h3>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Product</TableHead><TableHead className="text-right">Qty Sold</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Profit</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {topProducts.map(p => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.qty}</TableCell>
                          <TableCell className="text-right">{formatKES(p.revenue)}</TableCell>
                          <TableCell className="text-right">{formatKES(p.revenue - p.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Sales list */}
              <h3 className="font-semibold mb-2">All Sales</h3>
              <div className="max-h-96 overflow-auto rounded border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {sales.slice(0, 100).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{s.invoice_number || "-"}</TableCell>
                        <TableCell>{s.customers?.name || "Walk-in"}</TableCell>
                        <TableCell className="text-right">{formatKES(s.total)}</TableCell>
                        <TableCell><Badge variant={s.payment_status === "paid" ? "default" : "secondary"}>{s.payment_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sales in this period</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Inventory Report</CardTitle>
              <Button size="sm" variant="outline" onClick={downloadInventoryCSV} disabled={loading}>
                <Download className="h-4 w-4 mr-1" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total SKUs</p><p className="text-lg font-bold">{inventory.length}</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Units</p><p className="text-lg font-bold">{inventory.reduce((s, i) => s + Number(i.quantity), 0)}</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Stock Value</p><p className="text-lg font-bold">{formatKES(inventory.reduce((s, i: any) => s + Number(i.quantity) * Number(i.products?.purchase_price || 0), 0))}</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Low Stock Items</p><p className="text-lg font-bold text-destructive">{inventory.filter(i => Number(i.quantity) <= Number(i.low_stock_threshold)).length}</p></CardContent></Card>
              </div>

              <div className="max-h-96 overflow-auto rounded border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {inventory.map((i: any) => {
                      const low = Number(i.quantity) <= Number(i.low_stock_threshold);
                      return (
                        <TableRow key={i.id} className={low ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium">{i.products?.name}</TableCell>
                          <TableCell>{i.products?.sku || "-"}</TableCell>
                          <TableCell>{i.products?.categories?.name || "-"}</TableCell>
                          <TableCell className="text-right">{i.quantity}</TableCell>
                          <TableCell className="text-right">{formatKES(Number(i.quantity) * Number(i.products?.purchase_price || 0))}</TableCell>
                          <TableCell>{low ? <Badge variant="destructive">Low Stock</Badge> : <Badge variant="outline">OK</Badge>}</TableCell>
                        </TableRow>
                      );
                    })}
                    {inventory.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No inventory data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L TAB */}
        <TabsContent value="pnl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Profit & Loss Statement</CardTitle>
              <Button size="sm" variant="outline" onClick={downloadPLCSV} disabled={loading}>
                <Download className="h-4 w-4 mr-1" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl mx-auto">
                <Table>
                  <TableBody>
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>Revenue</TableCell><TableCell className="text-right">{formatKES(totalRevenue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-muted-foreground">Less: Cost of Goods Sold</TableCell><TableCell className="text-right text-muted-foreground">({formatKES(totalCOGS)})</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Gross Profit</TableCell><TableCell className="text-right">{formatKES(grossProfit)}</TableCell>
                    </TableRow>

                    <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-sm">Operating Expenses</TableCell></TableRow>
                    {Object.entries(expenseByCategory).map(([cat, amt]) => (
                      <TableRow key={cat}>
                        <TableCell className="pl-8 text-muted-foreground">{cat}</TableCell>
                        <TableCell className="text-right text-muted-foreground">({formatKES(amt)})</TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(expenseByCategory).length === 0 && (
                      <TableRow><TableCell className="pl-8 text-muted-foreground" colSpan={2}>No expenses recorded</TableCell></TableRow>
                    )}
                    <TableRow className="font-semibold border-t">
                      <TableCell>Total Expenses</TableCell><TableCell className="text-right">({formatKES(totalExpenses)})</TableCell>
                    </TableRow>

                    <TableRow className={`font-bold text-lg border-t-2 ${netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                      <TableCell>Net Profit</TableCell><TableCell className="text-right">{formatKES(netProfit)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Gross margin */}
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <span>Gross Margin: <strong>{totalRevenue ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong></span>
                  <span>Net Margin: <strong>{totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
