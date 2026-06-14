import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  ShieldAlert,
  Store,
  Truck,
  User,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isOneTimeOrder, isPickupRequest } from "@/types/dashboardOpsTypes";

interface OperationsOrderDetailsDialogProps {
  item: UnifiedQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DetailRow = {
  label: string;
  value: unknown;
  ltr?: boolean;
};

type RecordValue = Record<string, unknown>;

const EMPTY_TEXT = "غير متوفر";

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getText(value: unknown, fallback = EMPTY_TEXT): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length ? `${value.length} عنصر` : fallback;

  const record = asRecord(value);
  if (!record) return fallback;

  const preferred =
    record.ar ||
    record.en ||
    record.name ||
    record.label ||
    record.title ||
    record.key ||
    record.id;

  return typeof preferred === "string" && preferred.trim() ? preferred : fallback;
}

function formatDateTime(value: unknown) {
  if (!value || typeof value !== "string") return EMPTY_TEXT;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatHalala(value: unknown) {
  if (typeof value !== "number") return getText(value);
  return `${(value / 100).toFixed(2)} ر.س`;
}

function sourceLabel(item: UnifiedQueueItem) {
  if (isPickupRequest(item)) return "طلب استلام";
  if (isOneTimeOrder(item)) return "طلب فردي";
  return "اشتراك يومي";
}

function modeLabel(mode: string) {
  return mode === "delivery" ? "توصيل" : "استلام";
}

function getRawRecord(item: UnifiedQueueItem) {
  return asRecord(item.rawData);
}

function getV2OrderSummary(item: UnifiedQueueItem) {
  return asRecord(getRawRecord(item)?.orderSummary);
}

function getV2Kitchen(item: UnifiedQueueItem) {
  return asRecord(getRawRecord(item)?.kitchen);
}

function getV2Fulfillment(item: UnifiedQueueItem) {
  return asRecord(getRawRecord(item)?.fulfillment);
}

function getV2Payment(item: UnifiedQueueItem) {
  return asRecord(getRawRecord(item)?.payment);
}

function getV2Timestamps(item: UnifiedQueueItem) {
  return asRecord(getRawRecord(item)?.timestamps);
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailGrid({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0 rounded-lg bg-muted/35 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
          <p
            className="mt-1 break-words text-sm font-semibold text-foreground"
            dir={row.ltr ? "ltr" : "rtl"}
          >
            {getText(row.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function MealCard({ meal, index }: { meal: unknown; index: number }) {
  const record = asRecord(meal) || {};
  const product = asRecord(record.product);
  const protein = asRecord(record.protein);
  const premium = asRecord(record.premium);
  const carbs = asArray(record.carbs || record.carbSelections);
  const sauces = asArray(record.sauce);
  const sides = asArray(record.sides);
  const options = asArray(record.options || record.selectedOptions);

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">وجبة {getText(record.slotIndex || index + 1)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {getText(record.mealType || record.selectionType, "نوع الوجبة غير محدد")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-md">
            ×{getText(record.quantity || 1)}
          </Badge>
          {premium?.isPremium || record.isPremium ? (
            <Badge className="rounded-md bg-amber-500 text-white">Premium</Badge>
          ) : null}
        </div>
      </div>

      <DetailGrid
        rows={[
          { label: "المنتج", value: product?.name || record.productName || product?.key || record.productKey },
          { label: "البروتين", value: protein?.name || record.proteinName || protein?.key || record.proteinKey },
          { label: "جرامات البروتين", value: protein?.grams || record.proteinGrams },
          { label: "الكارب", value: carbs.length ? carbs.map((entry) => getText(entry)).join("، ") : record.carbId },
          { label: "السلطة", value: record.salad || record.customSalad },
          { label: "الصوص", value: sauces.length ? sauces.map((entry) => getText(entry)).join("، ") : null },
          { label: "الجوانب", value: sides.length ? sides.map((entry) => getText(entry)).join("، ") : null },
          { label: "الاختيارات", value: options.length ? options.map((entry) => getText(entry)).join("، ") : null },
          { label: "ملاحظات الوجبة", value: record.notes },
        ]}
      />
    </div>
  );
}

function AddonCard({ addon, index }: { addon: unknown; index: number }) {
  const record = asRecord(addon) || {};

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">
          {getText(record.name || record.key || record.addonId || record.id, `إضافة ${index + 1}`)}
        </p>
        <Badge variant="secondary" className="rounded-md">
          ×{getText(record.quantity || 1)}
        </Badge>
      </div>
      <DetailGrid
        rows={[
          { label: "التصنيف", value: record.category },
          { label: "السعر", value: formatHalala(record.priceHalala) },
        ]}
      />
    </div>
  );
}

function KitchenSection({ item }: { item: UnifiedQueueItem }) {
  const kitchen = getV2Kitchen(item);
  const meals = kitchen?.meals
    ? asArray(kitchen.meals)
    : item.kitchenDetails?.mealSlots?.length
      ? item.kitchenDetails.mealSlots
      : item.materializedMeals?.length
        ? item.materializedMeals
        : item.mealSlots || [];
  const addons = kitchen?.addons
    ? asArray(kitchen.addons)
    : item.kitchenDetails?.addons?.length
      ? item.kitchenDetails.addons
      : item.addonSelections || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground">الوجبات المطلوب تجهيزها</p>
        {meals.length ? (
          meals.map((meal, index) => <MealCard key={index} meal={meal} index={index} />)
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد وجبات تفصيلية.</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground">الإضافات</p>
        {addons.length ? (
          addons.map((addon, index) => <AddonCard key={index} addon={addon} index={index} />)
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد إضافات.</p>
        )}
      </div>
    </div>
  );
}

function PaymentGate({ item }: { item: UnifiedQueueItem }) {
  const payment = getV2Payment(item);
  const canPrepare = payment?.canPrepare ?? item.paymentValidity?.canPrepare;
  const canFulfill = payment?.canFulfill ?? item.paymentValidity?.canFulfill;
  const hasBlock =
    payment?.pendingUnpaid ||
    payment?.superseded ||
    payment?.revisionMismatch ||
    item.paymentValidity?.pendingUnpaid ||
    item.paymentValidity?.superseded ||
    item.paymentValidity?.revisionMismatch;

  return (
    <div className="space-y-3">
      {hasBlock ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
          يوجد مانع دفع أو مراجعة. لا تعتمد على العرض فقط، نفذ الإجراء وسيؤكد backend الصلاحية النهائية.
        </div>
      ) : null}
      <DetailGrid
        rows={[
          { label: "حالة الدفع", value: payment?.paymentStatus || item.paymentStatus || item.paymentValidity?.paymentStatus },
          { label: "الدفع مطلوب", value: payment?.paymentRequired ?? item.paymentValidity?.paymentRequired },
          { label: "مدفوع/مطبق", value: payment?.paymentApplied ?? item.paymentValidity?.paymentApplied },
          { label: "يمكن التجهيز", value: canPrepare },
          { label: "يمكن التسليم", value: canFulfill },
          { label: "سبب المنع", value: payment?.reason || item.paymentValidity?.reason },
        ]}
      />
    </div>
  );
}

function DataQualitySection({ item }: { item: UnifiedQueueItem }) {
  const warnings = item.dataQuality?.warnings || [];

  if (item.dataQuality?.isComplete !== false && warnings.length === 0) {
    return null;
  }

  return (
    <Section title="تنبيهات جودة البيانات" icon={<ShieldAlert className="h-4 w-4" />}>
      <div className="space-y-2">
        <Badge variant="outline" className="rounded-md border-amber-500/30 bg-amber-500/10 text-amber-800">
          بيانات غير مكتملة
        </Badge>
        {warnings.map((warning, index) => (
          <div key={`${warning.code}-${index}`} className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
            {getText(warning.messageAr || warning.messageEn || warning.code)}
          </div>
        ))}
      </div>
    </Section>
  );
}

function OperationsActionsSummary({ item }: { item: UnifiedQueueItem }) {
  const disabled = item.actions?.disabled || [];

  if (!item.allowedActions?.length && !disabled.length) {
    return <p className="text-sm text-muted-foreground">لا توجد إجراءات متاحة حالياً.</p>;
  }

  return (
    <div className="space-y-3">
      {item.allowedActions?.length ? (
        <div className="flex flex-wrap gap-2">
          {item.allowedActions.map((action) => (
            <Badge key={action.id} variant="outline" className="rounded-md">
              {action.label}
            </Badge>
          ))}
        </div>
      ) : null}
      {disabled.length ? (
        <div className="space-y-2">
          {disabled.map((action) => (
            <div key={action.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{getText(action.label || action.id)}</span>
              {action.reason || action.reasonLabel ? (
                <span className="mr-2">- {getText(action.reasonLabel || action.reason)}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OperationsOrderDetailsDialog({
  item,
  open,
  onOpenChange,
}: OperationsOrderDetailsDialogProps) {
  if (!item) return null;

  const orderSummary = getV2OrderSummary(item);
  const fulfillment = getV2Fulfillment(item);
  const timestamps = getV2Timestamps(item);
  const delivery = asRecord(fulfillment?.delivery);
  const pickup = asRecord(fulfillment?.pickup);
  const reference = item.orderNumber || item.reference || item.entityId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[85dvh] overflow-y-scroll rounded-2xl p-0 sm:max-w-3xl lg:max-h-[80dvh] lg:max-w-5xl"
      >
        <div className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <DialogHeader className="gap-2 pl-10 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-md">
                {sourceLabel(item)}
              </Badge>
              <Badge variant="outline" className="rounded-md">
                {modeLabel(item.mode)}
              </Badge>
              <Badge className="rounded-md">
                {item.statusLabel || item.status}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold">تفاصيل الطلب</DialogTitle>
            <DialogDescription className="break-words text-right">
              مرجع الطلب: <span dir="ltr">{reference}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="العميل والملخص" icon={<User className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "الاسم", value: item.customer?.name },
                  { label: "الهاتف", value: item.customer?.phone, ltr: true },
                  { label: "عدد الوجبات", value: orderSummary?.mealCount ?? item.context?.mealCount },
                  { label: "إجمالي العناصر", value: orderSummary?.itemCount },
                  { label: "يوجد Premium", value: orderSummary?.hasPremium },
                  { label: "يوجد إضافات", value: orderSummary?.hasAddons },
                  { label: "ملاحظات", value: orderSummary?.notes || item.notes || item.context?.notes },
                  { label: "حساسية", value: orderSummary?.allergies },
                ]}
              />
            </Section>

            <Section title="الخطة والتنفيذ" icon={<CalendarDays className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "التاريخ", value: item.context?.date || item.delivery?.date },
                  { label: "نوع التنفيذ", value: item.fulfillmentType || fulfillment?.type },
                  { label: "الخطة", value: item.plan?.name || item.plan?.key },
                  { label: "جرامات البروتين", value: item.plan?.proteinGrams != null ? `${item.plan.proteinGrams}g` : null },
                  { label: "وجبات اليوم", value: orderSummary?.mealCount ?? item.context?.mealCount },
                  { label: "المتبقي", value: item.plan?.remainingMeals ?? item.pickup?.remainingMeals },
                ]}
              />
            </Section>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Section title="تفاصيل تجهيز المطبخ" icon={<Utensils className="h-4 w-4" />}>
              <KitchenSection item={item} />
            </Section>

            <div className="space-y-4">
              <Section title="الاستلام / التوصيل" icon={item.mode === "delivery" ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}>
                <DetailGrid
                  rows={[
                  { label: "الوقت", value: item.context?.window || delivery?.window || item.delivery?.deliveryWindow },
                    { label: "العنوان", value: item.mode === "delivery" ? item.context?.addressSummary || item.delivery?.addressSummary : null },
                    { label: "ملاحظات العنوان", value: item.mode === "delivery" ? item.context?.addressNotes : null },
                    { label: "الفرع", value: pickup?.branchId || item.pickup?.branchId || item.context?.branch },
                    { label: "الموقع", value: pickup?.locationId || item.pickup?.locationId || item.pickup?.pickupLocationId },
                    { label: "كود الاستلام", value: item.context?.pickupCode || item.pickup?.pickupCode, ltr: true },
                    { label: "حالة كود الاستلام", value: pickup?.pickupCodeState || item.pickup?.pickupCodeState },
                    { label: "حالة التوصيل", value: delivery?.status || item.delivery?.status },
                    { label: "المندوب", value: delivery?.courierId || item.delivery?.courierId, ltr: true },
                  ]}
                />
              </Section>

              <Section title="الدفع والسماح بالإجراءات" icon={<CreditCard className="h-4 w-4" />}>
                <PaymentGate item={item} />
              </Section>

              <DataQualitySection item={item} />
            </div>
          </div>
 
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Section title="الإجراءات المتاحة" icon={<CheckCircle2 className="h-4 w-4" />}>
              <OperationsActionsSummary item={item} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                القائمة المعروضة مساعدة للمستخدم. عند تنفيذ أي إجراء يبقى backend هو المرجع النهائي لحالة الدفع، الدور، والانتقال الصحيح.
              </p>
            </Section>

            <Section title="مراجع مهمة" icon={<Hash className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "نوع الكيان", value: item.entityType },
                  { label: "معرف الكيان", value: item.entityId, ltr: true },
                  { label: "معرف الاشتراك", value: item.subscriptionId, ltr: true },
                  { label: "معرف اليوم", value: item.subscriptionDayId, ltr: true },
                  { label: "معرف طلب الاستلام", value: item.pickup?.pickupRequestId, ltr: true },
                  { label: "معرف التوصيل", value: item.delivery?.deliveryId, ltr: true },
                ]}
              />
            </Section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Section title="التوقيت" icon={<Clock className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "تم الإنشاء", value: formatDateTime(timestamps?.createdAt || item.timestamps?.createdAt) },
                  { label: "آخر تحديث", value: formatDateTime(timestamps?.updatedAt || item.timestamps?.updatedAt) },
                  { label: "جاهز للاستلام", value: formatDateTime(item.pickup?.pickupPreparedAt) },
                  { label: "تم إصدار الكود", value: formatDateTime(item.pickup?.pickupCodeIssuedAt) },
                  { label: "تم التحقق من الاستلام", value: formatDateTime(item.pickup?.pickupVerifiedAt) },
                  { label: "لم يحضر", value: formatDateTime(item.pickup?.pickupNoShowAt) },
                ]}
              />
            </Section>

            <Section title="تنبيهات تشغيلية" icon={<ShieldAlert className="h-4 w-4" />}>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>لا يتم عرض الحقول الخام أو بيانات debug في هذه النافذة.</p>
                <p>الإضافات منفصلة عن عدد الوجبات ولا يجب احتسابها كوجبات اشتراك.</p>
                <p>Premium يظهر كوسم داخل الوجبة ولا يضيف وجبة إضافية.</p>
              </div>
            </Section>
          </div>

          <div className="h-2" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
