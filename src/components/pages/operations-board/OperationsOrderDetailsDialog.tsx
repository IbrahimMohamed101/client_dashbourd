import type { ReactNode } from "react";
import {
  CalendarDays,
  Clock,
  CreditCard,
  Hash,
  MapPin,
  Package,
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

  if (typeof preferred === "string" && preferred.trim()) return preferred;

  return (
    Object.entries(record)
      .slice(0, 4)
      .map(([key, entry]) => `${key}: ${getText(entry, "")}`)
      .filter(Boolean)
      .join("، ") || fallback
  );
}

function sourceLabel(item: UnifiedQueueItem) {
  if (isPickupRequest(item)) return "طلب استلام اشتراك";
  if (isOneTimeOrder(item)) return "طلب فردي";
  return "اشتراك يومي";
}

function modeLabel(mode: string) {
  return mode === "delivery" ? "توصيل" : "استلام";
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

function getAddress(item: UnifiedQueueItem) {
  return (
    item.context?.addressSummary ||
    item.delivery?.addressSummary ||
    getText(item.delivery?.address || item.context?.address)
  );
}

function getOrderItems(item: UnifiedQueueItem) {
  if (Array.isArray(item.items) && item.items.length) return item.items;

  if (Array.isArray(item.mealSlots) && item.mealSlots.length) {
    return item.mealSlots.flatMap((slot) =>
      (slot.items || []).map((entry, index) => ({
        id: `${slot.slot}-${index}`,
        name: `${getText(entry.name)} - ${slot.slot}`,
        quantity: entry.quantity || 1,
        notes: entry.notes,
      }))
    );
  }

  return [];
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

function ItemsList({ item }: { item: UnifiedQueueItem }) {
  const orderItems = getOrderItems(item);

  if (!orderItems.length && !item.context?.mealCount && !item.plan?.selectedMealsPerDay) {
    return <p className="text-sm text-muted-foreground">لا توجد عناصر مختصرة في هذا الصف.</p>;
  }

  return (
    <div className="space-y-2">
      {orderItems.map((entry, index) => (
        <div
          key={entry.id || `${getText(entry.name)}-${index}`}
          className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold">
              {getText(entry.name, "عنصر")}
            </p>
            {entry.notes ? (
              <p className="mt-1 break-words text-xs text-muted-foreground">
                {entry.notes}
              </p>
            ) : null}
          </div>
          <Badge variant="secondary" className="shrink-0 rounded-md">
            ×{entry.quantity || 1}
          </Badge>
        </div>
      ))}
      {!orderItems.length ? (
        <div className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold">
          عدد الوجبات: {item.context?.mealCount ?? item.plan?.selectedMealsPerDay}
        </div>
      ) : null}
    </div>
  );
}

function MealSlotCard({ slot, index }: { slot: unknown; index: number }) {
  const record = asRecord(slot) || {};
  const selectedOptions = asArray(record.selectedOptions);
  const carbs = asArray(record.carbSelections || record.carbs);
  const sauce = asArray(record.sauce);
  const sides = asArray(record.sides);

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">وجبة {getText(record.slotIndex || index + 1)}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-md">
            {getText(record.selectionType, "نوع غير محدد")}
          </Badge>
          {record.isPremium ? (
            <Badge className="rounded-md bg-amber-500 text-white">مدفوعة</Badge>
          ) : null}
        </div>
      </div>
      <DetailGrid
        rows={[
          { label: "المنتج", value: record.productName || record.productKey || record.productId },
          { label: "ساندويتش", value: record.sandwichId, ltr: true },
          { label: "البروتين", value: record.proteinName || record.proteinKey || record.proteinId },
          { label: "جرامات البروتين", value: record.proteinGrams },
          { label: "الكارب", value: carbs.length ? carbs : record.carbId },
          { label: "السلطة", value: record.salad || record.customSalad },
          { label: "الصوص", value: sauce.length ? sauce : null },
          { label: "الإضافات الجانبية", value: sides.length ? sides : null },
          { label: "الاختيارات", value: selectedOptions.length ? selectedOptions : null },
          { label: "ملاحظات", value: record.notes },
        ]}
      />
    </div>
  );
}

function AddonCard({ addon, index }: { addon: unknown; index: number }) {
  const record = asRecord(addon) || {};

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold">{getText(record.name || record.key || record.addonId, `إضافة ${index + 1}`)}</p>
        <Badge variant="secondary" className="rounded-md">
          ×{getText(record.quantity || 1)}
        </Badge>
      </div>
      <DetailGrid
        rows={[
          { label: "المعرف", value: record.id || record.addonId || record._id, ltr: true },
          { label: "التصنيف", value: record.category },
          { label: "المصدر", value: record.source },
          { label: "السعر", value: formatHalala(record.priceHalala) },
          { label: "العملة", value: record.currency },
          { label: "وقت الاستهلاك", value: formatDateTime(record.consumedAt) },
        ]}
      />
    </div>
  );
}

function KitchenDetails({ item }: { item: UnifiedQueueItem }) {
  const mealSlots =
    item.kitchenDetails?.mealSlots?.length
      ? item.kitchenDetails.mealSlots
      : item.materializedMeals?.length
        ? item.materializedMeals
        : item.mealSlots;
  const addons =
    item.kitchenDetails?.addons?.length
      ? item.kitchenDetails.addons
      : item.addonSelections || [];
  const premium = item.premiumUpgradeSelections || [];

  if (!mealSlots?.length && !addons.length && !premium.length) {
    return <p className="text-sm text-muted-foreground">لا توجد تفاصيل مطبخ إضافية لهذا الطلب.</p>;
  }

  return (
    <div className="space-y-4">
      {mealSlots?.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">الوجبات</p>
          {mealSlots.map((slot, index) => (
            <MealSlotCard key={index} slot={slot} index={index} />
          ))}
        </div>
      ) : null}

      {addons.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">الإضافات</p>
          {addons.map((addon, index) => (
            <AddonCard key={index} addon={addon} index={index} />
          ))}
        </div>
      ) : null}

      {premium.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">ترقيات مدفوعة</p>
          {premium.map((entry, index) => (
            <div key={index} className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
              {getText(entry)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function JsonValue({
  label,
  value,
  depth = 0,
}: {
  label?: string;
  value: unknown;
  depth?: number;
}) {
  const record = asRecord(value);
  const arrayValue = Array.isArray(value) ? value : null;
  const isNested = Boolean(record || arrayValue);
  const title = label || (arrayValue ? `Array (${arrayValue.length})` : "Object");

  if (!isNested) {
    return (
      <div className="grid gap-1 rounded-lg bg-muted/35 px-3 py-2 sm:grid-cols-[12rem_1fr]">
        {label ? (
          <span className="break-words text-xs font-semibold text-muted-foreground" dir="ltr">
            {label}
          </span>
        ) : null}
        <span className="break-words text-sm font-medium text-foreground" dir="ltr">
          {getText(value)}
        </span>
      </div>
    );
  }

  const entries = arrayValue
    ? arrayValue.map((entry, index) => [String(index), entry] as const)
    : Object.entries(record || {});

  return (
    <details
      open={depth < 1}
      className="rounded-lg border border-border/60 bg-background"
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-bold">
        <span dir="ltr">{title}</span>
        <span className="mr-2 text-xs font-medium text-muted-foreground">
          {entries.length} حقل
        </span>
      </summary>
      <div className="space-y-2 border-t p-3">
        {entries.length ? (
          entries.map(([entryLabel, entryValue]) => (
            <JsonValue
              key={entryLabel}
              label={entryLabel}
              value={entryValue}
              depth={depth + 1}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد بيانات داخلية.</p>
        )}
      </div>
    </details>
  );
}

function FullResponseData({ item }: { item: UnifiedQueueItem }) {
  const raw = item.rawData || item;
  const rawRecord = asRecord(raw);
  const orderedKeys = [
    "id",
    "entityId",
    "entityType",
    "subscriptionDayId",
    "subscriptionId",
    "user",
    "customer",
    "date",
    "status",
    "fulfillmentType",
    "plan",
    "kitchenDetails",
    "paymentValidity",
    "deliveryMethod",
    "deliveryMode",
    "delivery",
    "pickup",
    "items",
    "mealSlots",
    "materializedMeals",
    "addonSelections",
    "premiumUpgradeSelections",
    "pricing",
    "paymentStatus",
    "notes",
    "lastActionAt",
    "lastActionBy",
    "allowedActions",
    "createdAt",
    "updatedAt",
  ];

  if (!rawRecord) {
    return <JsonValue value={raw} />;
  }

  const rendered = new Set<string>();
  const orderedEntries = orderedKeys
    .filter((key) => key in rawRecord)
    .map((key) => {
      rendered.add(key);
      return [key, rawRecord[key]] as const;
    });
  const remainingEntries = Object.entries(rawRecord).filter(([key]) => !rendered.has(key));

  return (
    <div className="space-y-2">
      {[...orderedEntries, ...remainingEntries].map(([key, value]) => (
        <JsonValue key={key} label={key} value={value} />
      ))}
    </div>
  );
}

export function OperationsOrderDetailsDialog({
  item,
  open,
  onOpenChange,
}: OperationsOrderDetailsDialogProps) {
  if (!item) return null;

  const reference = item.orderNumber || item.reference || item.entityId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[85dvh] overflow-y-scroll rounded-2xl p-0 sm:max-w-3xl lg:max-h-[78dvh] lg:max-w-5xl"
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
                {item.statusLabel || item.ui?.label || item.status}
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
            <Section title="بيانات العميل" icon={<User className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "الاسم", value: item.customer?.name },
                  { label: "الهاتف", value: item.customer?.phone, ltr: true },
                  { label: "معرف العميل", value: item.customer?.id, ltr: true },
                  { label: "ملاحظات", value: item.notes || item.context?.notes },
                ]}
              />
            </Section>

            <Section
              title={item.mode === "delivery" ? "التوصيل" : "الاستلام"}
              icon={item.mode === "delivery" ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            >
              <DetailGrid
                rows={[
                  { label: "التاريخ", value: item.context?.date || item.delivery?.date },
                  { label: "الوقت", value: item.context?.window || item.delivery?.window || item.delivery?.deliveryWindow },
                  { label: "طريقة التنفيذ", value: item.fulfillmentType || item.delivery?.method },
                  { label: "العنوان / الفرع", value: item.mode === "delivery" ? getAddress(item) : item.context?.branch || item.pickup?.branchId },
                  { label: "موقع الاستلام", value: item.pickup?.pickupLocationId || item.delivery?.pickupLocationId },
                  { label: "كود الاستلام", value: item.context?.pickupCode || item.pickup?.pickupCode, ltr: true },
                ]}
              />
            </Section>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Section title="العناصر والوجبات" icon={<Utensils className="h-4 w-4" />}>
              <ItemsList item={item} />
            </Section>

            <Section title="تفاصيل المطبخ" icon={<Package className="h-4 w-4" />}>
              <KitchenDetails item={item} />
            </Section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Section title="الدفع والخطة" icon={<CreditCard className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "الخطة", value: item.plan?.name || item.plan?.key },
                  { label: "أيام الخطة", value: item.plan?.daysCount || item.plan?.durationDays },
                  { label: "إجمالي الوجبات", value: item.plan?.totalMeals },
                  { label: "وجبات اليوم", value: item.plan?.selectedMealsPerDay || item.context?.requiredMealCount },
                  { label: "المتبقي", value: item.plan?.remainingMeals ?? item.pickup?.remainingMeals },
                  { label: "حجم البروتين", value: item.plan?.proteinGrams ? `${item.plan.proteinGrams}g` : item.plan?.portionSize },
                  { label: "حالة الدفع", value: item.paymentStatus || item.paymentValidity?.paymentStatus },
                  { label: "الدفع مطلوب", value: item.paymentValidity?.paymentRequired },
                  { label: "تم تطبيق الدفع", value: item.paymentValidity?.paymentApplied },
                  { label: "يمكن التجهيز", value: item.paymentValidity?.canPrepare },
                  { label: "يمكن التسليم", value: item.paymentValidity?.canFulfill },
                  { label: "سبب منع الدفع", value: item.paymentValidity?.reason },
                ]}
              />
            </Section>

            <Section title="حالة الاستلام والتوصيل" icon={<MapPin className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "طلب الاستلام", value: item.pickup?.pickupRequestId, ltr: true },
                  { label: "الفرع", value: item.pickup?.branchId },
                  { label: "الموقع", value: item.pickup?.locationId },
                  { label: "حالة كود الاستلام", value: item.pickup?.pickupCodeState },
                  { label: "محجوز", value: item.pickup?.reserved },
                  { label: "مستهلك", value: item.pickup?.consumed },
                  { label: "محرر", value: item.pickup?.released },
                  { label: "عدد وجبات الاستلام", value: item.pickup?.mealCount },
                  { label: "معرف التوصيل", value: item.delivery?.deliveryId, ltr: true },
                  { label: "حالة التوصيل", value: item.delivery?.status },
                  { label: "منطقة التوصيل", value: item.delivery?.zone?.name || item.delivery?.zoneId },
                  { label: "المندوب", value: item.delivery?.courierId, ltr: true },
                ]}
              />
            </Section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Section title="مراجع النظام" icon={<Hash className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "معرف الصف", value: item.id, ltr: true },
                  { label: "معرف الكيان", value: item.entityId, ltr: true },
                  { label: "نوع الكيان", value: item.entityType },
                  { label: "المصدر", value: item.source },
                  { label: "معرف الاشتراك", value: item.subscriptionId, ltr: true },
                  { label: "معرف يوم الاشتراك", value: item.subscriptionDayId, ltr: true },
                  { label: "رقم الطلب", value: item.orderNumber, ltr: true },
                  { label: "نوع التنفيذ", value: item.fulfillmentType },
                ]}
              />
            </Section>

            <Section title="التواريخ" icon={<CalendarDays className="h-4 w-4" />}>
              <DetailGrid
                rows={[
                  { label: "تم الإنشاء", value: formatDateTime(item.timestamps?.createdAt) },
                  { label: "آخر تحديث", value: formatDateTime(item.timestamps?.updatedAt) },
                  { label: "جاهز للاستلام", value: formatDateTime(item.pickup?.pickupPreparedAt) },
                  { label: "تم إصدار الكود", value: formatDateTime(item.pickup?.pickupCodeIssuedAt) },
                  { label: "تم التحقق من الاستلام", value: formatDateTime(item.pickup?.pickupVerifiedAt) },
                  { label: "لم يحضر", value: formatDateTime(item.pickup?.pickupNoShowAt) },
                ]}
              />
            </Section>
          </div>

          <div className="mt-4">
            <Section title="الإجراءات المتاحة" icon={<Clock className="h-4 w-4" />}>
              {item.allowedActions?.length ? (
                <div className="flex flex-wrap gap-2">
                  {item.allowedActions.map((action) => (
                    <Badge key={action.id} variant="outline" className="rounded-md">
                      {action.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد إجراءات متاحة حالياً.</p>
              )}
            </Section>
          </div>

          <div className="mt-4">
            <Section title="بيانات الاستجابة الكاملة" icon={<Hash className="h-4 w-4" />}>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                هذا القسم يعرض كل الحقول القادمة من استجابة الـ API الأصلية حتى لو لم تكن موجودة في الأقسام المختصرة بالأعلى.
              </p>
              <div className="max-h-[45dvh] overflow-y-auto rounded-xl border bg-muted/20 p-3">
                <FullResponseData item={item} />
              </div>
            </Section>
          </div>

          <div className="h-2" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
