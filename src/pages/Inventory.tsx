import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse } from "lucide-react";

const Inventory = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Inventory</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" /> Stock Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Inventory management coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Inventory;
