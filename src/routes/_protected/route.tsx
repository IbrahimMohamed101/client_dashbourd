import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { RouteError } from "@/components/global/RouteError";
import { Loader } from "@/components/global/loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import type { AuthResponse } from "@/types/auth";
import { sessionQueryOptions } from "@/lib/authApi";
import { authMiddleware } from "@/lib/authMiddleware";

export const Route = createFileRoute("/_protected")({
  component: RouteComponent,
  beforeLoad: async ({ context, location }) => {
    const data = await context.queryClient.ensureQueryData(sessionQueryOptions);
    authMiddleware(
      data as AuthResponse,
      location.pathname,
      location.search as Record<string, string>
    );
  },
  pendingComponent: Loader,
  errorComponent: RouteError,
});

function RouteComponent() {
  const { pathname } = useLocation();
  const isPosSale = pathname === "/pos" || pathname === "/pos/";
  const [sidebarOpen, setSidebarOpen] = useState(!isPosSale);

  useEffect(() => {
    // Hide the shared dashboard sidebar by default only inside POS sales.
    setSidebarOpen(!isPosSale);
  }, [isPosSale]);

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className={isPosSale ? "h-dvh !min-h-0 overflow-hidden" : undefined}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" side="right" />
      <SidebarInset className={isPosSale ? "h-full min-h-0 overflow-hidden md:!m-0 md:!rounded-none md:!shadow-none" : undefined}>
        {!isPosSale && <SiteHeader />}
        <div className={isPosSale ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : "flex min-w-0 flex-1 flex-col"}>
          <div className={isPosSale ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : "@container/main flex min-w-0 flex-1 flex-col gap-2"}>
            <div className={isPosSale ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex flex-col gap-4 py-4 md:gap-6 md:py-6"}>
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
