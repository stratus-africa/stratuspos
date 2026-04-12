import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  business_id: string | null;
  created_at: string;
  business_name?: string;
  role?: string;
  is_super_admin?: boolean;
}

export default function SuperAdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [superAdminIds, setSuperAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const [profilesRes, superRes, rolesRes, bizRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("super_admins").select("user_id"),
      supabase.from("user_roles").select("user_id, role, business_id"),
      supabase.from("businesses").select("id, name"),
    ]);

    const saIds = new Set((superRes.data || []).map((s) => s.user_id));
    setSuperAdminIds(saIds);

    const bizMap = new Map((bizRes.data || []).map((b) => [b.id, b.name]));
    const roleMap = new Map((rolesRes.data || []).map((r) => [r.user_id, r.role]));

    const enriched: UserRow[] = (profilesRes.data || []).map((p) => ({
      ...p,
      business_name: p.business_id ? bizMap.get(p.business_id) || "Unknown" : undefined,
      role: roleMap.get(p.id) || undefined,
      is_super_admin: saIds.has(p.id),
    }));

    setUsers(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleSuperAdmin = async (userId: string, currentlySuper: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot remove your own super admin status");
      return;
    }

    if (currentlySuper) {
      const { error } = await supabase.from("super_admins").delete().eq("user_id", userId);
      if (error) { toast.error("Failed to remove super admin"); return; }
      toast.success("Super admin access removed");
    } else {
      const { error } = await supabase.from("super_admins").insert({ user_id: userId });
      if (error) { toast.error("Failed to grant super admin"); return; }
      toast.success("Super admin access granted");
    }
    fetchUsers();
  };

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
        <h1 className="text-2xl font-bold">All Users</h1>
        <p className="text-muted-foreground">{users.length} registered users</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "Unnamed"}</TableCell>
                  <TableCell>{u.business_name || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {u.role ? (
                      <Badge variant="outline" className="capitalize">{u.role}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.is_super_admin && (
                      <Badge className="bg-red-500/10 text-red-600 border-red-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Super Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(u.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={u.is_super_admin ? "destructive" : "outline"}
                      size="sm"
                      disabled={u.id === currentUser?.id}
                      onClick={() => toggleSuperAdmin(u.id, !!u.is_super_admin)}
                    >
                      {u.is_super_admin ? (
                        <><ShieldOff className="h-3 w-3 mr-1" /> Revoke</>
                      ) : (
                        <><Shield className="h-3 w-3 mr-1" /> Grant</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
