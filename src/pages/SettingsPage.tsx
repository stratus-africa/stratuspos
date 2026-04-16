import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Users, Receipt, CreditCard, ShieldCheck, Percent, Wallet } from "lucide-react";
import { BusinessProfileTab } from "@/components/settings/BusinessProfileTab";
import { LocationsTab } from "@/components/settings/LocationsTab";
import { UserManagementTab } from "@/components/settings/UserManagementTab";
import { ReceiptSettingsTab } from "@/components/settings/ReceiptSettingsTab";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";
import { RolesPermissionsTab } from "@/components/settings/RolesPermissionsTab";
import { TaxSettingsTab } from "@/components/settings/TaxSettingsTab";
import { PaymentAccountsTab } from "@/components/settings/PaymentAccountsTab";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useSearchParams } from "react-router-dom";

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "business";

  return (
    <div className="space-y-4">
      <PaymentTestModeBanner />
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue={defaultTab} orientation="vertical" className="flex gap-6">
        <TabsList className="text-muted-foreground flex-col h-auto w-52 bg-muted rounded-lg p-1.5 shrink-0 flex items-start justify-start">
          <TabsTrigger value="business" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="locations" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="tax" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <Percent className="h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <ShieldCheck className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="payments" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <Wallet className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="receipt" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <Receipt className="h-4 w-4" />
            Receipt
          </TabsTrigger>
          <TabsTrigger value="subscription" className="w-full justify-start gap-2 text-sm px-3 py-2.5">
            <CreditCard className="h-4 w-4" />
            Plan
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="business" className="mt-0"><BusinessProfileTab /></TabsContent>
          <TabsContent value="locations" className="mt-0"><LocationsTab /></TabsContent>
          <TabsContent value="tax" className="mt-0"><TaxSettingsTab /></TabsContent>
          <TabsContent value="users" className="mt-0"><UserManagementTab /></TabsContent>
          <TabsContent value="roles" className="mt-0"><RolesPermissionsTab /></TabsContent>
          <TabsContent value="payments" className="mt-0"><PaymentAccountsTab /></TabsContent>
          <TabsContent value="receipt" className="mt-0"><ReceiptSettingsTab /></TabsContent>
          <TabsContent value="subscription" className="mt-0"><SubscriptionTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
