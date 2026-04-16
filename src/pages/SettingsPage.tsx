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

const tabs = [
  { value: "business", label: "Business", icon: Building2 },
  { value: "locations", label: "Locations", icon: MapPin },
  { value: "tax", label: "Tax", icon: Percent },
  { value: "users", label: "Users", icon: Users },
  { value: "roles", label: "Roles", icon: ShieldCheck },
  { value: "payments", label: "Payments", icon: Wallet },
  { value: "receipt", label: "Receipt", icon: Receipt },
  { value: "subscription", label: "Plan", icon: CreditCard },
];

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "business";

  return (
    <div className="space-y-4">
      <PaymentTestModeBanner />
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue={defaultTab} orientation="vertical" className="flex gap-6">
        <TabsList className="flex flex-col h-auto w-48 shrink-0 bg-muted/50 p-1.5 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="w-full justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
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
