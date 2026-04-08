import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const Expenses = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Expenses</h1>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Expense Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Expense tracking coming soon.</p>
      </CardContent>
    </Card>
  </div>
);

export default Expenses;
