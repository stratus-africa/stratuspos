import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  TruckIcon,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "POS", url: "/pos", icon: ShoppingCart },
];

const inventoryNav = [
  { title: "Products", url: "/products", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
];

const transactionNav = [
  { title: "Sales", url: "/sales", icon: Receipt },
  { title: "Purchases", url: "/purchases", icon: TruckIcon },
  { title: "Expenses", url: "/expenses", icon: CreditCard },
];

const reportNav = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { business } = useBusiness();
  const currentPath = location.pathname;

  const renderNav = (items: typeof mainNav, label: string) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={currentPath === item.url}>
                <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">RetailPOS</span>
              {business && (
                <span className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">
                  {business.name}
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderNav(mainNav, "Main")}
        {renderNav(inventoryNav, "Inventory")}
        {renderNav(transactionNav, "Transactions")}
        {renderNav(reportNav, "System")}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
