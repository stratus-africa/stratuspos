import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Monitor } from "lucide-react";

interface Till {
  id: string;
  business_id: string;
  location_id: string | null;
  name: string;
  is_active: boolean;
}

export function TillsTab() {
  const { business, locations, userRole } = useBusiness();
  const isAdmin = userRole === "admin";
  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [locId, setLocId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<Map<string, string[]>>(new Map());

  const fetchTills = async () => {
    if (!business) return;
    setLoading(true);
    const [tillsRes, rolesRes, profilesRes] = await Promise.all([
      supabase.from("tills" as any).select("*").eq("business_id", business.id).order("name"),
      supabase.from("user_roles").select("user_id, till_id").eq("business_id", business.id),
      supabase.from("profiles").select("id, full_name, email").eq("business_id", business.id),
    ]);
    setTills(((tillsRes.data || []) as any) as Till[]);

    // Build till -> user names map
    const profMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.full_name || p.email || "User"]));
    const map = new Map<string, string[]>();
    ((rolesRes.data || []) as any[]).forEach((r) => {
      if (r.till_id) {
        const arr = map.get(r.till_id) || [];
        arr.push(profMap.get(r.user_id) || "User");
        map.set(r.till_id, arr);
      }
    });
    setAssignments(map);
    setLoading(false);
  };

  useEffect(() => { fetchTills(); }, [business?.id]);

  const create = async () => {
    if (!business || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tills" as any).insert({
      business_id: business.id,
      location_id: locId || null,
      name: name.trim(),
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Till created"); setOpen(false); setName(""); setLocId(""); fetchTills(); }
    setSaving(false);
  };

  const toggleActive = async (t: Till) => {
    await supabase.from("tills" as any).update({ is_active: !t.is_active } as any).eq("id", t.id);
    fetchTills();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this till? Assigned users will be unassigned.")) return;
    await supabase.from("user_roles").update({ till_id: null } as any).eq("till_id", id);
    await supabase.from("tills" as any).delete().eq("id", id);
    toast.success("Till deleted");
    fetchTills();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Tills / Registers</CardTitle>
          <CardDescription>Define point-of-sale tills and assign cashiers in the Users tab.</CardDescription>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Till</Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Assigned Users</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-[120px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : tills.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tills yet. Add one to start assigning cashiers.</TableCell></TableRow>
            ) : tills.map((t) => {
              const loc = locations.find((l) => l.id === t.location_id);
              const users = assignments.get(t.id) || [];
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{loc?.name || "—"}</TableCell>
                  <TableCell>
                    {users.length === 0 ? (
                      <span className="text-muted-foreground text-sm">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {users.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => isAdmin && toggleActive(t)} disabled={!isAdmin}>
                      <Badge variant="outline" className={t.is_active ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-muted-foreground"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Till</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Till 1, Front Counter, etc." />
            </div>
            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Select value={locId} onValueChange={setLocId}>
                <SelectTrigger><SelectValue placeholder="Any location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
