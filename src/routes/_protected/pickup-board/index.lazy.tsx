import { createLazyFileRoute } from "@tanstack/react-router";
import { PickupBoard } from "@/components/pages/pickup-board/PickupBoard";

export const Route = createLazyFileRoute("/_protected/pickup-board/")({
  component: PickupBoard,
});
