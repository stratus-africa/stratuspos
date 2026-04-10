import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Banknote, Smartphone, CreditCard, Plus, Trash2 } from "lucide-react";
import { PaymentEntry } from "@/hooks/usePOS";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payments: PaymentEntry[]) => void;
  processing: boolean;
}

const METHODS = [
  { key: "cash" as const, label: "Cash", icon: Banknote },
  { key: "mpesa" as const, label: "M-Pesa", icon: Smartphone },
  { key: "card" as const, label: "Card", icon: CreditCard },
];

export default function PaymentDialog({ open, onOpenChange, total, onConfirm, processing }: Props) {
  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: "cash", amount: total, reference: "" }]);

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const change = Math.max(0, totalPaid - total);
  const remaining = Math.max(0, total - totalPaid);

  const addPayment = () => {
    setPayments((p) => [...p, { method: "cash", amount: remaining, reference: "" }]);
  };

  const updatePayment = (idx: number, updates: Partial<PaymentEntry>) => {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  };

  const removePayment = (idx: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Reset when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) setPayments([{ method: "cash", amount: total, reference: "" }]);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment — KES {total.toLocaleString()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {payments.map((payment, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {METHODS.map((m) => (
                    <Button
                      key={m.key}
                      size="sm"
                      variant={payment.method === m.key ? "default" : "outline"}
                      onClick={() => updatePayment(idx, { method: m.key })}
                    >
                      <m.icon className="h-4 w-4 mr-1" /> {m.label}
                    </Button>
                  ))}
                </div>
                {payments.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removePayment(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    value={payment.amount || ""}
                    onChange={(e) => updatePayment(idx, { amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {payment.method !== "cash" && (
                  <div>
                    <Label>{payment.method === "mpesa" ? "M-Pesa Code" : "Reference"}</Label>
                    <Input
                      value={payment.reference}
                      onChange={(e) => updatePayment(idx, { reference: e.target.value })}
                      placeholder={payment.method === "mpesa" ? "e.g. SBK12345" : "Ref #"}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addPayment} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Split Payment
          </Button>

          <Separator />

          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Due</span><span className="font-semibold">KES {total.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span>KES {totalPaid.toLocaleString()}</span></div>
            {change > 0 && (
              <div className="flex justify-between text-primary font-semibold"><span>Change</span><span>KES {change.toLocaleString()}</span></div>
            )}
            {remaining > 0 && (
              <div className="flex justify-between text-destructive font-semibold"><span>Remaining</span><span>KES {remaining.toLocaleString()}</span></div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm(payments)} disabled={totalPaid <= 0 || processing}>
            {processing ? "Processing..." : "Complete Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
