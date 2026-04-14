import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BusinessProvider, useBusiness } from "@/contexts/BusinessContext";
import { AppLayout } from "@/components/AppLayout";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { FeatureGate } from "@/components/FeatureGate";

import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Index from "./pages/Index";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import Banking from "./pages/Banking";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminBusinesses from "./pages/super-admin/SuperAdminBusinesses";
import SuperAdminUsers from "./pages/super-admin/SuperAdminUsers";
import SuperAdminActivity from "./pages/super-admin/SuperAdminActivity";

const queryClient = new QueryClient();

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
    <p className="text-muted-foreground">You don't have permission to view this page.</p>
  </div>
);

const SuperAdminRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: saLoading } = useSuperAdmin();

  if (authLoading || saLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <SuperAdminLayout>
      <Routes>
        <Route path="/" element={<SuperAdminDashboard />} />
        <Route path="/businesses" element={<SuperAdminBusinesses />} />
        <Route path="/users" element={<SuperAdminUsers />} />
        <Route path="/activity" element={<SuperAdminActivity />} />
        <Route path="*" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SuperAdminLayout>
  );
};

const BusinessSuspended = () => {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Your business has been suspended</h2>
        <p className="text-muted-foreground mb-6">Your business account has been deactivated by the platform administrator. Please contact support for more information.</p>
        <button onClick={() => signOut()} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Sign Out</button>
      </div>
    </div>
  );
};

const ProtectedRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: bizLoading, hasAccess, userRole, isSuspended } = useBusiness();

  if (authLoading || bizLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (isSuspended) return <BusinessSuspended />;
  if (needsOnboarding) return <Onboarding />;

  // Default redirect based on role - cashiers go to POS
  if (userRole === "cashier") return <Navigate to="/pos" replace />;

  const guard = (roles: ("admin" | "manager" | "cashier")[], element: React.ReactNode) =>
    hasAccess(roles) ? element : <AccessDenied />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={guard(["admin", "manager"], <Index />)} />
        <Route path="/pos" element={guard(["admin", "manager", "cashier"], <POS />)} />
        <Route path="/products" element={guard(["admin", "manager"], <Products />)} />
        <Route path="/inventory" element={guard(["admin", "manager"], <Inventory />)} />
        <Route path="/sales" element={guard(["admin", "manager"], <Sales />)} />
        <Route path="/purchases" element={guard(["admin", "manager"], <Purchases />)} />
        <Route path="/expenses" element={guard(["admin"], <Expenses />)} />
        <Route path="/chart-of-accounts" element={guard(["admin"], <FeatureGate requiredTier="pro"><ChartOfAccounts /></FeatureGate>)} />
        <Route path="/banking" element={guard(["admin"], <FeatureGate requiredTier="pro"><Banking /></FeatureGate>)} />
        <Route path="/reports" element={guard(["admin"], <FeatureGate requiredTier="pro"><Reports /></FeatureGate>)} />
        <Route path="/settings" element={guard(["admin"], <SettingsPage />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
