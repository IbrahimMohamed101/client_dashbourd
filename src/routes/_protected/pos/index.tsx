import { createFileRoute } from "@tanstack/react-router";
import { PosSalePage } from "@/features/pos/PosSalePage";

export const Route = createFileRoute("/_protected/pos/")({
  component: PosSalePage,
});
