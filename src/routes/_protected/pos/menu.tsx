import { createFileRoute, redirect } from "@tanstack/react-router";
import { PosCatalogManager } from "@/features/pos/PosCatalogManager";
import { posRuntimeStatusOptions } from "@/features/pos/posRuntimeStatus";
export const Route = createFileRoute("/_protected/pos/menu")({
  beforeLoad: async ({ context }) => {
    const state = await context.queryClient.ensureQueryData(posRuntimeStatusOptions);
    if (!state.enabled) throw redirect({ to: "/operations", search: { tab: undefined } });
  },
  component: PosCatalogManager,
});
