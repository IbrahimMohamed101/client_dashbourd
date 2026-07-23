import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { EllipsisVerticalIcon, LogOutIcon, UserIcon } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "سوبر أدمن",
  admin: "مدير",
  restaurant: "المطعم",
  kitchen: "المطبخ",
  cashier: "الكاشير",
  courier: "مندوب التوصيل",
};

export function NavUser() {
  const { isMobile } = useSidebar();

  const { user, logout } = useAuth();
  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "مستخدم";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={"logo.png"} alt={roleLabel} />
                <AvatarFallback className="rounded-lg">
                  {roleLabel.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{roleLabel}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={"logo.png"} alt={roleLabel} />
                  <AvatarFallback className="rounded-lg">
                    {roleLabel.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{roleLabel}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserIcon />
                الملف الشخصي
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="transition-colors duration-200 hover:bg-destructive!"
              onClick={() => logout()}
            >
              <LogOutIcon />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
