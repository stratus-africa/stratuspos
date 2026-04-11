import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BusinessProvider, useBusiness } from "@/contexts/BusinessContext";
import { AppLayout } from "@/components/AppLayout";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
    <p className="text-muted-foreground">You don't have permission to view this page.</p>
  </div>
);

const ProtectedRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: bizLoading, hasAccess } = useBusiness();

  if (authLoading || bizLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (needsOnboarding) return <Onboarding />;

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
        <Route path="/reports" element={guard(["admin"], <Reports />)} />
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
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
