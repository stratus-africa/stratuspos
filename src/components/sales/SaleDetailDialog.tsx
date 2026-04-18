import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Sale, SaleItem, Payment, useSales } from "@/hooks/useSales";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export default function SaleDetailDialog({ open, onOpenChange, sale }: Props) {
  const { getSaleDetails } = useSales();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sale && open) {
      setLoading(true);
      getSaleDetails(sale.id)
        .then(({ items, payments }) => { setItems(items); setPayments(payments); })
        .finally(() => setLoading(false));
    }
  }, [sale, open]);

  if (!sale) return null;

  const statusColor = sale.payment_status === "paid" ? "default" : sale.payment_status === "partial" ? "secondary" : "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Invoice {sale.invoice_number || "—"}
            <Badge variant={statusColor}>{sale.payment_status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Date:</span> {format(new Date(sale.created_at), "PPp")}</div>
          <div><span className="text-muted-foreground">Location:</span> {sale.locations?.name}</div>
          <div><span className="text-muted-foreground">Customer:</span> {sale.customers?.name || "Walk-in"}</div>
          <div><span className="text-muted-foreground">Status:</span> {sale.status}</div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Items</h4>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Disc.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.products?.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{Number(item.unit_price).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(item.discount).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(item.total).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end">
          <div className="text-sm space-y-1 w-48">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{Number(sale.subtotal).toLocaleString()}</span></div>
            {Number(sale.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{Number(sale.tax).toLocaleString()}</span></div>}
            {Number(sale.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{Number(sale.discount).toLocaleString()}</span></div>}
            <Separator />
            <div className="flex justify-between font-semibold"><span>Total</span><span>KES {Number(sale.total).toLocaleString()}</span></div>
          </div>
        </div>

        {payments.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Payments</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="capitalize">{p.method}</TableCell>
                      <TableCell className="text-right">{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell>{p.reference || "—"}</TableCell>
                      <TableCell>{format(new Date(p.created_at), "PP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
