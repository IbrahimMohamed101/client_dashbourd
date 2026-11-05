import { createFileRoute } from "@tanstack/react-router";
import { PosCatalogManager } from "@/features/pos/PosCatalogManager";

export const Route = createFileRoute("/_protected/pos/menu")({
  component: PosCatalogManager,
});
