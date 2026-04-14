import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useSuppliers, type PurchaseItem, type Purchase } from "@/hooks/usePurchases";
import { useProducts } from "@/hooks/useProducts";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    purchase: {
      supplier_id: string | null;
      location_id: string;
      invoice_number?: string;
      subtotal: number;
      tax: number;
      total: number;
      payment_status: string;
      status: string;
      notes?: string;
      created_by: string;
    };
    items: PurchaseItem[];
  }) => void;
  isLoading?: boolean;
  editingPurchase?: Purchase | null;
  editingItems?: PurchaseItem[];
}

export function PurchaseFormDialog({ open, onOpenChange, onSubmit, isLoading, editingPurchase, editingItems }: Props) {
  const { query: suppliersQuery } = useSuppliers();
  const { productsQuery } = useProducts();
  const { locations, currentLocation, business } = useBusiness();
  const { user } = useAuth();

  const [supplierId, setSupplierId] = useState<string>("none");
  const [locationId, setLocationId] = useState(currentLocation?.id || "");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [status, setStatus] = useState("received");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [addProductId, setAddProductId] = useState("");

  useEffect(() => {
    if (editingPurchase) {
      setSupplierId(editingPurchase.supplier_id || "none");
      setLocationId(editingPurchase.location_id);
      setInvoiceNumber(editingPurchase.invoice_number || "");
      setPaymentStatus(editingPurchase.payment_status);
      setStatus(editingPurchase.status);
      setNotes(editingPurchase.notes || "");
      setItems(editingItems || []);
    } else {
      setSupplierId("none");
      setLocationId(currentLocation?.id || "");
      setInvoiceNumber("");
      setPaymentStatus("unpaid");
      setStatus("received");
      setNotes("");
      setItems([]);
    }
  }, [editingPurchase, editingItems, currentLocation?.id]);

  const taxRate = business?.tax_rate ?? 16;

  const addItem = () => {
    if (!addProductId) return;
    const product = productsQuery.data?.find((p) => p.id === addProductId);
    if (!product) return;
    if (items.find((i) => i.product_id === addProductId)) return;
    setItems([...items, {
      product_id: addProductId,
      quantity: 1,
      unit_cost: product.purchase_price,
      total: product.purchase_price,
      products: { name: product.name },
    }]);
    setAddProductId("");
  };

  const updateItem = (idx: number, field: "quantity" | "unit_cost", value: number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value, total: field === "quantity" ? value * updated[idx].unit_cost : updated[idx].quantity * value };
    setItems(updated);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    onSubmit({
      purchase: {
        supplier_id: supplierId === "none" ? null : supplierId,
        location_id: locationId,
        invoice_number: invoiceNumber || undefined,
        subtotal, tax, total,
        payment_status: paymentStatus,
        status,
        notes: notes || undefined,
        created_by: user.id,
      },
      items,
    });
  };

  const formatKES = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPurchase ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No supplier</SelectItem>
                  {suppliersQuery.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={locationId} onValueChange={setLocationId} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="received">Received (auto-updates stock)</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={addProductId} onValueChange={setAddProductId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select product to add..." /></SelectTrigger>
              <SelectContent>
                {productsQuery.data?.filter((p) => p.is_active && !items.find((i) => i.product_id === p.id)).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {formatKES(p.purchase_price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="icon" onClick={addItem} disabled={!addProductId}><Plus className="h-4 w-4" /></Button>
          </div>

          {items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Unit Cost</TableHead>
                  <TableHead className="text-right w-[100px]">Total</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.products?.name}</TableCell>
                    <TableCell>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 1)} className="h-8" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={0} step={0.01} value={item.unit_cost} onChange={(e) => updateItem(idx, "unit_cost", parseFloat(e.target.value) || 0)} className="h-8" />
                    </TableCell>
                    <TableCell className="text-right">{formatKES(item.total)}</TableCell>
                    <TableCell>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end">
            <div className="space-y-1 text-right text-sm">
              <div>Subtotal: <span className="font-medium">{formatKES(subtotal)}</span></div>
              <div>Tax ({taxRate}%): <span className="font-medium">{formatKES(tax)}</span></div>
              <div className="text-base font-bold">Total: {formatKES(total)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || items.length === 0}>
              {isLoading ? "Saving..." : editingPurchase ? "Update Purchase" : "Create Purchase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}