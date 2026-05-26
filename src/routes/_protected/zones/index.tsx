import { createFileRoute } from "@tanstack/react-router";
import { deliveryZonesListQueryOptions } from "@/hooks/useDeliveryZonesQuery";
import { Loader } from "@/components/global/loader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ZonesTable } from "@/components/pages/zones/ZonesTable";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { DeliveryZone } from "@/types/deliveryZoneTypes";

export const Route = createFileRoute("/_protected/zones/")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(deliveryZonesListQueryOptions()),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل مناطق التوصيل..." />
  ),
});

function RouteComponent() {
  const { data: zonesResponse } = useSuspenseQuery(
    deliveryZonesListQueryOptions()
  );

  const zones = (zonesResponse?.data || []) as DeliveryZone[];
  const totalZones = zonesResponse?.meta?.totalCount ?? zones.length;
  const activeZones = zones.filter((z) => z.isActive).length;

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background text-foreground shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner">
                <MapPin className="size-6 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">
                  مناطق التوصيل
                </h2>
                <p className="text-sm text-muted-foreground">
                  إدارة مناطق ورسوم التوصيل المتاحة.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 sm:border-r sm:pr-6">
              <div className="text-center sm:text-right">
                <p className="text-3xl font-black text-primary">
                  {totalZones}
                </p>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  إجمالي المناطق
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {activeZones}
                </p>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  نشطة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ZonesTable data={zones} isLoading={false} />
    </>
  );
}
