import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  GraduationCap,
  Settings,
  LogOut,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

const navigationItems = {
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Employees", url: "/employees", icon: Users },
    { title: "Recruitment", url: "/recruitment", icon: Briefcase },
    { title: "Analytics", url: "/analytics", icon: TrendingUp },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  manager: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Team", url: "/team", icon: Users },
    { title: "Performance", url: "/performance", icon: TrendingUp },
    { title: "Development", url: "/development", icon: GraduationCap },
  ],
  recruiter: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Job Postings", url: "/jobs", icon: Briefcase },
    { title: "Candidates", url: "/candidates", icon: Users },
    { title: "AI Screening", url: "/screening", icon: MessageSquare },
  ],
  employee: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Development", url: "/my-development", icon: GraduationCap },
    { title: "Performance", url: "/my-performance", icon: TrendingUp },
    { title: "Documents", url: "/documents", icon: FileText },
  ],
};

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const items = navigationItems[user?.role || "employee"];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <h2 className="text-lg font-bold gradient-text">AuraHR</h2>
            <p className="text-xs text-sidebar-foreground/60">
              AI-Powered HRMS
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-semibold">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
