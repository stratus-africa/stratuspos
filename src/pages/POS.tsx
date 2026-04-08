import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const POS = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Point of Sale</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> POS Terminal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">POS screen coming soon. Add products first to start selling.</p>
      </CardContent>
    </Card>
  </div>
);

export default POS;
