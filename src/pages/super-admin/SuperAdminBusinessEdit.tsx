import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, ChevronRight, Globe, Link2, Loader2, Plus, Settings2, Star, StarOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Status = "active" | "suspended" | "cancelled";

interface Business {
  id: string;
  name: string;
  status: Status;
  is_active: boolean;
  currency: string;
  tax_rate: number | null;
  timezone: string;
}

interface TenantDomain {
  id: string;
  domain: string;
  is_primary: boolean;
  verified: boolean;
}

const STATUS_META: Record<Status, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  suspended: { label: "Suspended", className: "bg-amber-500/10 text-amber-700 border-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function SuperAdminBusinessEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("active");
  const [currency, setCurrency] = useState("KES");
  const [taxRate, setTaxRate] = useState("16");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [saving, setSaving] = useState(false);

  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [bizRes, domRes] = await Promise.all([
        supabase.from("businesses").select("*").eq("id", id).maybeSingle(),
        (supabase as any).from("tenant_domains").select("*").eq("business_id", id).order("created_at"),
      ]);

      if (bizRes.error || !bizRes.data) {
        toast.error("Tenant not found");
        navigate("/super-admin/businesses");
        return;
      }
      const b = bizRes.data as any;
      const initStatus: Status = (b.status as Status) || (b.is_active ? "active" : "suspended");
      setBiz({ ...b, status: initStatus });
      setName(b.name);
      setStatus(initStatus);
      setCurrency(b.currency);
      setTaxRate(String(b.tax_rate ?? 16));
      setTimezone(b.timezone);
      setDomains((domRes.data as TenantDomain[]) || []);
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!biz) return;
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        currency,
        tax_rate: parseFloat(taxRate) || 0,
        timezone,
        status,
        is_active: status === "active",
      } as any)
      .eq("id", biz.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    toast.success("Tenant updated");
    setBiz({ ...biz, name: name.trim(), currency, tax_rate: parseFloat(taxRate), timezone, status, is_active: status === "active" });
  };

  const validDomain = (d: string) =>
    /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(d.trim());

  const handleAddDomain = async () => {
    const value = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!validDomain(value)) { toast.error("Enter a valid domain (e.g. app.customer.com)"); return; }
    if (!biz) return;
    setAddingDomain(true);
    const { data, error } = await (supabase as any)
      .from("tenant_domains")
      .insert({ business_id: biz.id, domain: value, is_primary: domains.length === 0 })
      .select()
      .single();
    setAddingDomain(false);
    if (error) { toast.error(error.message.includes("duplicate") ? "Domain already in use" : error.message); return; }
    setDomains((prev) => [...prev, data as TenantDomain]);
    setNewDomain("");
    toast.success("Domain added");
  };

  const handleSetPrimary = async (domId: string) => {
    if (!biz) return;
    // clear all then set selected
    await (supabase as any).from("tenant_domains").update({ is_primary: false }).eq("business_id", biz.id);
    const { error } = await (supabase as any).from("tenant_domains").update({ is_primary: true }).eq("id", domId);
    if (error) { toast.error(error.message); return; }
    setDomains((prev) => prev.map((d) => ({ ...d, is_primary: d.id === domId })));
    toast.success("Primary domain updated");
  };

  const handleDeleteDomain = async (domId: string) => {
    const { error } = await (supabase as any).from("tenant_domains").delete().eq("id", domId);
    if (error) { toast.error(error.message); return; }
    setDomains((prev) => prev.filter((d) => d.id !== domId));
    toast.success("Domain removed");
  };

  if (loading || !biz) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const meta = STATUS_META[biz.status];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/super-admin/businesses" className="hover:text-foreground">Tenants</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/super-admin/businesses/${biz.id}`} className="hover:text-foreground">{biz.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Edit</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold">Edit tenant</h1>
        <p className="text-muted-foreground">
          Update status and manage domains for <span className="font-semibold text-foreground">{biz.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant status / details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" /> Tenant status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Current status</Label>
              <div className="mt-1.5">
                <Badge variant="outline" className={meta.className}>● {meta.label}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Change status to <span className="text-destructive">*</span></Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active {biz.status === "active" && "(current)"}</SelectItem>
                  <SelectItem value="suspended">Suspended {biz.status === "suspended" && "(current)"}</SelectItem>
                  <SelectItem value="cancelled">Cancelled {biz.status === "cancelled" && "(current)"}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Suspended tenants are blocked from sign-in. Cancelled tenants are soft-deleted and hidden.
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Business name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>Tax rate (%)</Label>
                <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => navigate(`/super-admin/businesses/${biz.id}`)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" /> Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {domains.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No domains connected yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {domains.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-sm font-medium">{d.domain}</span>
                      {d.is_primary && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          Primary
                        </Badge>
                      )}
                      {d.verified ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={d.is_primary ? "Primary" : "Set as primary"}
                        onClick={() => !d.is_primary && handleSetPrimary(d.id)}
                        disabled={d.is_primary}
                      >
                        {d.is_primary ? <Star className="h-3.5 w-3.5 fill-current text-primary" /> : <StarOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Remove domain"
                        onClick={() => handleDeleteDomain(d.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Separator />

            <div className="space-y-2">
              <Label>Add new domain</Label>
              <Input
                placeholder="app.customer.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddDomain(); }}
              />
              <p className="text-xs text-muted-foreground">
                Enter a valid domain that points to this server.
              </p>
              <Button onClick={handleAddDomain} disabled={addingDomain || !newDomain.trim()} className="w-full">
                {addingDomain ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add domain
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/super-admin/businesses/${biz.id}`)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to tenant
        </Button>
      </div>
    </div>
  );
}
