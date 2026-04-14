import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface BusinessRow {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  created_at: string;
  is_active: boolean;
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
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                  <TableCell className="font-medium">{biz.name}</TableCell>
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
    </div>
  );
}
