import {
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

type NavItem = { title: string; url: string; icon?: React.ReactNode };
const GROUPS = [
  { title: "الرئيسية", paths: ["/dashboard"] },
  { title: "العمليات", paths: ["/operations", "/daily-closing", "/manual-deduction", "/delivery", "/one-time-orders"] },
  { title: "المالية", paths: ["/payments", "/accounting", "/subscription-audit", "/promo-codes"] },
  { title: "العملاء والتقارير", paths: ["/customer-management", "/retention-reports", "/users", "/landing-leads", "/subscriptions"] },
  { title: "المنتجات والخدمات", paths: ["/menu", "/packages", "/premium-meals", "/addons", "/zones"] },
  { title: "الإدارة", paths: ["/dashboard-users"] },
] as const;

export function NavMain({ items }: { items: NavItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => { if (isMobile) setOpenMobile(false); };
  const shown = (paths: readonly string[]) => items.filter((item) => paths.includes(item.url));
  const uncategorized = items.filter((item) => !GROUPS.some((group) => group.paths.some((path) => path === item.url)));
  return <>
    {[...GROUPS.map((group) => ({ title: group.title, items: shown(group.paths) })),
      { title: "أخرى", items: uncategorized }].filter((group) => group.items.length).map((group) => (
      <SidebarGroup key={group.title}>
        <SidebarGroupLabel className="text-xs font-semibold">{group.title}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <Link to={item.url} onClick={closeMobile} activeProps={{ className: "bg-primary block rounded-md text-background dark:text-foreground" }}>
                  <SidebarMenuButton tooltip={item.title} className="transition-colors hover:bg-primary hover:text-white">
                    {item.icon}<span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ))}
  </>;
}
