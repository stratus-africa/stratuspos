import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ChevronRight, Pencil, PauseCircle, XCircle, Trash2, Info, Users as UsersIcon,
  Package, Warehouse, ShoppingCart, Truck, CheckCircle2, Loader2,
} from "lucide-react";

type Biz = {
  id: string;
  name: string;
  business_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  currency: string;
  owner_id: string | null;
};

type Sub = {
  id: string;
  status: string;
  product_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  environment: string;
  cancel_at_period_end: boolean | null;
};

type Plan = {
  id: string;
  name: string;
  monthly_price_kes: number;
  yearly_price_kes: number;
  max_locations: number;
  max_products: number;
  max_users: number;
  paddle_product_id: string | null;
};

type Feature = { package_id: string; feature_key: string; feature_label: string; enabled: boolean };

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  trialing: "bg-blue-50 text-blue-700 border border-blue-200",
  past_due: "bg-amber-50 text-amber-700 border border-amber-200",
  canceled: "bg-muted text-muted-foreground border border-border",
  suspended: "bg-orange-50 text-orange-700 border border-orange-200",
};

type TenantUser = {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
};

export default function SuperAdminTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [counts, setCounts] = useState({ products: 0, users: 0, locations: 0, customers: 0, suppliers: 0 });
  const [assigningPlanId, setAssigningPlanId] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    const [bizRes, plansRes, featRes, prodCnt, locCnt, custCnt, suppCnt, rolesRes] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", id).maybeSingle(),
      supabase.from("subscription_packages").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("package_features").select("*"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", id),
      supabase.from("locations").select("id", { count: "exact", head: true }).eq("business_id", id),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", id),
      supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("business_id", id),
      supabase.from("user_roles").select("user_id,role").eq("business_id", id),
    ]);

    setBiz(bizRes.data as Biz | null);
    setPlans((plansRes.data || []) as Plan[]);
    setFeatures((featRes.data || []) as Feature[]);

    const roleRows = (rolesRes.data || []) as { user_id: string; role: string }[];
    const userIds = Array.from(new Set(roleRows.map((r) => r.user_id)));
    let profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .in("id", userIds);
      (profs || []).forEach((p: any) => {
        profileMap[p.id] = { email: p.email, full_name: p.full_name };
      });
    }
    const tenantUsers: TenantUser[] = roleRows.map((r) => ({
      user_id: r.user_id,
      role: r.role,
      email: profileMap[r.user_id]?.email ?? null,
      full_name: profileMap[r.user_id]?.full_name ?? null,
    }));
    setUsers(tenantUsers);

    setCounts({
      products: prodCnt.count || 0,
      users: userIds.length,
      locations: locCnt.count || 0,
      customers: custCnt.count || 0,
      suppliers: suppCnt.count || 0,
    });

    const ownerId = (bizRes.data as any)?.owner_id || roleRows.find((r) => r.role === "admin")?.user_id;
    if (ownerId) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(1);
      setSub((subs?.[0] as Sub) || null);
    } else {
      setSub(null);
    }
    setLoading(false);
  };

  const assignPlan = async () => {
    if (!biz || !assigningPlanId) return;
    const plan = plans.find((p) => p.id === assigningPlanId);
    if (!plan) return;
    const ownerId = biz.owner_id || users.find((u) => u.role === "admin")?.user_id;
    if (!ownerId) {
      toast.error("This tenant has no owner/admin user to attach a subscription to.");
      return;
    }
    setActing("assign");
    try {
      const productKey = plan.paddle_product_id || plan.id;
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      if (sub) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            cancel_at_period_end: false,
            product_id: productKey,
            plan_code: plan.name,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", sub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: ownerId,
          status: "active",
          environment: "live",
          product_id: productKey,
          plan_code: plan.name,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        });
        if (error) throw error;
      }
      toast.success(`Plan "${plan.name}" assigned. Subscription is now active.`);
      setAssigningPlanId("");
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to assign plan");
    } finally {
      setActing(null);
    }
  };


  const currentPlan: Plan | null = (() => {
    if (!sub) return plans[0] ?? null;
    const byProd = plans.find((p) => p.paddle_product_id === sub.product_id);
    return byProd || plans[0] || null;
  })();

  const planFeatures = features.filter((f) => f.package_id === currentPlan?.id);

  const setActive = async (active: boolean) => {
    if (!biz) return;
    setActing(active ? "reactivate" : "suspend");
    const { error } = await supabase.from("businesses").update({ is_active: active }).eq("id", biz.id);
    if (error) toast.error(error.message);
    else {
      toast.success(active ? "Tenant reactivated" : "Tenant suspended");
      setBiz({ ...biz, is_active: active });
    }
    setActing(null);
  };

  const cancelSub = async () => {
    if (!sub) return;
    setActing("cancel");
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "canceled", cancel_at_period_end: true })
      .eq("id", sub.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Subscription canceled");
      fetchAll();
    }
    setActing(null);
  };

  const deleteTenant = async () => {
    if (!biz) return;
    if (!confirm(`Delete "${biz.name}" and ALL its data? This cannot be undone.`)) return;
    setActing("delete");
    const { error } = await supabase.from("businesses").delete().eq("id", biz.id);
    if (error) {
      toast.error("Failed: " + error.message + " — clean up child records via the tenant list page first.");
      setActing(null);
      return;
    }
    toast.success("Tenant deleted");
    navigate("/super-admin/businesses");
  };

  if (loading || !biz) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initial = biz.name.charAt(0).toUpperCase();
  const planName = currentPlan?.name || "Free";
  const planPrice = currentPlan ? `$${Number(currentPlan.monthly_price_kes || 0).toFixed(2)}/mo` : "—";
  const subStatusKey = sub?.status || (biz.is_active ? "active" : "suspended");
  const subStatusClass = STATUS_BADGE[subStatusKey] || STATUS_BADGE.canceled;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/super-admin/businesses" className="hover:text-foreground">Tenants</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-mono text-xs truncate max-w-md">{biz.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{biz.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm">
              <Badge className={`${biz.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-orange-50 text-orange-700 border border-orange-200"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                {biz.is_active ? "Active" : "Suspended"}
              </Badge>
              <span className="text-muted-foreground">Registered {format(new Date(biz.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
          {biz.is_active ? (
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-9" onClick={() => setActive(false)} disabled={!!acting}>
              <PauseCircle className="h-3.5 w-3.5 mr-1.5" /> Suspend
            </Button>
          ) : (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9" onClick={() => setActive(true)} disabled={!!acting}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Reactivate
            </Button>
          )}
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white h-9" onClick={cancelSub} disabled={!sub || !!acting}>
            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-9" onClick={deleteTenant} disabled={!!acting}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column - 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tenant details */}
          <section className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Tenant details</h3>
            </div>
            <dl className="divide-y divide-border text-sm">
              <Row label="Tenant ID" value={<span className="font-mono">{biz.id}</span>} />
              <Row
                label="Status"
                value={
                  <Badge className={biz.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-orange-50 text-orange-700 border border-orange-200"}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                    {biz.is_active ? "Active" : "Suspended"}
                  </Badge>
                }
              />
              <Row
                label="Plan"
                value={<span><span className="font-semibold">{planName}</span> <span className="text-muted-foreground">— {planPrice}</span></span>}
              />
              <Row
                label="Subscription"
                value={
                  <Badge className={subStatusClass}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                    {sub?.status || (biz.is_active ? "Active" : "Suspended")}
                  </Badge>
                }
              />
              <Row label="Created" value={format(new Date(biz.created_at), "MMM d, yyyy 'at' h:mm a")} />
              <Row label="Last updated" value={format(new Date(biz.updated_at), "MMM d, yyyy 'at' h:mm a")} />
            </dl>
          </section>

          {/* Plan limits & features */}
          <section className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Plan limits & features</h3>
              </div>
              <Link
                to="/super-admin/packages"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Edit plan
              </Link>
            </div>

            <div className="pt-4 space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usage limits</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                <UsageRow icon={Package} label="Products" used={counts.products} max={currentPlan?.max_products} />
                <UsageRow icon={UsersIcon} label="Users" used={counts.users} max={currentPlan?.max_users} />
                <UsageRow icon={Warehouse} label="Warehouses" used={counts.locations} max={currentPlan?.max_locations} />
                <UsageRow icon={ShoppingCart} label="Customers" used={counts.customers} max={null} />
                <UsageRow icon={Truck} label="Suppliers" used={counts.suppliers} max={null} />
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-3">Feature access</div>
              <div className="flex flex-wrap gap-2">
                {planFeatures.filter((f) => f.enabled).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No features enabled for this plan.</p>
                ) : (
                  planFeatures
                    .filter((f) => f.enabled)
                    .map((f) => (
                      <Badge key={f.feature_key} className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {f.feature_label}
                      </Badge>
                    ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right column - 1/3 */}
        <div className="space-y-5">
          {/* Assign / change plan */}
          <section className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Assign plan</h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Assigning a plan activates the subscription. Cancelled subscriptions will be reactivated.
              </p>
              <Select value={assigningPlanId} onValueChange={setAssigningPlanId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose a plan…" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — KES {Number(p.monthly_price_kes || 0).toLocaleString("en-KE")}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={assignPlan}
                disabled={!assigningPlanId || acting === "assign"}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {acting === "assign" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                Assign & activate
              </Button>
            </div>
          </section>

          {/* Users */}
          <section className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
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
                    className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {(u.full_name || u.email || u.user_id).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.full_name || u.email || "Unnamed user"}</p>
                        {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                      </div>
                    </div>
                    <Badge
                      className={
                        u.role === "admin"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                          : u.role === "manager"
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shrink-0"
                          : "bg-muted text-muted-foreground border border-border shrink-0"
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
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground">{children}</p>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function UsageRow({ icon: Icon, label, used, max }: { icon: any; label: string; used: number; max: number | null | undefined }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-foreground/80">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </span>
      <span className="font-medium text-emerald-700">
        {used} / {max ?? "∞"}
      </span>
    </div>
  );
}
