import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const Sales = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Sales</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" /> Sales History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Sales history coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Sales;
