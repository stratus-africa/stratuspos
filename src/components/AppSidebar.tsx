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
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
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
import { Badge } from "@/components/ui/badge";

type AppRole = "admin" | "manager" | "cashier";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles: AppRole[];
}

const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { title: "POS", url: "/pos", icon: ShoppingCart, roles: ["admin", "manager", "cashier"] },
];

const inventoryNav: NavItem[] = [
  { title: "Products", url: "/products", icon: Package, roles: ["admin", "manager"] },
  { title: "Inventory", url: "/inventory", icon: Warehouse, roles: ["admin", "manager"] },
];

const transactionNav: NavItem[] = [
  { title: "Sales", url: "/sales", icon: Receipt, roles: ["admin", "manager"] },
  { title: "Purchases", url: "/purchases", icon: TruckIcon, roles: ["admin", "manager"] },
  { title: "Expenses", url: "/expenses", icon: CreditCard, roles: ["admin"] },
];

const reportNav: NavItem[] = [
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { business, userRole } = useBusiness();
  const currentPath = location.pathname;

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => userRole && item.roles.includes(userRole));

  const renderNav = (items: NavItem[], label: string) => {
    const filtered = filterByRole(items);
    if (filtered.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.map((item) => (
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
  };

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
        {!collapsed && userRole && (
          <div className="px-2 pb-1">
            <Badge variant="outline" className="text-xs capitalize w-full justify-center">
              {userRole}
            </Badge>
          </div>
        )}
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
