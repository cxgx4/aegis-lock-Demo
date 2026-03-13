import { LayoutDashboard, Database, FileText, CheckCircle, Code2, Play } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Records", url: "/records", icon: Database },
  { title: "Aegis Proof", url: "/aegis-proof", icon: FileText },
  { title: "Code Showcase", url: "/code-showcase", icon: Code2 },
  { title: "Playground", url: "/playground", icon: Play },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="gradient-navy">
        <div className="px-4 py-5 flex items-center gap-2 border-b border-sidebar-border">
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">Aegis-Lock</span>
          )}
          {collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">A</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-[0.15em] uppercase">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gradient-navy border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 py-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <div className="text-[11px] leading-tight text-sidebar-foreground/60">
              <span className="text-success font-medium">Aegis-Lock:</span>{" "}
              Field-Level Encryption Active
              <br />
              <span className="font-mono text-[10px] text-sidebar-foreground/40">(AES-256-GCM)</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-3">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
