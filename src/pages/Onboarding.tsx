import { useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Store, MapPin, Briefcase } from "lucide-react";
import { BUSINESS_TYPE_OPTIONS, BusinessType } from "@/lib/themes";

const Onboarding = () => {
  const { createBusiness } = useBusiness();
  const [businessName, setBusinessName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await createBusiness(businessName, locationName, businessType);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Business created successfully!");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Store className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Set Up Your Business</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Create your business to get started with StratusPOS
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name" className="flex items-center gap-2">
                  <Store className="h-4 w-4" /> Business Name
                </Label>
                <Input
                  id="business-name"
                  placeholder="e.g. Mama Njeri's Shop"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-type" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Business Type
                </Label>
                <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
                  <SelectTrigger id="business-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {businessType === "pharmacy" && (
                  <p className="text-xs text-muted-foreground">
                    Batch tracking with expiry dates (FEFO) will be enabled for your products.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-name" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> First Store/Location Name
                </Label>
                <Input
                  id="location-name"
                  placeholder="e.g. Main Branch"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Create Business"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
