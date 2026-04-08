import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

const SettingsPage = () => {
  const { business } = useBusiness();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Business Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Business:</span>{" "}
            <span className="font-medium">{business?.name}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Currency:</span>{" "}
            <span className="font-medium">{business?.currency}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Tax Rate:</span>{" "}
            <span className="font-medium">{business?.tax_rate}%</span>
          </div>
          <p className="text-muted-foreground text-sm pt-2">Full settings management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
