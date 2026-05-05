import { createFileRoute } from "@tanstack/react-router";
import { OneTimeOrderList } from "@/components/pages/one-time-orders/OneTimeOrderList";

export const Route = createFileRoute("/_protected/one-time-orders/")({
  component: OneTimeOrderList,
});
