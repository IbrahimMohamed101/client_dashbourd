import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePromoCodeDetailQuery } from "@/hooks/usePromoCodesQuery";
import {
  formatAppliesTo,
  formatHalala,
  formatPromoCodeDate,
  formatPromoCodeDiscount,
  getPromoCodeName,
  getPromoCodeStatus,
  promoCodeText,
} from "./promo-codes-columns";
import { PromoDetailItem } from "./PromoDetailItem";

function formatBoolean(value: boolean | undefined) {
  return value ? "نعم" : "لا";
}

function formatUsageStatus(status: string) {
  const statusMap: Record<string, string> = {
    reserved: "محجوز",
    consumed: "مستخدم",
    cancelled: "ملغي",
  };

  return statusMap[status] ?? status;
}

export default function PromoCodeDetailDialog({
  promoCodeId,
  onClose,
}: {
  promoCodeId: string | null;
  onClose: () => void;
}) {
  const { data: promoCode, isLoading } = usePromoCodeDetailQuery(promoCodeId);
  const status = promoCode ? getPromoCodeStatus(promoCode.state) : "inactive";
  const usageRows = promoCode?.recentUsage ?? [];

  return (
    <Dialog open={Boolean(promoCodeId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-4xl"
        aria-describedby="promo-code-detail-description"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تفاصيل كود الخصم</DialogTitle>
          <DialogDescription id="promo-code-detail-description">
            ملخص البيانات التشغيلية، حالة الصلاحية، وحديث الاستخدامات حسب استجابة الباك اند.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !promoCode ? (
          <div className="py-12 text-center text-muted-foreground">
            جاري التحميل...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PromoDetailItem label={promoCodeText.code} value={promoCode.code} dir="ltr" />
              <PromoDetailItem
                label={promoCodeText.name}
                value={getPromoCodeName(promoCode) || promoCodeText.notSpecified}
              />
              <PromoDetailItem
                label={promoCodeText.discount}
                value={formatPromoCodeDiscount(promoCode)}
                dir="ltr"
              />
              <PromoDetailItem label={promoCodeText.status} value={promoCodeText[status]} />
              <PromoDetailItem
                label={promoCodeText.appliesTo}
                value={formatAppliesTo(promoCode.appliesTo)}
              />
              <PromoDetailItem
                label="العملة"
                value={promoCode.currency || promoCodeText.notSpecified}
                dir="ltr"
              />
              <PromoDetailItem
                label={promoCodeText.startsAt}
                value={formatPromoCodeDate(promoCode.startsAt)}
              />
              <PromoDetailItem
                label={promoCodeText.expiresAt}
                value={formatPromoCodeDate(promoCode.expiresAt)}
              />
              <PromoDetailItem
                label={promoCodeText.usage}
                value={`${promoCode.currentUsageCount ?? promoCode.usedCount ?? 0} / ${
                  promoCode.usageLimitTotal ?? promoCodeText.unlimited
                }`}
                dir="ltr"
              />
              <PromoDetailItem
                label="حد الاستخدام لكل مستخدم"
                value={promoCode.usageLimitPerUser ?? promoCodeText.unlimited}
                dir="ltr"
              />
              <PromoDetailItem
                label="أعلى خصم مسموح"
                value={formatHalala(promoCode.maxDiscountAmountHalala)}
                dir="ltr"
              />
              <PromoDetailItem
                label="أقل مبلغ اشتراك"
                value={formatHalala(promoCode.minimumSubscriptionAmountHalala)}
                dir="ltr"
              />
              <PromoDetailItem
                label="أول عملية شراء فقط"
                value={formatBoolean(promoCode.firstPurchaseOnly)}
              />
              <PromoDetailItem
                label="مفعّل"
                value={formatBoolean(promoCode.isActive)}
              />
              <PromoDetailItem
                label="مؤرشف"
                value={formatBoolean(Boolean(promoCode.deletedAt || promoCode.state?.isDeleted))}
              />
              <PromoDetailItem
                label="تاريخ الإنشاء"
                value={formatPromoCodeDate(promoCode.createdAt)}
              />
              <PromoDetailItem
                label="آخر تحديث"
                value={formatPromoCodeDate(promoCode.updatedAt)}
              />
            </div>

            <div className="rounded-2xl border border-muted-foreground/10 bg-card">
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <div>
                  <h3 className="font-black">أحدث الاستخدامات</h3>
                  <p className="text-sm text-muted-foreground">
                    يعرض الباك اند آخر 25 استخدامًا، وأسماء العملاء غير متوفرة في هذا العقد لذلك نعرض المعرّفات بأمان.
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {usageRows.length} سجل
                </Badge>
              </div>

              {usageRows.length ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">قيمة الخصم</TableHead>
                        <TableHead className="text-right">وقت الحجز</TableHead>
                        <TableHead className="text-right">وقت الاستخدام</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageRows.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell className="font-mono text-xs" dir="ltr">
                            {usage.userId ?? promoCodeText.notSpecified}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {formatUsageStatus(usage.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" dir="ltr">
                            {formatHalala(usage.discountAmountHalala)}
                          </TableCell>
                          <TableCell>{formatPromoCodeDate(usage.reservedAt)}</TableCell>
                          <TableCell>{formatPromoCodeDate(usage.consumedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  لا يوجد استخدام حديث لهذا الكود.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}