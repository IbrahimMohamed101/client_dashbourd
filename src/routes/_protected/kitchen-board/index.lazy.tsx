import { createLazyFileRoute } from "@tanstack/react-router";
import KitchenBoard from "@/components/pages/kitchen-board/KitchenBoard";

export const Route = createLazyFileRoute("/_protected/kitchen-board/")({
  component: KitchenBoard,
});
