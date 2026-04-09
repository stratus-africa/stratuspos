import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProducts } from "@/hooks/useProducts";
import { useBusiness } from "@/contexts/BusinessContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { product_id: string; location_id: string; quantity_change: number; reason: string; notes?: string }) => void;
  isLoading?: boolean;
}

const REASONS = ["Purchase received", "Damage", "Loss", "Correction", "Return", "Other"];

export function StockAdjustmentDialog({ open, onOpenChange, onSubmit, isLoading }: Props) {
  const { productsQuery } = useProducts();
  const { locations, currentLocation } = useBusiness();
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState(currentLocation?.id || "");
  const [quantityChange, setQuantityChange] = useState(0);
  const [reason, setReason] = useState("Purchase received");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      product_id: productId,
      location_id: locationId,
      quantity_change: quantityChange,
      reason,
      notes: notes || undefined,
    });
    setProductId("");
    setQuantityChange(0);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {productsQuery.data?.filter(p => p.is_active).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <Select value={locationId} onValueChange={setLocationId} required>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity Change * (negative for reduction)</Label>
            <Input type="number" step={1} value={quantityChange} onChange={(e) => setQuantityChange(parseFloat(e.target.value) || 0)} required />
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !productId || !locationId}>Adjust</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
