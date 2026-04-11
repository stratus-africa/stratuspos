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
import { UserPlus, Shield, User, Crown } from "lucide-react";

interface TeamMember {
  user_id: string;
  role: string;
  full_name: string | null;
  email?: string;
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

export function UserManagementTab() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("cashier");
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    if (!business) return;
    setLoading(true);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("business_id", business.id);

    if (!roles || roles.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    setMembers(
      roles.map((r) => ({
        user_id: r.user_id,
        role: r.role,
        full_name: profileMap.get(r.user_id)?.full_name || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [business?.id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    // For MVP, we show a message explaining the invite flow
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
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-1 h-4 w-4" /> Invite User
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No team members found.</TableCell>
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
                  <TableCell>
                    <Badge variant={roleBadgeVariant(m.role)} className="flex items-center gap-1 w-fit capitalize">
                      {roleIcon(m.role)} {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

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
