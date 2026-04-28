import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Shield, ShieldOff, Loader2, Building2, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SuperAdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isSA, setIsSA] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!id) return;
    setLoading(true);
    const [profRes, roleRes, saRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("super_admins").select("id").eq("user_id", id).maybeSingle(),
    ]);
    setProfile(profRes.data);
    setRole(roleRes.data);
    setIsSA(!!saRes.data);
    if ((profRes.data as any)?.business_id) {
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", (profRes.data as any).business_id).maybeSingle();
      setBusiness(biz);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [id]);

  const toggleSA = async () => {
    if (!id) return;
    if (isSA) {
      const { error } = await supabase.from("super_admins").delete().eq("user_id", id);
      if (error) return toast.error(error.message);
      toast.success("Super admin revoked");
    } else {
      const { error } = await supabase.from("super_admins").insert({ user_id: id });
      if (error) return toast.error(error.message);
      toast.success("Super admin granted");
    }
    fetch();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Link to="/super-admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const initials = (profile.full_name || profile.email || "U").charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <Link to="/super-admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{profile.full_name || "Unnamed user"}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {role?.role && <Badge variant="outline" className="capitalize">{role.role}</Badge>}
                  {isSA && <Badge className="bg-rose-50 text-rose-700 border-rose-200"><Shield className="h-3 w-3 mr-1" /> Super Admin</Badge>}
                </div>
              </div>
            </div>
            <Button variant={isSA ? "destructive" : "outline"} size="sm" onClick={toggleSA}>
              {isSA ? <><ShieldOff className="h-4 w-4 mr-1" /> Revoke Super Admin</> : <><Shield className="h-4 w-4 mr-1" /> Grant Super Admin</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile.email || "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{profile.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {business ? (
              <Link to={`/super-admin/businesses/${business.id}`} className="text-emerald-700 hover:underline">{business.name}</Link>
            ) : <span className="text-muted-foreground">No tenant</span>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {format(new Date(profile.created_at), "MMM dd, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
