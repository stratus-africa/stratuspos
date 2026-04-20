import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Search, Ban, CheckCircle2, Pencil, Eye, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { BusinessDetailDialog } from "@/components/super-admin/BusinessDetailDialog";
import { AddBusinessDialog } from "@/components/super-admin/AddBusinessDialog";

interface BusinessRow {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  created_at: string;
  is_active: boolean;
  tax_rate: number | null;
  _userCount: number;
  _locationCount: number;
  _salesCount: number;
  _revenue: number;
}

export default function SuperAdminBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  // Edit state
  const [editBiz, setEditBiz] = useState<BusinessRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editCurrency, setEditCurrency] = useState("KES");
  const [editTaxRate, setEditTaxRate] = useState("16");
  const [editTimezone, setEditTimezone] = useState("Africa/Nairobi");
  const [saving, setSaving] = useState(false);

  // Masquerade
  const [masquerading, setMasquerading] = useState<string | null>(null);

  // Detail dialog
  const [detailBiz, setDetailBiz] = useState<BusinessRow | null>(null);

  // Add business dialog
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = async () => {
    const [bizRes, salesRes] = await Promise.all([
      supabase.from("businesses").select("*"),
      supabase.from("sales").select("business_id, total"),
    ]);
    if (!bizRes.data) { setLoading(false); return; }

    const salesByBiz = new Map<string, { count: number; revenue: number }>();
    (salesRes.data || []).forEach((s) => {
      const entry = salesByBiz.get(s.business_id) || { count: 0, revenue: 0 };
      entry.count++;
      entry.revenue += Number(s.total);
      salesByBiz.set(s.business_id, entry);
    });

    const enriched = await Promise.all(
      bizRes.data.map(async (biz: any) => {
        const [usersRes, locsRes] = await Promise.all([
          supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
          supabase.from("locations").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
        ]);
        const salesData = salesByBiz.get(biz.id) || { count: 0, revenue: 0 };
        return {
          ...biz,
          is_active: biz.is_active ?? true,
          _userCount: usersRes.count || 0,
          _locationCount: locsRes.count || 0,
          _salesCount: salesData.count,
          _revenue: salesData.revenue,
        };
      })
    );

    setBusinesses(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (bizId: string, currentlyActive: boolean) => {
    setToggling(bizId);
    const { error } = await supabase
      .from("businesses")
      .update({ is_active: !currentlyActive })
      .eq("id", bizId);
    if (error) {
      toast.error("Failed to update business status");
    } else {
      toast.success(currentlyActive ? "Business deactivated" : "Business reactivated");
      setBusinesses((prev) =>
        prev.map((b) => (b.id === bizId ? { ...b, is_active: !currentlyActive } : b))
      );
    }
    setToggling(null);
  };

  const openEdit = (biz: BusinessRow) => {
    setEditBiz(biz);
    setEditName(biz.name);
    setEditCurrency(biz.currency);
    setEditTaxRate(String(biz.tax_rate ?? 16));
    setEditTimezone(biz.timezone);
  };

  const handleSaveEdit = async () => {
    if (!editBiz) return;
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: editName.trim(),
        currency: editCurrency,
        tax_rate: parseFloat(editTaxRate) || 0,
        timezone: editTimezone,
      })
      .eq("id", editBiz.id);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Business updated");
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === editBiz.id
            ? { ...b, name: editName.trim(), currency: editCurrency, tax_rate: parseFloat(editTaxRate), timezone: editTimezone }
            : b
        )
      );
      setEditBiz(null);
    }
    setSaving(false);
  };

  const handleMasquerade = (bizId: string) => {
    setMasquerading(bizId);
    // Store masquerade business ID and redirect to main app
    localStorage.setItem("masquerade_business_id", bizId);
    window.location.href = "/";
  };

  const filtered = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold">All Businesses</h1>
          <p className="text-muted-foreground">{businesses.length} registered businesses</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Business
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">Locations</TableHead>
                <TableHead className="text-center">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((biz) => (
                <TableRow key={biz.id} className={!biz.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    <button
                      className="text-left hover:underline text-primary cursor-pointer"
                      onClick={() => setDetailBiz(biz)}
                    >
                      {biz.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    {biz.is_active ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{biz.currency}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{biz._userCount}</TableCell>
                  <TableCell className="text-center">{biz._locationCount}</TableCell>
                  <TableCell className="text-center">{biz._salesCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {biz.currency} {biz._revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(biz.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEdit(biz)} title="Edit business">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMasquerade(biz.id)}
                        disabled={masquerading === biz.id}
                        title="View as this business"
                      >
                        {masquerading === biz.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant={biz.is_active ? "destructive" : "outline"}
                        size="sm"
                        disabled={toggling === biz.id}
                        onClick={() => toggleActive(biz.id, biz.is_active)}
                      >
                        {biz.is_active ? (
                          <><Ban className="h-3 w-3 mr-1" /> Deactivate</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Reactivate</>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search ? "No businesses match your search" : "No businesses registered yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Business Dialog */}
      <Dialog open={!!editBiz} onOpenChange={(open) => !open && setEditBiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business — {editBiz?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={editCurrency} onValueChange={setEditCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="TZS">TZS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={editTaxRate} onChange={(e) => setEditTaxRate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={editTimezone} onValueChange={setEditTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBiz(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BusinessDetailDialog
        businessId={detailBiz?.id || null}
        businessName={detailBiz?.name || ""}
        onClose={() => setDetailBiz(null)}
      />

      <AddBusinessDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={() => { setLoading(true); fetchData(); }}
      />
    </div>
  );
}
