import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { useBusiness } from "@/contexts/BusinessContext";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

function MasqueradeBanner() {
  const { isMasquerading, business, stopMasquerade } = useBusiness();
  if (!isMasquerading) return null;

  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between text-sm text-amber-800">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          Viewing as <strong>{business?.name}</strong> (masquerade mode)
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={stopMasquerade} className="text-amber-800 hover:text-amber-900 hover:bg-amber-200 h-7 px-2">
        <X className="h-3 w-3 mr-1" /> Exit
      </Button>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MasqueradeBanner />
          <TopBar />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
