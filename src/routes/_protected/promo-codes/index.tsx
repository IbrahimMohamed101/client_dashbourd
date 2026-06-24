import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader } from "@/components/global/loader";
import { PromoCodesTable } from "@/components/pages/promo-codes/PromoCodesTable";
import { getPromoCodeStatus } from "@/components/pages/promo-codes/promo-codes-columns";
import { getPromoCodesSectionCards } from "@/constants/SectionCardsData";
import { promoCodesListQueryOptions } from "@/hooks/usePromoCodesQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { SectionCards } from "@/components/custom/section-cards";
import type { PromoCodeDTO } from "@/types/financeTypes";

export const Route = createFileRoute("/_protected/promo-codes/")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(promoCodesListQueryOptions(false)),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل أكواد الخصم..." />
  ),
});

function RouteComponent() {
  const { data: promoResponse } = useSuspenseQuery(
    promoCodesListQueryOptions(false)
  );
  const promos = promoResponse?.data || [];
  const promoSummary = {
    totalPromoCodes: promos.length,
    activePromoCodes: promos.filter(
      (promo: PromoCodeDTO) => getPromoCodeStatus(promo.state) === "active"
    ).length,
    totalUses: promos.reduce(
      (acc: number, curr: PromoCodeDTO) =>
        acc + (curr.currentUsageCount ?? curr.usedCount ?? 0),
      0
    ),
  };

  return (
    <div className="space-y-8 px-4 lg:px-6">
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background text-foreground shadow-none">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner">
              <Ticket className="size-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">
                أكواد الخصم والعروض
              </h1>
              <p className="text-sm text-muted-foreground">
                إدارة كوبونات الاشتراكات، حدود الاستخدام، الأرشفة ومعاينة التحقق من الخصم.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:border-r sm:pr-6">
            <div className="text-center sm:text-right">
              <p className="text-3xl font-black text-primary">
                {promos.length}
              </p>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                إجمالي الأكواد
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionCards
        cardsData={getPromoCodesSectionCards(promoSummary)}
        className="px-0!"
      />

      <PromoCodesTable />
    </div>
  );
}