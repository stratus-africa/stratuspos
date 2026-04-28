import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the manager's user_id once approved. */
  onApproved: (managerUserId: string) => void;
  title?: string;
  description?: string;
}

export default function ManagerApprovalDialog({ open, onOpenChange, onApproved, title, description }: Props) {
  const { business } = useBusiness();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const reset = () => { setEmail(""); setPassword(""); };

  const handleVerify = async () => {
    if (!business || !email || !password) return;
    setVerifying(true);
    try {
      // Find the user by email within this business with admin/manager/stores_manager role
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("business_id", business.id)
        .ilike("email", email.trim())
        .maybeSingle();
      if (pErr || !profile) {
        toast.error("No team member found with that email");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .eq("business_id", business.id);
      const allowed = (roles || []).some((r: any) =>
        ["admin", "manager", "stores_manager"].includes(r.role)
      );
      if (!allowed) {
        toast.error("This user is not authorised to approve");
        return;
      }
      // Verify password by attempting a lightweight sign-in via a temporary client
      // Use the REST endpoint directly to avoid disturbing the current session.
      const url = (import.meta as any).env.VITE_SUPABASE_URL;
      const key = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ email: profile.email || email.trim(), password }),
      });
      if (!res.ok) {
        toast.error("Invalid manager credentials");
        return;
      }
      onApproved(profile.id);
      reset();
      onOpenChange(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            {title || "Manager Approval Required"}
          </DialogTitle>
          <DialogDescription>
            {description || "An admin, manager, or stores manager must approve removing this item from the cart."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Manager Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@example.com" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Manager Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={verifying}>Cancel</Button>
          <Button onClick={handleVerify} disabled={verifying || !email || !password}>
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
