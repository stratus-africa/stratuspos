import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, Loader2, GripVertical } from "lucide-react";

interface LandingSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  sort_order: number;
  is_visible: boolean;
}

const DEFAULT_SECTIONS = [
  { section_key: "hero", title: "The Modern POS for", subtitle: "Growing Businesses", content: { badge: "🇰🇪 Built for Kenyan Retail", description: "Manage sales, inventory, expenses, and team — all in one place. Accept M-Pesa, track stock across locations, and grow with confidence.", cta_primary: "Start Free Trial", cta_secondary: "View Pricing" } },
  { section_key: "features", title: "Everything You Need to Run Your Shop", subtitle: "Powerful tools designed for Kenyan retail businesses", content: { items: [
    { icon: "ShoppingCart", title: "Point of Sale", description: "Fast, intuitive checkout with barcode scanning and M-Pesa support." },
    { icon: "Package", title: "Inventory Management", description: "Track stock across locations with low-stock alerts and barcode scanning." },
    { icon: "BarChart3", title: "Reports & Analytics", description: "Real-time dashboards, profit & loss, and sales trends." },
    { icon: "Users", title: "Team Management", description: "Role-based access for admins, managers, and cashiers." },
    { icon: "Shield", title: "Multi-Location", description: "Manage multiple stores from a single dashboard." },
    { icon: "Smartphone", title: "Mobile Ready", description: "Works on any device — desktop, tablet, or phone." },
    { icon: "TrendingUp", title: "Banking & Expenses", description: "Track bank accounts, expenses, and purchase orders." },
    { icon: "Store", title: "Tax Management", description: "Configure VAT rates, zero-rated, and exempt items." },
  ]}},
  { section_key: "cta", title: "Ready to Transform Your Business?", subtitle: "Join hundreds of Kenyan retailers using StratusPOS. Start your free trial today.", content: { button_text: "Get Started Free" } },
  { section_key: "testimonials", title: "What Our Customers Say", subtitle: "", content: { items: [] } },
  { section_key: "faq", title: "Frequently Asked Questions", subtitle: "", content: { items: [] } },
];

export default function SuperAdminLanding() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<LandingSection | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSections = async () => {
    const { data } = await supabase
      .from("landing_content" as any)
      .select("*")
      .order("sort_order");
    setSections((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSections(); }, []);

  const seedDefaults = async () => {
    setSaving(true);
    for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
      const s = DEFAULT_SECTIONS[i];
      await (supabase.from("landing_content" as any) as any).upsert({
        section_key: s.section_key,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
        sort_order: i,
        is_visible: true,
      }, { onConflict: "section_key" });
    }
    toast.success("Default sections created");
    await fetchSections();
    setSaving(false);
  };

  const toggleVisibility = async (section: LandingSection) => {
    await (supabase.from("landing_content" as any) as any)
      .update({ is_visible: !section.is_visible })
      .eq("id", section.id);
    fetchSections();
  };

  const deleteSection = async (id: string) => {
    await (supabase.from("landing_content" as any) as any).delete().eq("id", id);
    toast.success("Section deleted");
    fetchSections();
  };

  const handleSaveEdit = async () => {
    if (!editSection) return;
    setSaving(true);
    const { error } = await (supabase.from("landing_content" as any) as any)
      .update({
        title: editSection.title,
        subtitle: editSection.subtitle,
        content: editSection.content,
        sort_order: editSection.sort_order,
      })
      .eq("id", editSection.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Section updated");
      setEditOpen(false);
      fetchSections();
    }
    setSaving(false);
  };

  const addSection = async () => {
    const key = `custom_${Date.now()}`;
    await (supabase.from("landing_content" as any) as any).insert({
      section_key: key,
      title: "New Section",
      subtitle: "",
      content: { items: [] },
      sort_order: sections.length,
      is_visible: false,
    });
    toast.success("Section added");
    fetchSections();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Page CMS</h1>
          <p className="text-muted-foreground">Manage the content displayed on the public landing page.</p>
        </div>
        <div className="flex gap-2">
          {sections.length === 0 && (
            <Button variant="outline" onClick={seedDefaults} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Seed Defaults
            </Button>
          )}
          <Button onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{s.sort_order}</TableCell>
                  <TableCell className="font-mono text-xs">{s.section_key}</TableCell>
                  <TableCell>{s.title || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => toggleVisibility(s)}>
                      {s.is_visible ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditSection({ ...s }); setEditOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSection(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No sections yet. Click "Seed Defaults" to create the standard landing page sections.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section: {editSection?.section_key}</DialogTitle>
          </DialogHeader>
          {editSection && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editSection.title || ""} onChange={(e) => setEditSection({ ...editSection, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={editSection.sort_order} onChange={(e) => setEditSection({ ...editSection, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={editSection.subtitle || ""} onChange={(e) => setEditSection({ ...editSection, subtitle: e.target.value })} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Content (JSON)</Label>
                <Textarea
                  className="font-mono text-xs min-h-[200px]"
                  value={JSON.stringify(editSection.content, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditSection({ ...editSection, content: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                />
                <p className="text-xs text-muted-foreground">Edit the JSON content for this section. Changes will appear on the landing page.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
