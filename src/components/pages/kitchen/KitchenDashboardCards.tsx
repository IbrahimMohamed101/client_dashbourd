import React from "react";
import type { KitchenSummaryData, KitchenTabsCounts, KitchenSubscriptionFilters } from "@/types/kitchenTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  Lock,
  Clock,
  PackageCheck,
  Truck,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface KitchenDashboardCardsProps {
  summary?: KitchenSummaryData;
  tabs?: KitchenTabsCounts;
  filters?: KitchenSubscriptionFilters;
  isLoading: boolean;
}

export const KitchenDashboardCards: React.FC<KitchenDashboardCardsProps> = ({
  summary,
  tabs,
  isLoading,
}) => {
  if (isLoading || !summary) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "اشتراكات اليوم",
      value: summary.subscriptionsToday,
      icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
      color: "border-l-blue-500",
    },
    {
      title: "الأيام المقفولة",
      value: summary.lockedDays,
      icon: <Lock className="h-5 w-5 text-slate-500" />,
      color: "border-l-slate-500",
    },
    {
      title: "قيد التحضير",
      value: summary.inPreparation,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: "border-l-amber-500",
    },
    {
      title: "جاهز للاستلام",
      value: summary.readyForPickup,
      icon: <PackageCheck className="h-5 w-5 text-green-500" />,
      color: "border-l-green-500",
    },
    {
      title: "خرج للتوصيل",
      value: summary.outForDelivery,
      icon: <Truck className="h-5 w-5 text-indigo-500" />,
      color: "border-l-indigo-500",
    },
    {
      title: "الطلبات الفردية",
      value: summary.individualOrders,
      icon: <ShoppingBag className="h-5 w-5 text-purple-500" />,
      color: "border-l-purple-500",
    },
    {
      title: "تم الاستلام اليوم",
      value: summary.receivedToday,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      color: "border-l-emerald-500",
    },
    {
      title: "لم يُحضّر",
      value: summary.notPrepared,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      color: "border-l-red-500",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx} className={`border-l-4 ${card.color} flex flex-col justify-between`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {tabs && idx === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                فردية: {tabs.individualOrders} · فرع: {tabs.branchPickup}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
