import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Settings2 } from "lucide-react";

const ALL_FEATURES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "Point of Sale" },
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
  { key: "banking", label: "Banking" },
  { key: "chart_of_accounts", label: "Chart of Accounts" },
  { key: "multi_location", label: "Multiple Locations" },
  { key: "team_management", label: "Team Management" },
  { key: "tax_management", label: "Tax Management" },
];

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  max_locations: number;
  max_products: number;
  max_users: number;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  paddle_product_id: string | null;
  paddle_monthly_price_id: string | null;
  paddle_yearly_price_id: string | null;
}

interface PackageFeature {
  id: string;
  package_id: string;
  feature_key: string;
  feature_label: string;
  enabled: boolean;
}

const emptyPackage: Omit<PackageData, "id"> = {
  name: "",
  description: "",
  monthly_price: 0,
  yearly_price: 0,
  max_locations: 1,
  max_products: 50,
  max_users: 1,
  trial_days: 14,
  is_active: true,
  sort_order: 0,
  paddle_product_id: null,
  paddle_monthly_price_id: null,
  paddle_yearly_price_id: null,
};

export default function SuperAdminPackages() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [features, setFeatures] = useState<PackageFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [featuresDialogOpen, setFeaturesDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageData | null>(null);
  const [form, setForm] = useState<Omit<PackageData, "id">>(emptyPackage);
  const [selectedPkg, setSelectedPkg] = useState<PackageData | null>(null);
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [pkgRes, featRes] = await Promise.all([
      supabase.from("subscription_packages").select("*").order("sort_order"),
      supabase.from("package_features").select("*"),
    ]);
    setPackages((pkgRes.data as PackageData[]) || []);
    setFeatures((featRes.data as PackageFeature[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditingPkg(null);
    setForm(emptyPackage);
    setDialogOpen(true);
  };

  const openEdit = (pkg: PackageData) => {
    setEditingPkg(pkg);
    setForm({ ...pkg });
    setDialogOpen(true);
  };

  const openFeatures = (pkg: PackageData) => {
    setSelectedPkg(pkg);
    const pkgFeatures = features.filter(f => f.package_id === pkg.id);
    const toggles: Record<string, boolean> = {};
    ALL_FEATURES.forEach(f => {
      const existing = pkgFeatures.find(pf => pf.feature_key === f.key);
      toggles[f.key] = existing?.enabled ?? false;
    });
    setFeatureToggles(toggles);
    setFeaturesDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingPkg) {
        const { error } = await supabase
          .from("subscription_packages")
          .update(form)
          .eq("id", editingPkg.id);
        if (error) throw error;
        toast.success("Package updated");
      } else {
        const { error } = await supabase
          .from("subscription_packages")
          .insert(form);
        if (error) throw error;
        toast.success("Package created");
      }
      setDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (pkg: PackageData) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("subscription_packages").delete().eq("id", pkg.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Package deleted");
      fetchAll();
    }
  };

  const handleSaveFeatures = async () => {
    if (!selectedPkg) return;
    setSaving(true);
    try {
      // Delete existing features for this package
      await supabase.from("package_features").delete().eq("package_id", selectedPkg.id);
      // Insert all
      const inserts = ALL_FEATURES.map(f => ({
        package_id: selectedPkg.id,
        feature_key: f.key,
        feature_label: f.label,
        enabled: featureToggles[f.key] ?? false,
      }));
      const { error } = await supabase.from("package_features").insert(inserts);
      if (error) throw error;
      toast.success("Features updated");
      setFeaturesDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const formatKES = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Packages</h1>
          <p className="text-muted-foreground">Manage plans, pricing, and feature access</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Package</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Yearly</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No packages created yet. Click "New Package" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map(pkg => {
                  const pkgFeatures = features.filter(f => f.package_id === pkg.id && f.enabled);
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{pkg.name}</span>
                          {pkg.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatKES(pkg.monthly_price)}</TableCell>
                      <TableCell>{formatKES(pkg.yearly_price)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div>{pkg.max_locations} location{pkg.max_locations > 1 ? "s" : ""}</div>
                          <div>{pkg.max_products} products</div>
                          <div>{pkg.max_users} user{pkg.max_users > 1 ? "s" : ""}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{pkgFeatures.length} / {ALL_FEATURES.length}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pkg.is_active ? "default" : "secondary"}>
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openFeatures(pkg)} title="Manage Features">
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(pkg)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(pkg)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Package Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Edit Package" : "Create Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Starter, Pro, Enterprise" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price (KES)</Label>
                <Input type="number" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Yearly Price (KES)</Label>
                <Input type="number" value={form.yearly_price} onChange={e => setForm({ ...form, yearly_price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Max Locations</Label>
                <Input type="number" value={form.max_locations} onChange={e => setForm({ ...form, max_locations: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Products</Label>
                <Input type="number" value={form.max_products} onChange={e => setForm({ ...form, max_products: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Users</Label>
                <Input type="number" value={form.max_users} onChange={e => setForm({ ...form, max_users: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trial Days</Label>
                <Input type="number" value={form.trial_days} onChange={e => setForm({ ...form, trial_days: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? "Saving..." : editingPkg ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Features Dialog */}
      <Dialog open={featuresDialogOpen} onOpenChange={setFeaturesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Features — {selectedPkg?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {ALL_FEATURES.map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <Checkbox
                  checked={featureToggles[f.key] ?? false}
                  onCheckedChange={v => setFeatureToggles({ ...featureToggles, [f.key]: !!v })}
                />
                <Label className="font-normal">{f.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFeaturesDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFeatures} disabled={saving}>
              {saving ? "Saving..." : "Save Features"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
