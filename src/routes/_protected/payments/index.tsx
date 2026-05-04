import { SectionCards } from "@/components/custom/section-cards";
import { getFinanceSectionCards } from "@/constants/SectionCardsData";
import { createFileRoute } from "@tanstack/react-router";
import { paymentsListQueryOptions } from "@/hooks/usePaymentsQuery";
import { Loader } from "@/components/global/loader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PaymentsTable } from "@/components/pages/payments/PaymentsTable";
import type { PaymentsResponse } from "@/types/paymentTypes";

export const Route = createFileRoute("/_protected/payments/")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(paymentsListQueryOptions(1, 20)),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل المدفوعات..." />
  ),
});

function RouteComponent() {
  const { data: paymentsResponse } = useSuspenseQuery(
    paymentsListQueryOptions(1, 20)
  );

  const typedResponse = paymentsResponse as PaymentsResponse;
  const payments = typedResponse?.data || [];
  const meta = typedResponse?.meta;

  const financeSummary = {
    totalRevenue: payments
      .filter((p) => p.status === "paid" || p.status === "completed")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0),
    totalPayments: meta?.total || 0,
    pendingPayments: payments.filter((p) => p.status === "pending").length,
    failedPayments: payments.filter((p) => p.status === "failed").length,
  };

  const cardsData = getFinanceSectionCards(financeSummary);

  return (
    <>
      <SectionCards cardsData={cardsData} />
      <PaymentsTable />
    </>
  );
}
