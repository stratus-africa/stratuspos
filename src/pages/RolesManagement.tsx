import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, User, Crown, Pencil, Loader2, Users, ShieldCheck, Info } from "lucide-react";

type AppRole = "admin" | "manager" | "cashier";

interface TeamMember {
  user_id: string;
  role_id: string;
  role: AppRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

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

const rolePermissions: Record<AppRole, { label: string; description: string; permissions: string[] }> = {
  admin: {
    label: "Admin",
    description: "Full access to all features and settings.",
    permissions: [
      "Dashboard & Analytics",
      "Point of Sale (POS)",
      "Products & Inventory",
      "Sales & Purchases",
      "Expenses",
      "Banking & Reconciliation",
      "Chart of Accounts",
      "Reports",
      "Settings & User Management",
      "Roles Management",
    ],
  },
  manager: {
    label: "Manager",
    description: "Day-to-day operations management without financial settings.",
    permissions: [
      "Dashboard & Analytics",
      "Point of Sale (POS)",
      "Products & Inventory",
      "Sales & Purchases",
    ],
  },
  cashier: {
    label: "Cashier",
    description: "POS-only access for processing sales.",
    permissions: [
      "Point of Sale (POS)",
    ],
  },
};

export default function RolesManagement() {
  const { business, userRole, hasAccess } = useBusiness();
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
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === "admin";

  const fetchMembers = async () => {
    if (!business) return;
    setLoading(true);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .eq("business_id", business.id);

    if (!roles || roles.length === 0) {
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
  };

  const handleSaveUser = async () => {
    if (!editMember) return;
    setSaving(true);

    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role: editRole })
      .eq("id", editMember.role_id);

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

  const roleCounts = {
    admin: members.filter((m) => m.role === "admin").length,
    manager: members.filter((m) => m.role === "manager").length,
    cashier: members.filter((m) => m.role === "cashier").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage team members and their access levels.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" /> Team Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Role Definitions
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="mt-4">
          {/* Role summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {(Object.keys(rolePermissions) as AppRole[]).map((role) => (
              <Card key={role}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {role === "admin" ? <Crown className="h-4 w-4 text-primary" /> :
                       role === "manager" ? <Shield className="h-4 w-4 text-primary" /> :
                       <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground capitalize">{role}s</p>
                      <p className="text-lg font-bold">{roleCounts[role]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="w-[60px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">No team members found.</TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.user_id}>
                        <TableCell className="font-medium">
                          {m.full_name || "Unnamed User"}
                          {m.user_id === user?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{m.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant(m.role)} className="flex items-center gap-1 w-fit capitalize">
                            {roleIcon(m.role)} {m.role}
                          </Badge>
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
                              title={m.user_id === user?.id ? "You can't change your own role" : "Edit user"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Definitions Tab */}
        <TabsContent value="roles" className="mt-4">
          <div className="grid gap-4">
            {(Object.keys(rolePermissions) as AppRole[]).map((role) => {
              const info = rolePermissions[role];
              return (
                <Card key={role}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {role === "admin" ? <Crown className="h-5 w-5 text-primary" /> :
                         role === "manager" ? <Shield className="h-5 w-5 text-primary" /> :
                         <User className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">{info.label}</CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {roleCounts[role]} user{roleCounts[role] !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {info.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {perm}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

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
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new user to your business and assign their role.
            </DialogDescription>
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
            <div className="flex items-start gap-2 rounded-lg border p-3 bg-muted/50">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                The user must first create an account. Once they sign up, you can assign them to your business.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
