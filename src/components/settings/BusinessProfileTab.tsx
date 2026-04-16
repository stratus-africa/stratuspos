import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Building2, Phone, Mail, MapPin, FileText, UserCheck } from "lucide-react";

export function BusinessProfileTab() {
  const { business, refreshBusiness } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(business?.name || "");
  const [currency, setCurrency] = useState(business?.currency || "KES");
  const [taxRate, setTaxRate] = useState(String(business?.tax_rate ?? 16));
  const [timezone, setTimezone] = useState(business?.timezone || "Africa/Nairobi");
  const [phone, setPhone] = useState((business as any)?.phone || "");
  const [email, setEmail] = useState((business as any)?.email || "");
  const [address, setAddress] = useState((business as any)?.address || "");
  const [kraPin, setKraPin] = useState((business as any)?.kra_pin || "");
  const [vatEnabled, setVatEnabled] = useState((business as any)?.vat_enabled ?? true);
  const [accountantName, setAccountantName] = useState((business as any)?.accountant_name || "");
  const [accountantEmail, setAccountantEmail] = useState((business as any)?.accountant_email || "");
  const [accountantPhone, setAccountantPhone] = useState((business as any)?.accountant_phone || "");

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        currency,
        tax_rate: parseFloat(taxRate) || 0,
        timezone,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        kra_pin: kraPin.trim() || null,
        vat_enabled: vatEnabled,
        accountant_name: accountantName.trim() || null,
        accountant_email: accountantEmail.trim() || null,
        accountant_phone: accountantPhone.trim() || null,
      } as any)
      .eq("id", business.id);

    if (error) {
      toast.error("Failed to update business: " + error.message);
    } else {
      toast.success("Business profile updated");
      await refreshBusiness();
    }
    setSaving(false);
  };

  if (!business) return null;

  return (
    <div className="space-y-6">
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>Core business details and branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz-name">Business Name</Label>
              <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-kra">KRA PIN</Label>
              <Input id="biz-kra" value={kraPin} onChange={(e) => setKraPin(e.target.value)} placeholder="e.g. P051234567X" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="biz-phone" className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="biz-email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@business.co.ke" />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="biz-address">Business Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea id="biz-address" className="pl-9 min-h-[60px]" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, Building, City" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax & Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="biz-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                  <SelectItem value="UGX">UGX — Ugandan Shilling</SelectItem>
                  <SelectItem value="TZS">TZS — Tanzanian Shilling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-tz">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="biz-tz"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">VAT Enabled</Label>
              <p className="text-sm text-muted-foreground">Enable or disable VAT charging for this organization</p>
            </div>
            <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
          </div>

          {vatEnabled && (
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="biz-tax">Default Tax Rate (%)</Label>
              <Input
                id="biz-tax"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accountant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Accountant
          </CardTitle>
          <CardDescription>Add your accountant's contact information for reference and reporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Accountant Name</Label>
              <Input value={accountantName} onChange={(e) => setAccountantName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Accountant Email</Label>
              <Input value={accountantEmail} onChange={(e) => setAccountantEmail(e.target.value)} placeholder="accountant@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Accountant Phone</Label>
              <Input value={accountantPhone} onChange={(e) => setAccountantPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
