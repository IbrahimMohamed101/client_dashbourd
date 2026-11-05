import { createFileRoute } from "@tanstack/react-router";
import { PosWorkspace } from "@/features/pos/PosWorkspace";

export const Route = createFileRoute("/_protected/pos/")({
  component: PosWorkspace,
});
