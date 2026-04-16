import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { formatKES, downloadCSV } from "./reportUtils";

interface SalesReportTabProps {
  sales: any[];
  topProducts: { name: string; qty: number; revenue: number; cost: number }[];
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  from: string;
  to: string;
  loading: boolean;
}

const SalesReportTab = ({ sales, topProducts, totalRevenue, totalTax, totalDiscount, from, to, loading }: SalesReportTabProps) => {
  const downloadSalesCSV = () => {
    const headers = ["Date", "Invoice", "Customer", "Location", "Subtotal", "Tax", "Discount", "Total", "Payment Status"];
    const rows = sales.map((s: any) => [
      new Date(s.created_at).toLocaleDateString(), s.invoice_number || "", s.customers?.name || "Walk-in",
      s.locations?.name || "", s.subtotal, s.tax, s.discount, s.total, s.payment_status,
    ].map(String));
    downloadCSV(`sales_report_${from}_to_${to}.csv`, headers, rows);
    toast.success("Sales report downloaded");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Sales Report</CardTitle>
        <Button size="sm" variant="outline" onClick={downloadSalesCSV} disabled={loading}>
          <Download className="h-4 w-4 mr-1" /> Download CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-lg font-bold">{sales.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">{formatKES(totalRevenue)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Tax Collected</p><p className="text-lg font-bold">{formatKES(totalTax)}</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Discounts</p><p className="text-lg font-bold">{formatKES(totalDiscount)}</p></CardContent></Card>
        </div>

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
  );
};

export default SalesReportTab;
