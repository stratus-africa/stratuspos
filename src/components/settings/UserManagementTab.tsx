import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, User, Crown, Pencil, Warehouse, Key } from "lucide-react";
import ManageUserDialog, { SetPasswordDialog } from "@/components/users/ManageUserDialog";

type AppRole = "admin" | "manager" | "cashier" | "stores_manager";

interface TeamMember {
  user_id: string;
  role_id: string;
  role: AppRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  assigned_location_id: string | null;
}

interface LocationLite { id: string; name: string; }

const roleIcon = (role: string) => {
  switch (role) {
    case "admin": return <Crown className="h-3.5 w-3.5" />;
    case "manager": return <Shield className="h-3.5 w-3.5" />;
    case "stores_manager": return <Warehouse className="h-3.5 w-3.5" />;
    default: return <User className="h-3.5 w-3.5" />;
  }
};

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin": return "default" as const;
    case "manager": return "secondary" as const;
    case "stores_manager": return "secondary" as const;
    default: return "outline" as const;
  }
};

export function UserManagementTab() {
  const { business, userRole } = useBusiness();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [locations, setLocations] = useState<LocationLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("cashier");
  const [inviting, setInviting] = useState(false);

  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("cashier");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editLocation, setEditLocation] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === "admin";

  const fetchAll = async () => {
    if (!business) return;
    setLoading(true);

    const [{ data: roles }, { data: locs }] = await Promise.all([
      supabase.from("user_roles").select("id, user_id, role").eq("business_id", business.id),
      supabase.from("locations").select("id, name").eq("business_id", business.id).eq("is_active", true).order("name"),
    ]);

    setLocations((locs || []) as LocationLite[]);

    if (!roles || roles.length === 0) {
      setMembers([]); setLoading(false); return;
    }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, email, phone, is_active, assigned_location_id")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    setMembers(
      roles.map((r) => {
        const p: any = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          role_id: r.id,
          role: r.role as AppRole,
          full_name: p?.full_name || null,
          email: p?.email || null,
          phone: p?.phone || null,
          is_active: p?.is_active ?? true,
          assigned_location_id: p?.assigned_location_id || null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [business?.id]);

  const openEdit = (m: TeamMember) => {
    setEditMember(m); setEditRole(m.role);
    setEditName(m.full_name || ""); setEditPhone(m.phone || "");
    setEditActive(m.is_active);
    setEditLocation(m.assigned_location_id || "none");
  };

  const handleSaveUser = async () => {
    if (!editMember) return;
    setSaving(true);

    const profileUpdate: any = {
      full_name: editName.trim(),
      phone: editPhone.trim() || null,
      is_active: editActive,
      assigned_location_id: editLocation === "none" ? null : editLocation,
    };

    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").update({ role: editRole }).eq("id", editMember.role_id),
      (supabase as any).from("profiles").update(profileUpdate).eq("id", editMember.user_id),
    ]);

    if (roleRes.error || profileRes.error) {
      toast.error("Failed to update: " + (roleRes.error?.message || profileRes.error?.message));
    } else {
      toast.success("User updated");
      await fetchAll();
      setEditMember(null);
    }
    setSaving(false);
  };

  const toggleActive = async (m: TeamMember, next: boolean) => {
    if (m.user_id === user?.id) {
      toast.error("You can't deactivate yourself");
      return;
    }
    const { error } = await (supabase as any).from("profiles").update({ is_active: next }).eq("id", m.user_id);
    if (error) toast.error("Failed: " + error.message);
    else { toast.success(next ? "User activated" : "User deactivated"); fetchAll(); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    toast.info(`To add ${inviteEmail} as a ${inviteRole}: Have them sign up, then assign their role here.`, { duration: 6000 });
    setInviting(false); setInviteOpen(false); setInviteEmail("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Users in this Tenant</CardTitle>
          <CardDescription>All team members with access to this business.</CardDescription>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1 h-4 w-4" /> Invite User
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Till</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : members.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">No team members found.</TableCell></TableRow>
            ) : members.map((m) => {
              const loc = locations.find((l) => l.id === m.assigned_location_id);
              return (
                <TableRow key={m.user_id} className={!m.is_active ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {m.full_name || "Unnamed User"}
                    {m.user_id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(m.role)} className="flex items-center gap-1 w-fit capitalize">
                      {roleIcon(m.role)} {m.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{loc?.name || "—"}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={(v) => toggleActive(m, v)}
                          disabled={m.user_id === user?.id}
                        />
                        <span className="text-xs text-muted-foreground">{m.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    ) : (
                      <Badge variant={m.is_active ? "outline" : "secondary"} className={m.is_active ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""}>
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)} disabled={m.user_id === user?.id} title={m.user_id === user?.id ? "You can't edit yourself here" : "Edit user"}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User — {editMember?.full_name || "User"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editMember?.email || ""} disabled className="bg-muted" /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="manager">Manager — Operations</SelectItem>
                  <SelectItem value="stores_manager">Stores Manager — Stock & inventory</SelectItem>
                  <SelectItem value="cashier">Cashier — POS only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned Till / Location</Label>
              <Select value={editLocation} onValueChange={setEditLocation}>
                <SelectTrigger><SelectValue placeholder="No specific till" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific till (can choose at login)</SelectItem>
                  {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Cashiers can switch tills at the start-of-day screen.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Inactive users cannot sign in to this business.</p>
              </div>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Email Address</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="stores_manager">Stores Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">The user must first create an account. Once they sign up, you can assign them to your business.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
