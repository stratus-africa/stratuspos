import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Lock } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { business, userRole } = useBusiness();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tillName, setTillName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();
      setFullName(prof?.full_name || "");
      setPhone(prof?.phone || "");
      setEmail(prof?.email || user.email || "");

      if (business?.id) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("till_id")
          .eq("user_id", user.id)
          .eq("business_id", business.id)
          .maybeSingle();
        if ((role as any)?.till_id) {
          const { data: till } = await supabase
            .from("tills" as any)
            .select("name")
            .eq("id", (role as any).till_id)
            .maybeSingle();
          setTillName((till as any)?.name || null);
        }
      }
      setLoading(false);
    })();
  }, [user, business?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setSaving(false);
  };

  const handlePassword = async () => {
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    if (pwd !== pwd2) return toast.error("Passwords don't match");
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setPwd(""); setPwd2(""); }
    setPwdSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const initials = (fullName || email || "U").charAt(0).toUpperCase();

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal info and password.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{fullName || "Unnamed user"}</CardTitle>
              <CardDescription>{email}</CardDescription>
              <div className="flex items-center gap-2 mt-2">
                {userRole && <Badge variant="outline" className="capitalize">{userRole}</Badge>}
                {business && <Badge variant="secondary">{business.name}</Badge>}
                {tillName && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Till: {tillName}</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
          <CardDescription>Use a strong password with at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" onClick={handlePassword} disabled={pwdSaving || !pwd}>
            {pwdSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
