import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatPreviewAmount } from "./previewCatalog";
import { channelAccentStyle } from "./posSaleChannels";
import type { PosQuote } from "./quoteApi";

export function PosCheckoutReview({
  quote, channelName, serviceMode, externalOrderNumber, externalPaymentStatus, onClose,
}: {
  quote: PosQuote;
  channelName: string;
  serviceMode?: "restaurant" | "dine-in" | "takeaway" | "delivery";
  externalOrderNumber: string;
  externalPaymentStatus: "paid" | "cash";
  onClose: () => void;
}) {
  const [restaurantTender, setRestaurantTender] = useState<"cash" | "network">("cash");
  const restaurant = quote.channel === "restaurant";
  const serviceNames = { "dine-in": "محلي", takeaway: "سفري", delivery: "توصيل" };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent dir="rtl" className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden text-right">
        <DialogHeader className="shrink-0">
          <DialogTitle>مراجعة الطلب قبل إصدار الفاتورة — معاينة</DialogTitle>
          <DialogDescription>
            تسعير من السيرفر للمنيو المنشور رقم {quote.revision}، لكنه ليس فاتورة ضريبية ولا طلبًا مسجلًا.
          </DialogDescription>
        </DialogHeader>
        <section aria-label="تفاصيل مراجعة الطلب" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border bg-muted/50 p-3">
            <span>قناة البيع: <strong className="rounded bg-primary px-2 py-1 text-primary-foreground"
              style={channelAccentStyle(quote.channel)}>{channelName}</strong></span>
            {restaurant && serviceMode && serviceMode !== "restaurant" && (
              <span>نوع الطلب: <strong>{serviceNames[serviceMode]}</strong></span>
            )}
            {!restaurant && (
              <span>رقم طلب التطبيق: <strong>{externalOrderNumber.trim() || "غير محدد"}</strong></span>
            )}
            <span>العدد: <strong>{quote.itemCount}</strong></span>
          </div>
          <div className="max-h-[38dvh] overflow-auto rounded-lg border">
            <table className="w-full table-fixed border-collapse text-right text-xs sm:text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="w-[55%] p-2">الصنف والتفاصيل</th>
                  <th className="w-[12%] p-2">العدد</th>
                  <th className="w-[33%] p-2">السعر المبدئي</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((line, index) => (
                  <tr key={line.productId + "/" + line.variantId + "/" + index} className="border-t">
                    <td className="break-words p-2">
                      <strong>{line.name} · {line.variantLabel}</strong>
                      {line.addons.map((addon) => (
                        <p key={addon.productId} className="text-muted-foreground">
                          + {addon.name} ({formatPreviewAmount(addon.priceHalalas)} للوجبة)
                        </p>
                      ))}
                    </td>
                    <td className="p-2 tabular-nums">{line.quantity}</td>
                    <td className="break-words p-2 tabular-nums">{formatPreviewAmount(line.lineTotalHalalas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-1 rounded-lg border p-3">
            <div className="flex justify-between gap-3 font-semibold">
              <span>الإجمالي المبدئي من السيرفر</span>
              <strong>{formatPreviewAmount(quote.provisionalSubtotalHalalas)}</strong>
            </div>
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span>الخصومات</span><span>غير محسوبة</span>
            </div>
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span>الضريبة</span><span>غير محسوبة</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              لا يوجد مبلغ نهائي مستحق، ولا يتم طباعة أو تسجيل فاتورة من هذه المعاينة.
            </p>
          </div>
          {restaurant ? (
            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 font-semibold">وسيلة الدفع المقترحة — اختيار تجريبي</legend>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant={restaurantTender === "cash" ? "secondary" : "outline"}
                  className={"min-h-12 flex-1 gap-2 border-2 " + (restaurantTender === "cash"
                    ? "border-primary bg-primary/10 font-bold text-foreground"
                    : "border-border")} aria-pressed={restaurantTender === "cash"}
                  onClick={() => setRestaurantTender("cash")}>
                  {restaurantTender === "cash" && <Check aria-hidden="true" className="size-5 shrink-0 text-primary" />}كاش
                </Button>
                <Button type="button" variant={restaurantTender === "network" ? "secondary" : "outline"}
                  className={"min-h-12 flex-1 gap-2 border-2 " + (restaurantTender === "network"
                    ? "border-primary bg-primary/10 font-bold text-foreground"
                    : "border-border")} aria-pressed={restaurantTender === "network"}
                  onClick={() => setRestaurantTender("network")}>
                  {restaurantTender === "network" && <Check aria-hidden="true" className="size-5 shrink-0 text-primary" />}شبكة
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                الاختيار للعرض فقط، ولا يتم تحصيل نقد أو إرسال عملية للشبكة.
              </p>
            </fieldset>
          ) : (
            <div className="rounded-lg border p-3">
              <p className="font-semibold">
                حالة الدفع المُدخلة من الكاشير: {externalPaymentStatus === "paid" ? "مدفوع" : "كاش"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                هذه حالة تجريبية، وليست تأكيدًا من تطبيق التوصيل أو إثبات تحصيل.
              </p>
            </div>
          )}
          <p role="status" className="rounded-lg border border-dashed p-3 text-sm">
            المرحلة E للتأكد من شكل الطلب وتسعيره فقط. لا توجد صلاحية لتأكيد البيع أو إصدار فاتورة أو تسجيل تحصيل.
          </p>
        </section>
        <DialogFooter className="!static !mx-0 !mb-0 !shrink-0 !border-t !bg-popover !px-0 !pt-3 !pb-0">
          <Button type="button" variant="outline" className="min-h-12" onClick={onClose}>
            رجوع للسلة
          </Button>
          <Button type="button" className="min-h-12" disabled>
            تأكيد البيع وإصدار الفاتورة — غير متاح
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
