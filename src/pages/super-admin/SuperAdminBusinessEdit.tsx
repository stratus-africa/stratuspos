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
import { ArrowLeft, Check, ChevronRight, Loader2, Settings2, Users, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface TenantUser {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
}

const STATUS_META: Record<Status, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  suspended: { label: "Suspended", className: "bg-amber-500/10 text-amber-700 border-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-primary/10 text-primary border-primary/20",
  manager: "bg-blue-500/10 text-blue-700 border-blue-200",
  cashier: "bg-slate-500/10 text-slate-700 border-slate-200",
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

  const [users, setUsers] = useState<TenantUser[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const bizRes = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();

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

      // Fetch users for tenant: roles + profile join
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("business_id", id);

      const userIds = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
      let profilesMap = new Map<string, { full_name: string | null; email: string | null }>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        (profs || []).forEach((p: any) => profilesMap.set(p.id, { full_name: p.full_name, email: p.email }));
      }

      const merged: TenantUser[] = (roles || []).map((r: any) => ({
        user_id: r.user_id,
        role: r.role,
        created_at: r.created_at,
        full_name: profilesMap.get(r.user_id)?.full_name ?? null,
        email: profilesMap.get(r.user_id)?.email ?? null,
      }));
      // Sort: admin first, then by name
      merged.sort((a, b) => {
        if (a.role !== b.role) return a.role === "admin" ? -1 : b.role === "admin" ? 1 : a.role.localeCompare(b.role);
        return (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "");
      });
      setUsers(merged);
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
          Update status and review users for <span className="font-semibold text-foreground">{biz.name}</span>.
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

        {/* Users for this tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Users
              <Badge variant="outline" className="ml-1 text-[10px]">{users.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No users assigned to this tenant yet.
              </div>
            ) : (
              <ul className="divide-y rounded-md border">
                {users.map((u) => (
                  <li key={`${u.user_id}-${u.role}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {u.full_name || u.email || "Unknown user"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{u.email || "—"}</span>
                        {u.created_at && (
                          <>
                            <span className="mx-1">·</span>
                            <span>Joined {format(new Date(u.created_at), "MMM d, yyyy")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`${ROLE_BADGE[u.role] || "bg-muted"} capitalize text-[10px]`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {u.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Manage user roles and access from the tenant detail page.
            </p>
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
