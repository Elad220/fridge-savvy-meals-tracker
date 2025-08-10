import { NavLink, useLocation } from "react-router-dom";
import { Boxes, CalendarRange, Settings as SettingsIcon, LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeTab = (params.get("tab") || "inventory") as "inventory" | "meals" | "settings";
  const { state } = useSidebar();

  const items = [
    { title: "Dashboard", url: "/?tab=inventory", icon: LayoutDashboard },
    { title: "Inventory", url: "/?tab=inventory", icon: Boxes },
    { title: "Meal Planning", url: "/?tab=meals", icon: CalendarRange },
    { title: "Settings", url: "/?tab=settings", icon: SettingsIcon },
  ];

  const isActiveUrl = (url: string) => {
    const tab = new URLSearchParams(url.split("?")[1]).get("tab");
    const normalized = tab || "inventory";
    return normalized === activeTab;
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={() => getNavCls({ isActive: isActiveUrl(item.url) })}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
