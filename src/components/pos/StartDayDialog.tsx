import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sunrise, Loader2 } from "lucide-react";

interface StartDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (openingFloat: number) => Promise<void>;
}

export default function StartDayDialog({ open, onOpenChange, onConfirm }: StartDayDialogProps) {
  const [openingFloat, setOpeningFloat] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(parseFloat(openingFloat) || 0);
    setLoading(false);
    setOpeningFloat("0");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" />
            Start of Day
          </DialogTitle>
          <DialogDescription>
            Open the register for today. Enter the starting cash float.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="opening-float">Opening Cash Float (KES)</Label>
            <Input
              id="opening-float"
              type="number"
              min={0}
              step={100}
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              placeholder="0"
              className="text-lg"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Count the cash in the register before starting sales.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Open Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
