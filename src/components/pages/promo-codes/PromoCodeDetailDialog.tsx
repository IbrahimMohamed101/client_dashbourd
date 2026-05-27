import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePromoCodeDetailQuery } from "@/hooks/usePromoCodesQuery";
import {
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

export default function PromoCodeDetailDialog({
  promoCodeId,
  onClose,
}: {
  promoCodeId: string | null;
  onClose: () => void;
}) {
  const { data: promoCode, isLoading } = usePromoCodeDetailQuery(promoCodeId);
  const status = promoCode ? getPromoCodeStatus(promoCode.state) : "inactive";

  return (
    <Dialog open={Boolean(promoCodeId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-[2rem] sm:max-w-3xl"
        aria-describedby="promo-code-detail-description"
      >
        <DialogHeader>
          <DialogTitle>تفاصيل كود الخصم</DialogTitle>
          <DialogDescription id="promo-code-detail-description">
            ملخص البيانات التشغيلية المهمة لكود الخصم.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !promoCode ? (
          <div className="py-12 text-center text-muted-foreground">
            جاري التحميل...
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
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
              label="ينطبق على"
              value={promoCode.appliesTo || promoCodeText.notSpecified}
              dir="ltr"
            />
            <PromoDetailItem
              label="العملة"
              value={promoCode.currency || promoCodeText.notSpecified}
              dir="ltr"
            />
            <PromoDetailItem
              label="تاريخ البدء"
              value={formatPromoCodeDate(promoCode.startsAt)}
            />
            <PromoDetailItem
              label={promoCodeText.expiresAt}
              value={formatPromoCodeDate(promoCode.expiresAt)}
            />
            <PromoDetailItem
              label={promoCodeText.usage}
              value={`${promoCode.currentUsageCount ?? promoCode.usedCount ?? 0} / ${
                promoCode.usageLimitTotal ?? "∞"
              }`}
              dir="ltr"
            />
            <PromoDetailItem
              label="حد الاستخدام لكل مستخدم"
              value={promoCode.usageLimitPerUser ?? promoCodeText.notSpecified}
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
              label="تاريخ الإنشاء"
              value={formatPromoCodeDate(promoCode.createdAt)}
            />
            <PromoDetailItem
              label="آخر تحديث"
              value={formatPromoCodeDate(promoCode.updatedAt)}
            />
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
