import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BusinessRow {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  created_at: string;
  _userCount?: number;
  _locationCount?: number;
}

export default function SuperAdminBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: bizData } = await supabase.from("businesses").select("*");
      if (!bizData) { setLoading(false); return; }

      // Fetch counts per business
      const enriched = await Promise.all(
        bizData.map(async (biz) => {
          const [usersRes, locsRes] = await Promise.all([
            supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
            supabase.from("locations").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
          ]);
          return { ...biz, _userCount: usersRes.count || 0, _locationCount: locsRes.count || 0 };
        })
      );

      setBusinesses(enriched);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Businesses</h1>
        <p className="text-muted-foreground">{businesses.length} registered businesses</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{biz.currency}</Badge>
                  </TableCell>
                  <TableCell>{biz._userCount}</TableCell>
                  <TableCell>{biz._locationCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(biz.created_at), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
              {businesses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No businesses registered yet
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
