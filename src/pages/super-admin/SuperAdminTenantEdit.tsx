import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Loader2, Save, ArrowLeft, Sliders, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type TenantStatus = "active" | "suspended" | "canceled";

type Biz = {
  id: string;
  name: string;
  is_active: boolean;
  owner_id: string | null;
  created_at: string;
};

type TenantUser = {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
};

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  canceled: "Cancelled",
};

export default function SuperAdminTenantEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [subStatus, setSubStatus] = useState<TenantStatus | null>(null);
  const [newStatus, setNewStatus] = useState<TenantStatus>("active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [bizRes, rolesRes] = await Promise.all([
        supabase.from("businesses").select("id,name,is_active,owner_id,created_at").eq("id", id).maybeSingle(),
        supabase.from("user_roles").select("user_id,role").eq("business_id", id),
      ]);

      const b = bizRes.data as Biz | null;
      setBiz(b);

      const roleRows = (rolesRes.data || []) as { user_id: string; role: string }[];
      const userIds = Array.from(new Set(roleRows.map((r) => r.user_id)));
      let profiles: Record<string, { email: string | null; full_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,email,full_name")
          .in("id", userIds);
        (profs || []).forEach((p: any) => {
          profiles[p.id] = { email: p.email, full_name: p.full_name };
        });
      }
      setUsers(
        roleRows.map((r) => ({
          user_id: r.user_id,
          role: r.role,
          email: profiles[r.user_id]?.email ?? null,
          full_name: profiles[r.user_id]?.full_name ?? null,
        })),
      );

      // Determine effective status
      let effective: TenantStatus = b?.is_active === false ? "suspended" : "active";
      const ownerId = b?.owner_id;
      if (ownerId) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(1);
        const s = subs?.[0]?.status;
        if (s === "canceled") effective = "canceled";
      }
      setSubStatus(effective);
      setNewStatus(effective);
      setLoading(false);
    })();
  }, [id]);

  const onSave = async () => {
    if (!biz) return;
    setSaving(true);
    try {
      if (newStatus === "suspended") {
        await supabase.from("businesses").update({ is_active: false }).eq("id", biz.id);
      } else if (newStatus === "active") {
        await supabase.from("businesses").update({ is_active: true }).eq("id", biz.id);
        // Reactivate canceled sub if any
        if (biz.owner_id) {
          await supabase
            .from("subscriptions")
            .update({ status: "active", cancel_at_period_end: false })
            .eq("user_id", biz.owner_id)
            .eq("status", "canceled");
        }
      } else if (newStatus === "canceled") {
        if (biz.owner_id) {
          const { data: subs } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", biz.owner_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (subs?.[0]) {
            await supabase
              .from("subscriptions")
              .update({ status: "canceled", cancel_at_period_end: true })
              .eq("id", subs[0].id);
          }
        }
      }
      toast.success("Tenant updated");
      navigate(`/super-admin/businesses/${biz.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !biz) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/super-admin/businesses" className="hover:text-foreground">Tenants</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/super-admin/businesses/${biz.id}`} className="hover:text-foreground">{biz.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit tenant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update status and manage users for <span className="font-semibold text-foreground">{biz.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tenant status */}
        <section className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sliders className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Tenant status</h3>
          </div>

          <div className="pt-4 space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground">Current status</Label>
              <div className="mt-1.5">
                <Badge
                  className={
                    subStatus === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : subStatus === "suspended"
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "bg-muted text-muted-foreground border border-border"
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                  {subStatus ? STATUS_LABEL[subStatus] : "Unknown"}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm">Change status to <span className="text-red-500">*</span></Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TenantStatus)}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active{subStatus === "active" ? " (current)" : ""}</SelectItem>
                  <SelectItem value="suspended">Suspended{subStatus === "suspended" ? " (current)" : ""}</SelectItem>
                  <SelectItem value="canceled">Cancelled{subStatus === "canceled" ? " (current)" : ""}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note about this status change…"
                className="mt-1.5 min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Notifications will be sent in this language when a translation exists.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={onSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => navigate(`/super-admin/businesses/${biz.id}`)}>
                Cancel
              </Button>
            </div>
          </div>
        </section>

        {/* Users */}
        <section className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Users</h3>
            </div>
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              {users.length} user{users.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="pt-4 space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No users for this tenant yet.</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.user_id}
                  className="rounded-lg border border-border p-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.full_name || u.email || u.user_id}</p>
                    {u.full_name && u.email && (
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    )}
                  </div>
                  <Badge
                    className={
                      u.role === "admin"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : u.role === "manager"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-muted text-muted-foreground border border-border"
                    }
                  >
                    {u.role}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div>
        <Link
          to={`/super-admin/businesses/${biz.id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tenant
        </Link>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-4">
        © {new Date().getFullYear()} StratusPOS Inc. — All rights reserved. · Tenant created {format(new Date(biz.created_at), "MMM d, yyyy")}
      </div>
    </div>
  );
}
