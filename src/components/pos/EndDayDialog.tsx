import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sunset, Loader2, Landmark, Wallet } from "lucide-react";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import type { POSSession } from "@/hooks/usePOSSession";

interface EndDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: POSSession;
  onConfirm: (closingCash: number, notes?: string) => Promise<void>;
}

export default function EndDayDialog({ open, onOpenChange, session, onConfirm }: EndDayDialogProps) {
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: bankAccounts = [] } = useBankAccounts();

  const handleConfirm = async () => {
    const cash = parseFloat(closingCash);
    if (isNaN(cash) || cash < 0) return;
    setLoading(true);
    await onConfirm(cash, notes.trim() || undefined);
    setLoading(false);
    setClosingCash("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunset className="h-5 w-5 text-orange-500" />
            End of Day
          </DialogTitle>
          <DialogDescription>
            Close the register. Review account balances and count the cash.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session summary */}
          <div className="rounded-lg border p-3 bg-muted/50 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Opening Float</span>
              <span className="font-medium">KES {Number(session.opening_float).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session Started</span>
              <span className="font-medium">{new Date(session.opened_at).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Bank & Cash Account Balances */}
          {bankAccounts.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                Account Balances
              </Label>
              <div className="rounded-lg border bg-muted/50 divide-y">
                {bankAccounts.map((acc: BankAccount) => (
                  <div key={acc.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {acc.account_type === "cash" ? (
                        <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Landmark className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      <span>{acc.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">({acc.account_type})</span>
                    </div>
                    <span className="font-medium">KES {Number(acc.balance).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="closing-cash" className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Actual Cash in Register (KES)
            </Label>
            <Input
              id="closing-cash"
              type="number"
              min={0}
              step={100}
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              placeholder="Count the cash..."
              className="text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing-notes">Notes (optional)</Label>
            <Textarea
              id="closing-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about today's session..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !closingCash || parseFloat(closingCash) < 0}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Close Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
