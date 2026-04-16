import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBusiness } from "@/contexts/BusinessContext";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Banknote, Smartphone, CreditCard, Save, Loader2 } from "lucide-react";

const METHODS = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "mpesa", label: "M-Pesa", icon: Smartphone },
  { key: "card", label: "Card", icon: CreditCard },
];

export function PaymentAccountsTab() {
  const { business } = useBusiness();
  const { data: bankAccounts = [] } = useBankAccounts();
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!business) return;
    const load = async () => {
      const { data } = await supabase
        .from("payment_method_accounts" as any)
        .select("*")
        .eq("business_id", business.id);

      if (data) {
        const map: Record<string, string> = {};
        (data as any[]).forEach((d) => {
          map[d.payment_method] = d.bank_account_id || "none";
        });
        setMappings(map);
      }
      setLoaded(true);
    };
    load();
  }, [business]);

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    try {
      for (const method of METHODS) {
        const accountId = mappings[method.key];
        if (!accountId || accountId === "none") {
          await (supabase.from("payment_method_accounts" as any) as any)
            .delete()
            .eq("business_id", business.id)
            .eq("payment_method", method.key);
        } else {
          const { error } = await (supabase.from("payment_method_accounts" as any) as any)
            .upsert({
              business_id: business.id,
              payment_method: method.key,
              bank_account_id: accountId,
            }, { onConflict: "business_id,payment_method" });
          if (error) throw error;
        }
      }
      toast.success("Payment account mappings saved");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method Accounts</CardTitle>
        <CardDescription>
          Define which bank account receives money for each payment method.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {METHODS.map((m) => (
          <div key={m.key} className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-32">
              <m.icon className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">{m.label}</Label>
            </div>
            <Select
              value={mappings[m.key] || "none"}
              onValueChange={(v) => setMappings((prev) => ({ ...prev, [m.key]: v }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Not assigned —</SelectItem>
                {bankAccounts.map((ba) => (
                  <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Mappings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
