import { createLazyFileRoute } from "@tanstack/react-router";
import CourierBoard from "@/components/pages/courier-board/CourierBoard";

export const Route = createLazyFileRoute("/_protected/courier-board/")({
  component: CourierBoard,
});
