import { createFileRoute } from "@tanstack/react-router";
import {
  addonPlanPricesQueryOptions,
  addonPlansQueryOptions,
  addonsQueryOptions,
} from "@/hooks/useAddonsQuery";
import { Loader } from "@/components/global/loader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AddonsTable } from "@/components/pages/addons/addons-table";
import { Card, CardContent } from "@/components/ui/card";
import { PlusSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Addon, AddonPlanPrice } from "@/types/addonTypes";

export const Route = createFileRoute("/_protected/addons/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(addonsQueryOptions()),
      context.queryClient.ensureQueryData(addonPlansQueryOptions()),
      context.queryClient.ensureQueryData(addonPlanPricesQueryOptions()),
    ]);
  },
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل الإضافات..." />
  ),
});

function RouteComponent() {
  const { data: addonsResponse } = useSuspenseQuery(
    addonsQueryOptions()
  );
  const { data: plansResponse } = useSuspenseQuery(addonPlansQueryOptions());
  const { data: pricesResponse } = useSuspenseQuery(
    addonPlanPricesQueryOptions()
  );

  const addons = addonsResponse?.data || [];
  const plans = plansResponse?.data || [];
  const prices = pricesResponse?.data || [];

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card className="bg-linear-to-br from-primary/10 via-background to-background text-foreground shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner">
                <PlusSquare className="size-6 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">
                  الإضافات (Addons)
                </h2>
                <p className="text-sm text-muted-foreground">
                  إدارة الإضافات واشتراكات المشروبات
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:border-r sm:pr-6">
              <div className="text-center sm:text-right">
                <p className="text-3xl font-black text-primary">
                  {addons.length}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  إجمالي الإضافات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <AddonsTable data={addons} />
      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <AddonPlansPanel plans={plans} />
        <AddonPricesPanel prices={prices} />
      </div>
    </>
  );
}

function localizedName(value?: { ar?: string; en?: string } | null) {
  return value?.ar || value?.en || "-";
}

function addonId(addon: Addon) {
  return addon.id || addon._id;
}

function AddonPlansPanel({ plans }: { plans: Addon[] }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <h3 className="font-semibold">Addon subscription plans</h3>
          <p className="text-sm text-muted-foreground">
            Backend list from /api/dashboard/addon-plans.
          </p>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No addon plans returned.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Max/day</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={addonId(plan)}>
                  <TableCell>{localizedName(plan.name)}</TableCell>
                  <TableCell>{plan.billingMode || "-"}</TableCell>
                  <TableCell>{plan.maxPerDay ?? "-"}</TableCell>
                  <TableCell>{plan.isActive ? "Active" : "Inactive"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AddonPricesPanel({ prices }: { prices: AddonPlanPrice[] }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <h3 className="font-semibold">Pricing matrix</h3>
          <p className="text-sm text-muted-foreground">
            Backend list from /api/dashboard/addon-prices.
          </p>
        </div>
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pricing matrix rows returned.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Addon plan</TableHead>
                <TableHead>Base plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((price) => (
                <TableRow key={price.id || price._id}>
                  <TableCell>{localizedName(price.addonPlanName)}</TableCell>
                  <TableCell>{localizedName(price.basePlanName)}</TableCell>
                  <TableCell>
                    {price.priceLabel || price.priceSar || price.priceHalala}
                  </TableCell>
                  <TableCell>
                    {price.isActive ? "Active" : "Inactive"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
