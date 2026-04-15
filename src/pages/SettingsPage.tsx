import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Users, Receipt, CreditCard, ShieldCheck } from "lucide-react";
import { BusinessProfileTab } from "@/components/settings/BusinessProfileTab";
import { LocationsTab } from "@/components/settings/LocationsTab";
import { UserManagementTab } from "@/components/settings/UserManagementTab";
import { ReceiptSettingsTab } from "@/components/settings/ReceiptSettingsTab";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";
import { RolesPermissionsTab } from "@/components/settings/RolesPermissionsTab";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useSearchParams } from "react-router-dom";

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "business";

  return (
    <div className="space-y-4">
      <PaymentTestModeBanner />
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="business" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessProfileTab />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsTab />
        </TabsContent>
        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="roles">
          <RolesPermissionsTab />
        </TabsContent>
        <TabsContent value="receipt">
          <ReceiptSettingsTab />
        </TabsContent>
        <TabsContent value="subscription">
          <SubscriptionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
