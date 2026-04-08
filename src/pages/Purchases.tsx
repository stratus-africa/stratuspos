import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruckIcon } from "lucide-react";

const Purchases = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Purchases</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5" /> Purchase Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Purchase management coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Purchases;
