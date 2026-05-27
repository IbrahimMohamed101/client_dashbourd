import { createLazyFileRoute } from "@tanstack/react-router";
import OperationsBoard from "@/components/pages/operations-board/OperationsBoard";

export const Route = createLazyFileRoute("/_protected/operations/")({
  component: OperationsBoard,
});
