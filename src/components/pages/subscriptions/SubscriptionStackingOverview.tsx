import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Subscription } from "@/types/subscriptionTypes";
import type {
  SubscriptionStackingPackage,
  SubscriptionStackingPayment,
} from "@/types/subscriptionStackingTypes";
import { CreditCard, Layers3 } from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("ar-EG");
}

function formatMoney(payment: SubscriptionStackingPayment) {
  return `${(Number(payment.amountHalala || 0) / 100).toFixed(2)} ${payment.currency || "SAR"}`;
}

function sourceLabel(item: SubscriptionStackingPackage) {
  if (item.isLegacyPackage) return "الباقة الأصلية";
  if (item.sourceType === "renewal") return "تجديد مدفوع";
  return "شراء إضافي";
}

function PackageCard({ item }: { item: SubscriptionStackingPackage }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{item.planName || "باقة محفوظة"}</p>
          <p className="text-xs text-muted-foreground">{sourceLabel(item)}</p>
        </div>
        <Badge variant={item.status === "active" ? "default" : "secondary"}>
          {item.status === "active" ? "نشطة" : item.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div><span className="text-muted-foreground">الجرامات</span><p className="font-medium">{item.proteinGrams}g</p></div>
        <div><span className="text-muted-foreground">يومياً</span><p className="font-medium">{item.mealsPerDay} وجبة</p></div>
        <div><span className="text-muted-foreground">المتبقي</span><p className="font-medium">{item.remainingMeals}/{item.totalMeals}</p></div>
        <div><span className="text-muted-foreground">الأيام</span><p className="font-medium">{item.daysCount}</p></div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>من {formatDate(item.effectiveStartDate)}</span>
        <span>إلى {formatDate(item.validityEndDate)}</span>
      </div>
    </div>
  );
}

export function SubscriptionStackingOverview({
  subscription,
  compact = false,
}: {
  subscription: Subscription;
  compact?: boolean;
}) {
  const stacking = subscription.stacking;
  if (!stacking?.hasEntitlementBatches) return null;

  return (
    <Card className="border-blue-500/30 bg-blue-500/[0.03] shadow-none">
      <CardHeader className={compact ? "p-4 pb-2" : undefined}>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Layers3 className="h-4 w-4 text-blue-600" />
          الحزم المكوّنة للاشتراك
          <Badge variant="outline">{stacking.packageCount} باقة</Badge>
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          رقم الاشتراك يمثل الحاوية التشغيلية. الجرامات والفترة وسجل الدفع موضحة لكل باقة أدناه.
        </p>
      </CardHeader>
      <CardContent className={`space-y-4 ${compact ? "p-4 pt-2" : ""}`}>
        <div className={compact ? "space-y-3" : "grid gap-3 xl:grid-cols-2"}>
          {stacking.packages.map((item) => (
            <PackageCard key={item.id} item={item} />
          ))}
        </div>

        {stacking.transactions.length > 0 ? (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              معاملات الشراء
            </div>
            <div className="grid gap-2 xl:grid-cols-2">
              {stacking.transactions.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{formatMoney(payment)}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method || payment.provider || "دفع"} · {formatDate(payment.paidAt || payment.createdAt)}
                    </p>
                  </div>
                  <div className="text-left" dir="ltr">
                    <Badge variant="secondary">{payment.status || "—"}</Badge>
                    {payment.providerReference ? (
                      <p className="mt-1 text-xs text-muted-foreground">{payment.providerReference}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
