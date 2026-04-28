import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings2, Palette, Brush, Building2, Globe, CreditCard, Database,
  Server, RefreshCw, Loader2, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey =
  | "general" | "branding" | "appearance" | "company"
  | "landing" | "payments" | "backup" | "system" | "update";

interface AppSettings {
  app_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  default_language?: string;
  // Branding
  logo_url?: string;
  favicon_url?: string;
  // Appearance
  theme_color?: string;
  // Company
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  // Landing
  landing_meta_title?: string;
  landing_meta_description?: string;
  // Payments
  payments_provider?: string;
  // System
  maintenance_mode?: boolean;
}

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "general",    label: "General",      icon: Settings2 },
  { key: "branding",   label: "Branding",     icon: Palette },
  { key: "appearance", label: "Appearance",   icon: Brush },
  { key: "company",    label: "Company",      icon: Building2 },
  { key: "landing",    label: "Landing Page", icon: Globe },
  { key: "payments",   label: "Payments",     icon: CreditCard },
  { key: "backup",     label: "Backup",       icon: Database },
  { key: "system",     label: "System",       icon: Server },
  { key: "update",     label: "Update App",   icon: RefreshCw },
];

const DEFAULTS: AppSettings = {
  app_name: "Stocky SaaS",
  currency_code: "USD",
  currency_symbol: "$",
  default_language: "en",
};

export default function SuperAdminSettings() {
  const [tab, setTab] = useState<TabKey>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings").select("value").eq("key", "global").maybeSingle();
      setS({ ...DEFAULTS, ...((data?.value as AppSettings) || {}) });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("app_settings")
        .upsert({ key: "global", value: s, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error("Failed to save: " + (e?.message || "unknown"));
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application branding, company information, and contact details.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        {/* Tabs */}
        <Card className="p-2 h-fit">
          <nav className="flex flex-col gap-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  tab === key
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Panel */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 pb-5 border-b">
            <div>
              <h2 className="text-lg font-semibold">{TABS.find(t => t.key === tab)?.label}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{describe(tab)}</p>
            </div>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </div>

          <div className="pt-6">
            {tab === "general" && (
              <div className="space-y-5">
                <Field label="App Name" required help="Displayed across the app and browser title.">
                  <Input value={s.app_name ?? ""} onChange={(e) => set("app_name", e.target.value)} />
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Currency Code" required help="ISO 4217 code (e.g. USD, EUR, NGN, GHS, ZAR).">
                    <Input value={s.currency_code ?? ""} onChange={(e) => set("currency_code", e.target.value.toUpperCase())} />
                  </Field>
                  <Field label="Currency Symbol" required help="Displayed before amounts in invoices and UI.">
                    <Input value={s.currency_symbol ?? ""} onChange={(e) => set("currency_symbol", e.target.value)} />
                  </Field>
                </div>
                <Field label="Default Language" help="Used for the landing page and super admin dashboard when a visitor has not chosen a language.">
                  <Select value={s.default_language ?? "en"} onValueChange={(v) => set("default_language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (EN)</SelectItem>
                      <SelectItem value="sw">Swahili (SW)</SelectItem>
                      <SelectItem value="fr">French (FR)</SelectItem>
                      <SelectItem value="es">Spanish (ES)</SelectItem>
                      <SelectItem value="ar">Arabic (AR)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {tab === "branding" && (
              <div className="space-y-5">
                <Field label="Logo URL" help="A square or wide logo shown in the header and emails.">
                  <Input value={s.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
                </Field>
                <Field label="Favicon URL" help="Small icon shown in the browser tab.">
                  <Input value={s.favicon_url ?? ""} onChange={(e) => set("favicon_url", e.target.value)} placeholder="https://..." />
                </Field>
              </div>
            )}

            {tab === "appearance" && (
              <Field label="Primary Theme Color" help="Used for buttons, highlights, and accents.">
                <Input type="text" value={s.theme_color ?? ""} placeholder="#2563eb" onChange={(e) => set("theme_color", e.target.value)} />
              </Field>
            )}

            {tab === "company" && (
              <div className="space-y-5">
                <Field label="Company Name"><Input value={s.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} /></Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Email"><Input type="email" value={s.company_email ?? ""} onChange={(e) => set("company_email", e.target.value)} /></Field>
                  <Field label="Phone"><Input value={s.company_phone ?? ""} onChange={(e) => set("company_phone", e.target.value)} /></Field>
                </div>
                <Field label="Address"><Textarea rows={3} value={s.company_address ?? ""} onChange={(e) => set("company_address", e.target.value)} /></Field>
              </div>
            )}

            {tab === "landing" && (
              <div className="space-y-5">
                <Field label="Meta Title" help="Shown in search results and the browser tab.">
                  <Input value={s.landing_meta_title ?? ""} onChange={(e) => set("landing_meta_title", e.target.value)} />
                </Field>
                <Field label="Meta Description" help="Shown in search engine snippets (max ~160 chars).">
                  <Textarea rows={3} value={s.landing_meta_description ?? ""} onChange={(e) => set("landing_meta_description", e.target.value)} />
                </Field>
              </div>
            )}

            {tab === "payments" && (
              <Field label="Default Payments Provider" help="Used for new tenant subscriptions.">
                <Select value={s.payments_provider ?? "paystack"} onValueChange={(v) => set("payments_provider", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="paddle">Paddle</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {tab === "backup" && (
              <p className="text-sm text-muted-foreground">
                Database backups run automatically every day. Manual export coming soon.
              </p>
            )}

            {tab === "system" && (
              <Field label="Maintenance mode" help="When enabled, customer-facing pages show a maintenance notice.">
                <Select value={s.maintenance_mode ? "on" : "off"} onValueChange={(v) => set("maintenance_mode", v === "on")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {tab === "update" && (
              <p className="text-sm text-muted-foreground">
                Your app updates automatically. No action required.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function describe(tab: TabKey) {
  switch (tab) {
    case "general":    return "Application name, currency and core defaults.";
    case "branding":   return "Upload your logo and favicon.";
    case "appearance": return "Customize the look and feel.";
    case "company":    return "Your company contact information for invoices and emails.";
    case "landing":    return "SEO and metadata for the public landing page.";
    case "payments":   return "Default payment provider configuration.";
    case "backup":     return "Database backup and restore.";
    case "system":     return "Application status and maintenance.";
    case "update":     return "App update settings.";
  }
}

function Field({ label, required, help, children }: {
  label: string; required?: boolean; help?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
