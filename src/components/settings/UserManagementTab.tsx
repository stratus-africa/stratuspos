import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, User, Crown, Pencil, Loader2 } from "lucide-react";

type AppRole = "admin" | "manager" | "cashier";

interface TeamMember {
  user_id: string;
  role_id: string;
  role: AppRole;
  till_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface TillOpt { id: string; name: string }

const roleIcon = (role: string) => {
  switch (role) {
    case "admin": return <Crown className="h-3.5 w-3.5" />;
    case "manager": return <Shield className="h-3.5 w-3.5" />;
    default: return <User className="h-3.5 w-3.5" />;
  }
};

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin": return "default" as const;
    case "manager": return "secondary" as const;
    default: return "outline" as const;
  }
};

export function UserManagementTab() {
  const { business, userRole } = useBusiness();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("cashier");
  const [inviting, setInviting] = useState(false);

  // Edit state
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("cashier");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTillId, setEditTillId] = useState<string>("none");
  const [tills, setTills] = useState<TillOpt[]>([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === "admin";

  const fetchMembers = async () => {
    if (!business) return;
    setLoading(true);

    const [rolesRes, tillsRes] = await Promise.all([
      supabase.from("user_roles").select("id, user_id, role, till_id").eq("business_id", business.id),
      supabase.from("tills" as any).select("id, name").eq("business_id", business.id).eq("is_active", true).order("name"),
    ]);
    const roles = (rolesRes.data || []) as any[];
    setTills(((tillsRes.data || []) as any[]).map((t) => ({ id: t.id, name: t.name })));

    if (roles.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    setMembers(
      roles.map((r) => ({
        user_id: r.user_id,
        role_id: r.id,
        role: r.role as AppRole,
        till_id: r.till_id || null,
        full_name: profileMap.get(r.user_id)?.full_name || null,
        email: profileMap.get(r.user_id)?.email || null,
        phone: profileMap.get(r.user_id)?.phone || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [business?.id]);

  const openEditRole = (member: TeamMember) => {
    setEditMember(member);
    setEditRole(member.role);
    setEditName(member.full_name || "");
    setEditPhone(member.phone || "");
    setEditTillId(member.till_id || "none");
  };

  const handleSaveUser = async () => {
    if (!editMember) return;
    setSaving(true);

    // Update role + till
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role: editRole, till_id: editTillId === "none" ? null : editTillId } as any)
      .eq("id", editMember.role_id);

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: editName.trim(), phone: editPhone.trim() || null })
      .eq("id", editMember.user_id);

    if (roleError || profileError) {
      toast.error("Failed to update: " + (roleError?.message || profileError?.message));
    } else {
      toast.success("User updated successfully");
      await fetchMembers();
    }
    setSaving(false);
    setEditMember(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    toast.info(
      `To add ${inviteEmail} as a ${inviteRole}: Have them sign up, then you can assign their role here.`,
      { duration: 6000 }
    );
    setInviting(false);
    setInviteOpen(false);
    setInviteEmail("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage who has access to your business and their roles.</CardDescription>
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
              <TableHead>Role</TableHead>
              <TableHead>Till</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">No team members found.</TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const till = tills.find((t) => t.id === m.till_id);
                return (
                  <TableRow key={m.user_id}>
                    <TableCell className="font-medium">
                      {m.full_name || "Unnamed User"}
                      {m.user_id === user?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(m.role)} className="flex items-center gap-1 w-fit capitalize">
                        {roleIcon(m.role)} {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {till ? (
                        <Badge variant="outline" className="text-xs">{till.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        Active
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRole(m)}
                          disabled={m.user_id === user?.id}
                          title={m.user_id === user?.id ? "You can't change your own role" : "Change role"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {editMember?.full_name || "User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editMember?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access to all features</SelectItem>
                  <SelectItem value="manager">Manager — Inventory, sales & purchases</SelectItem>
                  <SelectItem value="cashier">Cashier — POS access only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === "cashier" && (
              <div className="space-y-2">
                <Label>Assigned Till</Label>
                <Select value={editTillId} onValueChange={setEditTillId}>
                  <SelectTrigger><SelectValue placeholder="Select a till" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No till assigned —</SelectItem>
                    {tills.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tills.length === 0 && (
                  <p className="text-xs text-muted-foreground">No tills configured. Add tills in the Tills tab.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="manager">Manager — Manage inventory & sales</SelectItem>
                  <SelectItem value="cashier">Cashier — POS access only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              The user must first create an account. Once they sign up, you can assign them to your business.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
