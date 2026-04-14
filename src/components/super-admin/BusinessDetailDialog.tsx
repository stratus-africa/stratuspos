import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DollarSign, ShoppingCart, Users, MapPin, TrendingUp, Package,
  BarChart3, CreditCard, Activity, Layers, CheckCircle2, XCircle, Loader2, ArrowUpCircle, Trash2
} from "lucide-react";

interface BusinessDetailDialogProps {
  businessId: string | null;
  businessName: string;
  onClose: () => void;
}

export function BusinessDetailDialog({ businessId, businessName, onClose }: BusinessDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0, totalRevenue: 0, totalExpenses: 0, totalProducts: 0,
    totalCustomers: 0, totalSuppliers: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetchAll();
  }, [businessId]);

  const fetchAll = async () => {
    if (!businessId) return;

    const [
      salesRes, expensesRes, productsRes, customersRes, suppliersRes,
      usersRes, locationsRes, recentSalesRes, recentExpensesRes
    ] = await Promise.all([
      supabase.from("sales").select("total").eq("business_id", businessId),
      supabase.from("expenses").select("amount").eq("business_id", businessId),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", businessId),
      supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("business_id", businessId),
      supabase.from("user_roles").select("user_id, role").eq("business_id", businessId),
      supabase.from("locations").select("*").eq("business_id", businessId),
      supabase.from("sales").select("id, invoice_number, total, status, payment_status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(10),
      supabase.from("expenses").select("id, amount, description, date, payment_method").eq("business_id", businessId).order("date", { ascending: false }).limit(10),
    ]);

    const totalRevenue = (salesRes.data || []).reduce((s, r) => s + Number(r.total), 0);
    const totalExpenses = (expensesRes.data || []).reduce((s, r) => s + Number(r.amount), 0);

    setStats({
      totalSales: salesRes.data?.length || 0,
      totalRevenue,
      totalExpenses,
      totalProducts: productsRes.count || 0,
      totalCustomers: customersRes.count || 0,
      totalSuppliers: suppliersRes.count || 0,
    });

    // Fetch user profiles
    const userIds = (usersRes.data || []).map((u: any) => u.user_id);
    let userProfiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .in("id", userIds);
      userProfiles = (usersRes.data || []).map((ur: any) => {
        const profile = (profiles || []).find((p: any) => p.id === ur.user_id);
        return { ...ur, ...profile };
      });
    }
    setUsers(userProfiles);

    // Fetch subscription for any user in this business
    if (userIds.length > 0) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(1);
      setSubscription(subs?.[0] || null);
    }

    setLocations(locationsRes.data || []);
    setRecentSales(recentSalesRes.data || []);
    setRecentExpenses(recentExpensesRes.data || []);
    setProductCount(productsRes.count || 0);
    setLoading(false);
  };

  // Derive tier from subscription
  const getTier = () => {
    if (!subscription || !["active", "trialing"].includes(subscription.status)) return "free";
    const pid = subscription.product_id || "";
    if (pid.includes("pro")) return "pro";
    if (pid.includes("basic")) return "basic";
    return "free";
  };

  const tier = getTier();

  // Modules
  const modules = [
    { name: "Point of Sale", enabled: true, tier: "free" },
    { name: "Products & Inventory", enabled: true, tier: "free" },
    { name: "Sales Management", enabled: true, tier: "free" },
    { name: "Purchases", enabled: true, tier: "free" },
    { name: "Expenses", enabled: true, tier: "free" },
    { name: "Customers", enabled: true, tier: "free" },
    { name: "Multi-Location", enabled: tier === "pro", tier: "pro" },
    { name: "Reports & Analytics", enabled: tier === "pro", tier: "pro" },
    { name: "Banking & Reconciliation", enabled: tier === "pro", tier: "pro" },
    { name: "Chart of Accounts", enabled: tier === "pro", tier: "pro" },
  ];

  const tierColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    basic: "bg-blue-500/10 text-blue-600 border-blue-200",
    pro: "bg-amber-500/10 text-amber-600 border-amber-200",
  };

  return (
    <Dialog open={!!businessId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {businessName}
            <Badge className={tierColors[tier]}>{tier.toUpperCase()} Plan</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="mt-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Dashboard</TabsTrigger>
              <TabsTrigger value="users"><Users className="h-3.5 w-3.5 mr-1.5" />Users</TabsTrigger>
              <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5 mr-1.5" />Activity</TabsTrigger>
              <TabsTrigger value="subscription"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Subscription</TabsTrigger>
              <TabsTrigger value="modules"><Layers className="h-3.5 w-3.5 mr-1.5" />Modules</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={ShoppingCart} label="Total Sales" value={stats.totalSales.toLocaleString()} />
                <StatCard icon={DollarSign} label="Total Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} />
                <StatCard icon={TrendingUp} label="Total Expenses" value={`KES ${stats.totalExpenses.toLocaleString()}`} />
                <StatCard icon={Package} label="Products" value={stats.totalProducts.toString()} />
                <StatCard icon={Users} label="Customers" value={stats.totalCustomers.toString()} />
                <StatCard icon={MapPin} label="Locations" value={locations.length.toString()} />
              </div>

              {/* Locations list */}
              {locations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {locations.map((loc: any) => (
                        <Badge key={loc.id} variant={loc.is_active ? "default" : "secondary"}>
                          {loc.name} ({loc.type})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                          <TableCell>{u.email || "—"}</TableCell>
                          <TableCell>{u.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{u.role}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.created_at ? format(new Date(u.created_at), "MMM dd, yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No users found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recent Sales</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.invoice_number || "—"}</TableCell>
                          <TableCell>KES {Number(s.total).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{s.status}</Badge></TableCell>
                          <TableCell><Badge variant={s.payment_status === "paid" ? "default" : "secondary"} className="capitalize">{s.payment_status}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(s.created_at), "MMM dd, HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                      {recentSales.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No sales yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentExpenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.description || "—"}</TableCell>
                          <TableCell>KES {Number(e.amount).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{e.payment_method || "—"}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(e.date), "MMM dd, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {recentExpenses.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No expenses yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Plan</p>
                          <p className="text-2xl font-bold capitalize">{tier} Plan</p>
                        </div>
                        <Badge className={tierColors[tier] + " text-lg px-4 py-1"}>{subscription.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Subscription ID</p>
                          <p className="font-mono text-xs">{subscription.paddle_subscription_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Environment</p>
                          <p className="capitalize">{subscription.environment}</p>
                        </div>
                        {subscription.current_period_start && (
                          <div>
                            <p className="text-muted-foreground">Period Start</p>
                            <p>{format(new Date(subscription.current_period_start), "MMM dd, yyyy")}</p>
                          </div>
                        )}
                        {subscription.current_period_end && (
                          <div>
                            <p className="text-muted-foreground">Period End</p>
                            <p>{format(new Date(subscription.current_period_end), "MMM dd, yyyy")}</p>
                          </div>
                        )}
                      </div>
                      {subscription.cancel_at_period_end && (
                        <Badge variant="destructive">Cancels at period end</Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-muted-foreground">This business has no active subscription</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Tier Management */}
              <ManualTierManager
                businessId={businessId!}
                users={users}
                subscription={subscription}
                onUpdated={fetchAll}
              />
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {modules.map((mod) => (
                      <div
                        key={mod.name}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          mod.enabled ? "bg-emerald-500/5 border-emerald-200" : "bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {mod.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`text-sm font-medium ${!mod.enabled ? "text-muted-foreground" : ""}`}>
                            {mod.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{mod.tier}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManualTierManager({
  businessId, users, subscription, onUpdated,
}: {
  businessId: string;
  users: any[];
  subscription: any;
  onUpdated: () => void;
}) {
  const [selectedTier, setSelectedTier] = useState<string>(subscription ? (subscription.product_id?.includes("pro") ? "pro" : "basic") : "basic");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const ownerUserId = users[0]?.user_id || users[0]?.id;

  const handleSetTier = async () => {
    if (!ownerUserId) {
      toast.error("No user found for this business");
      return;
    }
    setSaving(true);
    try {
      const productId = selectedTier === "pro" ? "pro_plan" : "basic_plan";
      const priceId = selectedTier === "pro" ? "pro_monthly" : "basic_monthly";
      const now = new Date().toISOString();

      if (subscription) {
        // Update existing
        const { error } = await supabase
          .from("subscriptions")
          .update({
            product_id: productId,
            price_id: priceId,
            status: "active",
            cancel_at_period_end: false,
          })
          .eq("id", subscription.id);
        if (error) throw error;
        toast.success(`Subscription updated to ${selectedTier.toUpperCase()}`);
      } else {
        // Create manual subscription
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: ownerUserId,
            paddle_subscription_id: `manual_${crypto.randomUUID().slice(0, 8)}`,
            paddle_customer_id: `manual_${crypto.randomUUID().slice(0, 8)}`,
            product_id: productId,
            price_id: priceId,
            status: "active",
            environment: "sandbox",
            current_period_start: now,
          });
        if (error) throw error;
        toast.success(`Business upgraded to ${selectedTier.toUpperCase()} plan`);
      }
      onUpdated();
    } catch (err: any) {
      toast.error("Failed to update: " + err.message);
    }
    setSaving(false);
  };

  const handleRemoveSubscription = async () => {
    if (!subscription) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", subscription.id);
      if (error) throw error;
      toast.success("Subscription removed — business is now on Free plan");
      onUpdated();
    } catch (err: any) {
      toast.error("Failed to remove: " + err.message);
    }
    setRemoving(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ArrowUpCircle className="h-4 w-4" />
          Manual Tier Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label>Set Plan</Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic — $15/mo</SelectItem>
                <SelectItem value="pro">Pro — $39/mo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSetTier} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {subscription ? "Update Plan" : "Activate Plan"}
          </Button>
          {subscription && (
            <Button variant="destructive" size="icon" onClick={handleRemoveSubscription} disabled={removing} title="Remove subscription (downgrade to Free)">
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This creates or updates a manual subscription record. Changes take effect immediately.
        </p>
      </CardContent>
    </Card>
  );
}

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
