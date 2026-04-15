import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sunset, Loader2 } from "lucide-react";
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
            Close the register. Count the cash and enter the total below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <div className="space-y-2">
            <Label htmlFor="closing-cash">Actual Cash in Register (KES)</Label>
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
