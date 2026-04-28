import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sunrise, Loader2, Landmark, Wallet, MapPin } from "lucide-react";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import { useBusiness } from "@/contexts/BusinessContext";

interface StartDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (openingFloat: number, locationId: string) => Promise<void>;
}

export default function StartDayDialog({ open, onOpenChange, onConfirm }: StartDayDialogProps) {
  const { locations, currentLocation } = useBusiness();
  const [openingFloat, setOpeningFloat] = useState("0");
  const [locationId, setLocationId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [tillError, setTillError] = useState<string | null>(null);
  const { data: bankAccounts = [] } = useBankAccounts();

  useEffect(() => {
    if (open) {
      setLocationId(currentLocation?.id || locations[0]?.id || "");
      setTillError(null);
    }
  }, [open, currentLocation, locations]);

  const handleConfirm = async () => {
    if (!locationId) {
      setTillError("You must select a till before opening the register.");
      return;
    }
    setTillError(null);
    setLoading(true);
    await onConfirm(parseFloat(openingFloat) || 0, locationId);
    setLoading(false);
    setOpeningFloat("0");
  };

  const multipleTills = locations.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" />
            Start of Day
          </DialogTitle>
          <DialogDescription>
            {multipleTills
              ? "Choose your till, review balances, then enter the starting cash float."
              : "Open the register for today. Review balances and enter the starting cash float."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Till assignment */}
          <div className="space-y-2">
            <Label htmlFor="till" className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Assigned Till
            </Label>
            {locations.length === 0 ? (
              <p className="text-sm text-destructive">No tills configured. Ask an admin to add a location.</p>
            ) : (
              <Select
                value={locationId}
                onValueChange={(v) => {
                  setLocationId(v);
                  if (v) setTillError(null);
                }}
              >
                <SelectTrigger
                  id="till"
                  className={`h-10 ${tillError ? "border-destructive ring-1 ring-destructive/30" : ""}`}
                >
                  <SelectValue placeholder="Select your till" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {tillError && (
              <p className="text-xs text-destructive font-medium">{tillError}</p>
            )}
            {multipleTills && !tillError && (
              <p className="text-xs text-muted-foreground">
                All tills settle into the same configured cash account at end of day.
              </p>
            )}
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
            <Label htmlFor="opening-float" className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Opening Cash Float (KES)
            </Label>
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
              Count the physical cash in the register before starting sales.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || !locationId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Open Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
