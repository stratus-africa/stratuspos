import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Reports = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Reports</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Business Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Reports & analytics coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Reports;
