import { NavMain } from "@/components/layout/nav-main";
import { useQuery } from "@tanstack/react-query";
import { posRuntimeStatusOptions } from "@/features/pos/posRuntimeStatus";
import { NavSecondary } from "@/components/layout/nav-secondary";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLinksData } from "@/constants/NavLinksData";
import { useAuth } from "@/hooks/useAuth";
import { filterNavItemsForRole } from "@/lib/navPermissions";
import type { UserRole } from "@/types/auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const posStatus = useQuery({ ...posRuntimeStatusOptions, enabled: Boolean(user) });
  const filterDisabledPos = <T extends { url: string }>(items: T[]): T[] =>
    items.filter((item) => item.url !== "/pos" && item.url !== "/pos/" || posStatus.data?.enabled === true);
  const navMain = filterDisabledPos(filterNavItemsForRole(NavLinksData.navMain, user?.role as UserRole | undefined));
  const navSecondary = filterDisabledPos([
    ...filterNavItemsForRole(
      NavLinksData.navSecondary.filter((item) => item.url !== "#"),
      user?.role as UserRole | undefined
    ),
    ...NavLinksData.navSecondary.filter((item) => item.url === "#"),
  ]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <div className="gap-3 hover:bg-transparent">
                <img src="/logo.png" alt="شعار بيسك دايت" className="h-8 w-8 object-contain" />
                <span className="text-base font-bold text-primary dark:text-foreground">
                  بيسك دايت
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
