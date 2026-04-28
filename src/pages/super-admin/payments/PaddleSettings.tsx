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

type Mode = "sandbox" | "live";

interface PaddleCfg {
  enabled: boolean;
  mode: Mode;
  vendor_id?: string;
  client_token_sandbox?: string;
  client_token_live?: string;
  default_price_id?: string;
}

const DEFAULT_CFG: PaddleCfg = { enabled: false, mode: "sandbox" };

export default function PaddleSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<PaddleCfg>(DEFAULT_CFG);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings").select("value").eq("key", "global").maybeSingle();
      const stored = data?.value?.payments?.paddle as PaddleCfg | undefined;
      setCfg({ ...DEFAULT_CFG, ...(stored || {}) });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof PaddleCfg>(k: K, v: PaddleCfg[K]) => setCfg((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: cur } = await (supabase as any)
        .from("app_settings").select("value").eq("key", "global").maybeSingle();
      const value = cur?.value || {};
      const payments = value.payments || {};
      payments.paddle = cfg;
      const { error } = await (supabase as any)
        .from("app_settings")
        .upsert({ key: "global", value: { ...value, payments }, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Paddle settings saved");
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
          <h1 className="text-2xl font-bold tracking-tight">Paddle Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Bill subscriptions globally with Paddle as merchant of record.</p>
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
              <Label>Enable Paddle</Label>
              <p className="text-xs text-muted-foreground">Use Paddle for new subscription checkouts.</p>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Environment</Label>
            <Select value={cfg.mode} onValueChange={(v) => set("mode", v as Mode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Vendor ID</Label>
            <Input value={cfg.vendor_id ?? ""} onChange={(e) => set("vendor_id", e.target.value)} placeholder="123456" />
          </div>
          <div className="space-y-1.5">
            <Label>Client-side token (Sandbox)</Label>
            <Input value={cfg.client_token_sandbox ?? ""} onChange={(e) => set("client_token_sandbox", e.target.value)} placeholder="test_..." />
          </div>
          <div className="space-y-1.5">
            <Label>Client-side token (Live)</Label>
            <Input value={cfg.client_token_live ?? ""} onChange={(e) => set("client_token_live", e.target.value)} placeholder="live_..." />
          </div>
          <div className="space-y-1.5">
            <Label>Default price ID</Label>
            <Input value={cfg.default_price_id ?? ""} onChange={(e) => set("default_price_id", e.target.value)} placeholder="pri_..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Secret keys</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            API keys (<code className="text-xs">PADDLE_SANDBOX_API_KEY</code>, <code className="text-xs">PADDLE_LIVE_API_KEY</code>,
            <code className="text-xs"> PAYMENTS_LIVE_WEBHOOK_SECRET</code>) are stored securely and never exposed to the browser.
          </p>
          <a href="https://vendors.paddle.com/" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3">
            Open Paddle dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
