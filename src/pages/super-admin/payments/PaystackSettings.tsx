import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Loader2, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Mode = "test" | "live";

interface PaystackCfg {
  enabled: boolean;
  mode: Mode;
  public_key_test?: string;
  public_key_live?: string;
  callback_url?: string;
}

const DEFAULT_CFG: PaystackCfg = { enabled: false, mode: "test" };

export default function PaystackSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<PaystackCfg>(DEFAULT_CFG);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings").select("value").eq("key", "global").maybeSingle();
      const stored = data?.value?.payments?.paystack as PaystackCfg | undefined;
      setCfg({ ...DEFAULT_CFG, ...(stored || {}) });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof PaystackCfg>(k: K, v: PaystackCfg[K]) =>
    setCfg((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: cur } = await (supabase as any)
        .from("app_settings").select("value").eq("key", "global").maybeSingle();
      const value = cur?.value || {};
      const payments = value.payments || {};
      payments.paystack = cfg;
      const { error } = await (supabase as any)
        .from("app_settings")
        .upsert({ key: "global", value: { ...value, payments }, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Paystack settings saved");
    } catch (e: any) {
      toast.error("Failed to save: " + (e?.message || "unknown"));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      <Link to="/super-admin/settings" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to settings
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paystack Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Accept card and mobile money payments via Paystack.</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Paystack</Label>
              <p className="text-xs text-muted-foreground">When off, Paystack will not appear as a payment option.</p>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>

          <div className="space-y-1.5">
            <Label>Environment</Label>
            <Select value={cfg.mode} onValueChange={(v) => set("mode", v as Mode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test (sandbox)</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Public Keys</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Test public key</Label>
            <Input value={cfg.public_key_test ?? ""} onChange={(e) => set("public_key_test", e.target.value)} placeholder="pk_test_..." />
          </div>
          <div className="space-y-1.5">
            <Label>Live public key</Label>
            <Input value={cfg.public_key_live ?? ""} onChange={(e) => set("public_key_live", e.target.value)} placeholder="pk_live_..." />
          </div>
          <div className="space-y-1.5">
            <Label>Callback URL</Label>
            <Input value={cfg.callback_url ?? ""} onChange={(e) => set("callback_url", e.target.value)} placeholder="https://yourdomain.com/payments/callback" />
            <p className="text-xs text-muted-foreground">Paste this same URL in your Paystack dashboard webhook settings.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Secret keys</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Secret keys (<code className="text-xs">PAYSTACK_SECRET_KEY</code>, <code className="text-xs">PAYSTACK_WEBHOOK_SECRET</code>) are stored securely
            and never exposed to the browser. To rotate them, use the Lovable Cloud secrets panel.
          </p>
          <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3">
            Open Paystack dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
