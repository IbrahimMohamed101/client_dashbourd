import { createFileRoute } from "@tanstack/react-router";
import { PosCatalogManager } from "@/features/pos/PosCatalogManager";

// D-098: menu preparation is available to authorized roles before financial activation.
export const Route = createFileRoute("/_protected/pos/menu")({ component: PosCatalogManager });
