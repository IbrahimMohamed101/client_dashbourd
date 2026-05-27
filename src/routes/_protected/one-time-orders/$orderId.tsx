import { createFileRoute } from "@tanstack/react-router";
import { OneTimeOrderDetail } from "@/components/pages/one-time-orders/OneTimeOrderDetail";

export const Route = createFileRoute(
  "/_protected/one-time-orders/$orderId"
)({
  component: OrderDetailRoute,
});

function OrderDetailRoute() {
  const { orderId } = Route.useParams();
  return <OneTimeOrderDetail orderId={orderId} />;
}
