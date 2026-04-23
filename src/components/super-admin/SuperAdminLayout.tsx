import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Building2, Users, BarChart3, LogOut, ArrowLeft, Activity, Package, Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Dashboard", url: "/super-admin", icon: BarChart3 },
  { title: "Businesses", url: "/super-admin/businesses", icon: Building2 },
  { title: "Users", url: "/super-admin/users", icon: Users },
  { title: "Packages", url: "/super-admin/packages", icon: Package },
  { title: "Landing Page", url: "/super-admin/landing", icon: Globe },
  { title: "Activity", url: "/super-admin/activity", icon: Activity },
];

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const showText = isMobile ? mobileOpen : !collapsed;
  const sidebarVisible = !isMobile || mobileOpen;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile floating trigger */}
      {isMobile && !mobileOpen && (
        <Button
          size="icon"
          variant="outline"
          className="fixed top-3 left-3 z-50 h-9 w-9"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Backdrop on mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {sidebarVisible && (
        <aside
          className={cn(
            "border-r bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-200",
            isMobile ? "fixed inset-y-0 left-0 z-40 w-64" : (collapsed ? "w-14" : "w-64"),
          )}
        >
          <div className="px-3 py-4 border-b border-sidebar-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-6 w-6 text-red-400 shrink-0" />
              {showText && (
                <div className="min-w-0">
                  <span className="text-sm font-semibold block truncate">Super Admin</span>
                  <p className="text-xs text-sidebar-foreground/60 truncate">Platform Management</p>
                </div>
              )}
            </div>
            {!isMobile && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent"
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? "Expand" : "Collapse"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {isMobile && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                onClick={() => isMobile && setMobileOpen(false)}
                title={!showText ? item.title : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  location.pathname === item.url
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {showText && <span className="truncate">{item.title}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-2 border-t border-sidebar-border space-y-1">
            <Link
              to="/"
              onClick={() => isMobile && setMobileOpen(false)}
              title={!showText ? "Back to App" : undefined}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {showText && "Back to App"}
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
              title={!showText ? "Sign Out" : undefined}
            >
              <LogOut className={cn("h-4 w-4 shrink-0", showText && "mr-2")} />
              {showText && "Sign Out"}
            </Button>
          </div>
        </aside>
      )}

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
