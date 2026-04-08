import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

const Products = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Products</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" /> Product Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Product catalog coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Products;
