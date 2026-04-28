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
import { Checkbox } from "@/components/ui/checkbox";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, User, Crown, Pencil, Loader2, Users, ShieldCheck, Info, Warehouse } from "lucide-react";

type AppRole = "admin" | "manager" | "cashier" | "stores_manager";

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

const allPermissions = [
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
];

const defaultRolePermissions: Record<AppRole, string[]> = {
  admin: [...allPermissions],
  manager: [
    "Dashboard & Analytics",
    "Point of Sale (POS)",
    "Products & Inventory",
    "Sales & Purchases",
  ],
  cashier: [
    "Point of Sale (POS)",
  ],
  stores_manager: [
    "Products & Inventory",
    "Sales & Purchases",
    "Reports",
  ],
};

const roleDescriptions: Record<AppRole, { label: string; description: string }> = {
  admin: { label: "Admin", description: "Full access to all features and settings." },
  manager: { label: "Manager", description: "Day-to-day operations management." },
  cashier: { label: "Cashier", description: "POS-only access for processing sales." },
  stores_manager: { label: "Stores Manager", description: "Manages stock, purchases and inventory operations." },
};

export function RolesPermissionsTab() {
  const { business, userRole } = useBusiness();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("cashier");
  const [inviting, setInviting] = useState(false);

  // Edit member state
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("cashier");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit role permissions state
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  // Persisted permissions per role (loaded from role_permissions table)
  const [rolePermissions, setRolePermissions] = useState<Record<AppRole, string[]>>(defaultRolePermissions);
  const [savingPerms, setSavingPerms] = useState(false);

  const isAdmin = userRole === "admin";

  const fetchPermissions = async () => {
    if (!business) return;
    const { data } = await (supabase as any)
      .from("role_permissions")
      .select("role, permission")
      .eq("business_id", business.id);
    const next: Record<AppRole, string[]> = { ...defaultRolePermissions };
    if (data && data.length > 0) {
      // Reset only roles that actually have stored rows so unset roles keep defaults
      const seenRoles = new Set<AppRole>();
      data.forEach((row: { role: AppRole; permission: string }) => {
        if (!seenRoles.has(row.role)) {
          next[row.role] = [];
          seenRoles.add(row.role);
        }
        next[row.role].push(row.permission);
      });
    }
    setRolePermissions(next);
  };

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
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  const openEditMember = (member: TeamMember) => {
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

  const openEditRole = (role: AppRole) => {
    setEditingRole(role);
    setEditPerms([...rolePermissions[role]]);
  };

  const togglePerm = (perm: string) => {
    setEditPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSaveRolePerms = async () => {
    if (!editingRole || !business) return;
    setSavingPerms(true);
    try {
      // Replace stored permissions for this role
      const { error: delErr } = await (supabase as any)
        .from("role_permissions")
        .delete()
        .eq("business_id", business.id)
        .eq("role", editingRole);
      if (delErr) throw delErr;

      if (editPerms.length > 0) {
        const rows = editPerms.map((permission) => ({
          business_id: business.id,
          role: editingRole,
          permission,
        }));
        const { error: insErr } = await (supabase as any).from("role_permissions").insert(rows);
        if (insErr) throw insErr;
      }

      setRolePermissions((prev) => ({ ...prev, [editingRole]: editPerms }));
      toast.success(`${roleDescriptions[editingRole].label} permissions saved`);
      setEditingRole(null);
    } catch (err: any) {
      toast.error("Failed to save permissions: " + err.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const roleCounts = {
    admin: members.filter((m) => m.role === "admin").length,
    manager: members.filter((m) => m.role === "manager").length,
    cashier: members.filter((m) => m.role === "cashier").length,
    stores_manager: members.filter((m) => m.role === "stores_manager").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Manage team members, roles and their permissions.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" /> Team Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {(["admin", "manager", "stores_manager", "cashier"] as AppRole[]).map((role) => (
              <Card key={role}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {role === "admin" ? <Crown className="h-4 w-4 text-primary" /> :
                       role === "manager" ? <Shield className="h-4 w-4 text-primary" /> :
                       role === "stores_manager" ? <Warehouse className="h-4 w-4 text-primary" /> :
                       <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{roleDescriptions[role].label}s</p>
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
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditMember(m)}
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

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="mt-4">
          <div className="grid gap-4">
            {(["admin", "manager", "stores_manager", "cashier"] as AppRole[]).map((role) => {
              const info = roleDescriptions[role];
              const perms = rolePermissions[role];
              return (
                <Card key={role}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {role === "admin" ? <Crown className="h-5 w-5 text-primary" /> :
                         role === "manager" ? <Shield className="h-5 w-5 text-primary" /> :
                         role === "stores_manager" ? <Warehouse className="h-5 w-5 text-primary" /> :
                         <User className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{info.label}</CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {roleCounts[role]} user{roleCounts[role] !== 1 ? "s" : ""}
                        </Badge>
                        {isAdmin && role !== "admin" && (
                          <Button variant="outline" size="sm" onClick={() => openEditRole(role)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {perms.map((perm) => (
                        <div key={perm} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {perm}
                        </div>
                      ))}
                      {perms.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-full">No permissions assigned.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
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
                  <SelectItem value="stores_manager">Stores Manager — Stock & inventory operations</SelectItem>
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

      {/* Edit Role Permissions Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingRole ? roleDescriptions[editingRole].label : ""} Permissions
            </DialogTitle>
            <DialogDescription>
              Select which modules this role can access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {allPermissions.map((perm) => (
              <label key={perm} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-2 -mx-2">
                <Checkbox
                  checked={editPerms.includes(perm)}
                  onCheckedChange={() => togglePerm(perm)}
                />
                <span className="text-sm">{perm}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
            <Button onClick={handleSaveRolePerms} disabled={savingPerms}>
              {savingPerms && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
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
