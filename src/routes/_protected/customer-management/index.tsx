import { createFileRoute } from "@tanstack/react-router";

import { CustomerManagementPage } from "@/features/customer-management/CustomerManagementPage";

export const Route = createFileRoute("/_protected/customer-management/")({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
  }),
  component: CustomerManagementRoute,
});

function CustomerManagementRoute() {
  const { userId } = Route.useSearch();
  return <CustomerManagementPage initialUserId={userId} />;
}
