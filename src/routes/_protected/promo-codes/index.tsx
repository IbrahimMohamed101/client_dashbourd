import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader } from "@/components/global/loader";
import { PromoCodesTable } from "@/components/pages/promo-codes/PromoCodesTable";
import { PromoCodesDashboardCharts } from "@/components/pages/promo-codes/PromoCodesDashboardCharts";
import { promoCodesListQueryOptions } from "@/hooks/usePromoCodesQuery";
import { BadgePercent, Ticket } from "lucide-react";

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

  return (
    <div
      className="flex min-h-[calc(100vh-5rem)] flex-col gap-4 px-4 pb-4 lg:px-6"
      dir="rtl"
    >
      <div className="flex flex-col gap-3 rounded-xl border border-muted-foreground/10 bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-inner">
            <Ticket className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight">
              أكواد الخصم والعروض
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              متابعة الصلاحية والاستخدام ونطاق التطبيق، مع أدوات سريعة للإنشاء
              والتعديل والتحقق.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-64">
          <div className="rounded-xl bg-primary/10 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              إجمالي الأكواد
            </p>
            <p className="mt-1 text-2xl font-black text-primary">
              {promos.length.toLocaleString("ar-SA")}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              لوحة الخصومات
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold">
              <BadgePercent className="size-4 text-primary" />
              جاهزة للإدارة
            </p>
          </div>
        </div>
      </div>

      <PromoCodesDashboardCharts promos={promos} />

      <PromoCodesTable />
    </div>
  );
}
