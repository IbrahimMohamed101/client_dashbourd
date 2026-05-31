import { createFileRoute } from "@tanstack/react-router";
import OperationsBoard from "@/components/pages/operations-board/OperationsBoard";

export const Route = createFileRoute("/_protected/operations/")({
  validateSearch: (search: Record<string, unknown>) => {
    const tab = typeof search.tab === "string" ? search.tab : undefined;
    return {
      tab: ["kitchen", "pickup", "courier"].includes(tab || "")
        ? tab
        : undefined,
    };
  },
  component: OperationsBoard,
});
