import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  PauseCircleIcon,
  PlusIcon,
  RefreshCcwIcon,
  SaveIcon,
  Trash2Icon,
  TruckIcon,
} from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useRestaurantHoursQuery,
  useUpdateRestaurantHoursMutation,
} from "@/hooks/useSettingsQuery";
import { cn } from "@/lib/utils";
import type { RestaurantHoursPayload } from "@/types/settingsTypes";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const windowPattern = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

const dayLabels = [
  { dayOfWeek: 0, ar: "الأحد", short: "أحد" },
  { dayOfWeek: 1, ar: "الاثنين", short: "اثنين" },
  { dayOfWeek: 2, ar: "الثلاثاء", short: "ثلاثاء" },
  { dayOfWeek: 3, ar: "الأربعاء", short: "أربعاء" },
  { dayOfWeek: 4, ar: "الخميس", short: "خميس" },
  { dayOfWeek: 5, ar: "الجمعة", short: "جمعة" },
  { dayOfWeek: 6, ar: "السبت", short: "سبت" },
];

type ScheduleRow = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

type DeliveryWindowRow = {
  id: string;
  start: string;
  end: string;
};

type RestaurantHoursForm = {
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  cutoff_time: string;
  delivery_windows: DeliveryWindowRow[];
  restaurant_hours: ScheduleRow[];
  temporary_closure: boolean;
};

const toText = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value : fallback;

const readSchedule = (hours: Record<string, unknown>) =>
  Array.isArray(hours.restaurant_hours)
    ? hours.restaurant_hours
    : Array.isArray(hours.weekly_schedule)
      ? hours.weekly_schedule
      : [];

const readClosure = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "isActive" in value) {
    return Boolean((value as { isActive?: unknown }).isActive);
  }
  return false;
};

const splitWindow = (value: string, index: number): DeliveryWindowRow => {
  const [start = "", end = ""] = value.split("-");
  return {
    id: `${index}-${value || "empty"}`,
    start,
    end,
  };
};

const toWindowString = (row: DeliveryWindowRow) =>
  `${row.start.trim()}-${row.end.trim()}`;

const buildSchedule = (hours: Record<string, unknown>) => {
  const openTime = toText(hours.restaurant_open_time, "10:00");
  const closeTime = toText(hours.restaurant_close_time, "23:00");
  const map = new Map<number, ScheduleRow>();

  readSchedule(hours).forEach((row) => {
    if (!row || typeof row !== "object") return;
    const record = row as Record<string, unknown>;
    const day = Number(record.dayOfWeek);
    if (!Number.isFinite(day)) return;
    map.set(day % 7, {
      dayOfWeek: day % 7,
      isClosed: Boolean(record.isClosed),
      openTime: toText(record.openTime, openTime),
      closeTime: toText(record.closeTime, closeTime),
    });
  });

  return dayLabels.map(
    (day) =>
      map.get(day.dayOfWeek) ?? {
        dayOfWeek: day.dayOfWeek,
        isClosed: false,
        openTime,
        closeTime,
      }
  );
};

const buildInitialForm = (hours: Record<string, unknown>): RestaurantHoursForm => ({
  restaurant_open_time: toText(hours.restaurant_open_time, "10:00"),
  restaurant_close_time: toText(hours.restaurant_close_time, "23:00"),
  restaurant_is_open:
    typeof hours.restaurant_is_open === "boolean"
      ? hours.restaurant_is_open
      : true,
  cutoff_time: toText(hours.cutoff_time),
  delivery_windows: Array.isArray(hours.delivery_windows)
    ? hours.delivery_windows.map(String).map(splitWindow)
    : [],
  restaurant_hours: buildSchedule(hours),
  temporary_closure: readClosure(hours.temporary_closure ?? hours.temporaryClosure),
});

const isSameForm = (left: RestaurantHoursForm, right: RestaurantHoursForm) =>
  JSON.stringify(left) === JSON.stringify(right);

export const Route = createFileRoute("/_protected/restaurant-hours/")({
  component: RestaurantHoursPage,
});

function RestaurantHoursPage() {
  const { data, dataUpdatedAt, isLoading, isError, refetch, isFetching } =
    useRestaurantHoursQuery();

  if (isLoading) return <RestaurantHoursSkeleton />;

  if (isError) {
    return (
      <div className="px-4 lg:px-6" dir="rtl">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>تعذر تحميل ساعات العمل</AlertTitle>
          <AlertDescription>
            لم نتمكن من جلب إعدادات المطعم. حاول تحديث الصفحة أو راجع الاتصال.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hours = (data?.data ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-5 px-4 pb-24 lg:px-6" dir="rtl">
      <PageHeader
        timezone={toText(hours.timezone, "Asia/Riyadh")}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
      />
      <StatusStrip hours={hours} />
      <RestaurantHoursFormContent
        key={dataUpdatedAt}
        hours={hours}
        lastUpdatedAt={dataUpdatedAt}
      />
    </div>
  );
}

function PageHeader({
  timezone,
  onRefresh,
  refreshing,
}: {
  timezone: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ClockIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-normal">
            ساعات عمل المطعم
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            اضبط استقبال الطلبات، الجدول الأسبوعي، نوافذ التوصيل، والإغلاق
            المؤقت من صفحة واحدة واضحة لفريق العمليات.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {timezone}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCcwIcon className={cn("size-4", refreshing && "animate-spin")} />
          تحديث
        </Button>
      </div>
    </div>
  );
}

function StatusStrip({ hours }: { hours: Record<string, unknown> }) {
  const isOpenNow =
    typeof hours.isOpenNow === "boolean" ? hours.isOpenNow : undefined;
  const restaurantIsOpen =
    typeof hours.restaurant_is_open === "boolean"
      ? hours.restaurant_is_open
      : true;
  const closureActive = readClosure(hours.temporary_closure ?? hours.temporaryClosure);
  const openTime = toText(hours.restaurant_open_time, "10:00");
  const closeTime = toText(hours.restaurant_close_time, "23:00");

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatusCard
        icon={<CheckCircle2Icon className="size-5" />}
        label="الحالة الحالية"
        value={
          isOpenNow === undefined ? "غير متاحة" : isOpenNow ? "مفتوح الآن" : "مغلق الآن"
        }
        tone={isOpenNow ? "success" : "muted"}
        note="هذه الحالة محسوبة من الخادم."
      />
      <StatusCard
        icon={<ClockIcon className="size-5" />}
        label="الساعات العامة"
        value={`${openTime} - ${closeTime}`}
        note="تطبق كمرجع افتراضي للجدول."
      />
      <StatusCard
        icon={<TruckIcon className="size-5" />}
        label="استقبال الطلبات"
        value={restaurantIsOpen ? "مفعل" : "متوقف"}
        tone={restaurantIsOpen ? "success" : "warning"}
        note="يتحكم في قبول الطلبات الجديدة."
      />
      <StatusCard
        icon={<PauseCircleIcon className="size-5" />}
        label="الإغلاق المؤقت"
        value={closureActive ? "نشط" : "غير نشط"}
        tone={closureActive ? "warning" : "muted"}
        note="استخدمه للإيقاف المؤقت السريع."
      />
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  note,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  return (
    <Card size="sm" className="rounded-lg">
      <CardContent className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "success" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
            tone === "warning" && "bg-amber-500/12 text-amber-700 dark:text-amber-300",
            tone === "muted" && "bg-muted text-muted-foreground",
            tone === "default" && "bg-primary/10 text-primary"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tracking-normal">{value}</p>
          <p className="text-xs leading-5 text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RestaurantHoursFormContent({
  hours,
  lastUpdatedAt,
}: {
  hours: Record<string, unknown>;
  lastUpdatedAt: number;
}) {
  const updateHours = useUpdateRestaurantHoursMutation();
  const initialForm = useMemo(() => buildInitialForm(hours), [hours]);
  const [form, setForm] = useState<RestaurantHoursForm>(initialForm);
  const [showErrors, setShowErrors] = useState(false);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const hasChanges = !isSameForm(form, initialForm);

  const updateField = <K extends keyof RestaurantHoursForm>(
    key: K,
    value: RestaurantHoursForm[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const updateScheduleRow = (dayOfWeek: number, patch: Partial<ScheduleRow>) =>
    setForm((current) => ({
      ...current,
      restaurant_hours: current.restaurant_hours.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row
      ),
    }));

  const updateWindowRow = (id: string, patch: Partial<DeliveryWindowRow>) =>
    setForm((current) => ({
      ...current,
      delivery_windows: current.delivery_windows.map((row) =>
        row.id === id ? { ...row, ...patch } : row
      ),
    }));

  const addWindow = () =>
    setForm((current) => ({
      ...current,
      delivery_windows: [
        ...current.delivery_windows,
        { id: `new-${Date.now()}`, start: "12:00", end: "14:00" },
      ],
    }));

  const removeWindow = (id: string) =>
    setForm((current) => ({
      ...current,
      delivery_windows: current.delivery_windows.filter((row) => row.id !== id),
    }));

  const applyGeneralHours = () =>
    setForm((current) => ({
      ...current,
      restaurant_hours: current.restaurant_hours.map((row) =>
        row.isClosed
          ? row
          : {
              ...row,
              openTime: current.restaurant_open_time,
              closeTime: current.restaurant_close_time,
            }
      ),
    }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (validationErrors.length) return;

    const payload: RestaurantHoursPayload = {
      restaurant_open_time: form.restaurant_open_time,
      restaurant_close_time: form.restaurant_close_time,
      restaurant_is_open: form.restaurant_is_open,
      cutoff_time: form.cutoff_time || undefined,
      delivery_windows: form.delivery_windows.map(toWindowString),
      restaurant_hours: form.restaurant_hours,
      temporary_closure: { isActive: form.temporary_closure },
    };

    updateHours.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showErrors && validationErrors.length ? (
        <ValidationSummary errors={validationErrors} />
      ) : null}

      <GeneralSettingsCard form={form} updateField={updateField} />
      <WeeklyScheduleCard
        schedule={form.restaurant_hours}
        onRowChange={updateScheduleRow}
        onApplyGeneralHours={applyGeneralHours}
      />
      <DeliveryWindowsCard
        windows={form.delivery_windows}
        onAdd={addWindow}
        onRemove={removeWindow}
        onChange={updateWindowRow}
      />
      <TemporaryClosureCard
        active={form.temporary_closure}
        onChange={(checked) => updateField("temporary_closure", checked)}
      />

      <SaveBar
        hasChanges={hasChanges}
        isPending={updateHours.isPending}
        lastUpdatedAt={lastUpdatedAt}
        onReset={() => {
          setForm(initialForm);
          setShowErrors(false);
        }}
      />
    </form>
  );
}

function GeneralSettingsCard({
  form,
  updateField,
}: {
  form: RestaurantHoursForm;
  updateField: <K extends keyof RestaurantHoursForm>(
    key: K,
    value: RestaurantHoursForm[K]
  ) => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>الإعدادات العامة</CardTitle>
        <CardDescription>
          اضبط حالة استقبال الطلبات والساعات المرجعية للمطعم.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">استقبال الطلبات</Label>
            <p className="text-xs text-muted-foreground">
              عند الإيقاف لن يتم قبول طلبات جديدة من العملاء.
            </p>
          </div>
          <Switch
            checked={form.restaurant_is_open}
            onCheckedChange={(checked) =>
              updateField("restaurant_is_open", checked)
            }
          />
        </div>
        <TimeField
          label="وقت الفتح"
          value={form.restaurant_open_time}
          onChange={(value) => updateField("restaurant_open_time", value)}
        />
        <TimeField
          label="وقت الإغلاق"
          value={form.restaurant_close_time}
          onChange={(value) => updateField("restaurant_close_time", value)}
        />
        <TimeField
          label="إقفال تعديلات الاشتراك"
          value={form.cutoff_time}
          onChange={(value) => updateField("cutoff_time", value)}
          optional
        />
      </CardContent>
    </Card>
  );
}

function WeeklyScheduleCard({
  schedule,
  onRowChange,
  onApplyGeneralHours,
}: {
  schedule: ScheduleRow[];
  onRowChange: (dayOfWeek: number, patch: Partial<ScheduleRow>) => void;
  onApplyGeneralHours: () => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <CardTitle>الجدول الأسبوعي</CardTitle>
          <CardDescription>
            حدد ساعات العمل لكل يوم أو أغلق اليوم بالكامل.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApplyGeneralHours}
          className="w-fit"
        >
          <ClockIcon className="size-4" />
          تطبيق الساعات العامة
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 xl:grid-cols-2">
        {schedule.map((row) => (
          <div
            key={row.dayOfWeek}
            className={cn(
              "grid gap-3 rounded-lg border p-3 sm:grid-cols-[6rem_1fr_1fr_auto] sm:items-end",
              row.isClosed ? "bg-muted/40" : "bg-background"
            )}
          >
            <div className="flex items-center justify-between gap-3 sm:block">
              <div>
                <p className="font-semibold">{dayLabels[row.dayOfWeek]?.ar}</p>
                <Badge
                  variant={row.isClosed ? "secondary" : "default"}
                  className="mt-1 rounded-full"
                >
                  {row.isClosed ? "مغلق" : "مفتوح"}
                </Badge>
              </div>
            </div>
            <TimeField
              label="من"
              value={row.openTime}
              disabled={row.isClosed}
              onChange={(value) => onRowChange(row.dayOfWeek, { openTime: value })}
            />
            <TimeField
              label="إلى"
              value={row.closeTime}
              disabled={row.isClosed}
              onChange={(value) => onRowChange(row.dayOfWeek, { closeTime: value })}
            />
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 sm:justify-center">
              <span className="text-xs text-muted-foreground">إغلاق اليوم</span>
              <Switch
                checked={row.isClosed}
                onCheckedChange={(checked) =>
                  onRowChange(row.dayOfWeek, { isClosed: checked })
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DeliveryWindowsCard({
  windows,
  onAdd,
  onRemove,
  onChange,
}: {
  windows: DeliveryWindowRow[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<DeliveryWindowRow>) => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <CardTitle>نوافذ التوصيل</CardTitle>
          <CardDescription>
            أضف فترات التوصيل المتاحة للعملاء بصيغة واضحة.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <PlusIcon className="size-4" />
          إضافة نافذة
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {windows.length ? (
          windows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-background font-semibold text-muted-foreground">
                {index + 1}
              </div>
              <TimeField
                label="بداية النافذة"
                value={row.start}
                onChange={(value) => onChange(row.id, { start: value })}
              />
              <TimeField
                label="نهاية النافذة"
                value={row.end}
                onChange={(value) => onChange(row.id, { end: value })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="حذف نافذة التوصيل"
                onClick={() => onRemove(row.id)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <TruckIcon className="size-8 text-muted-foreground" />
            <p className="font-semibold">لا توجد نوافذ توصيل محددة</p>
            <p className="max-w-md text-sm text-muted-foreground">
              أضف نافذة واحدة أو أكثر حتى تظهر خيارات التوصيل بصورة منظمة.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TemporaryClosureCard({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300">
            <PauseCircleIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <Label className="text-base font-semibold">إغلاق مؤقت</Label>
            <p className="text-sm text-muted-foreground">
              استخدمه عند الحاجة لإيقاف العمليات سريعًا بدون تغيير الجدول
              الأسبوعي.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 sm:min-w-44">
          <span className="text-sm font-medium">{active ? "نشط" : "غير نشط"}</span>
          <Switch checked={active} onCheckedChange={onChange} />
        </div>
      </CardContent>
    </Card>
  );
}

function SaveBar({
  hasChanges,
  isPending,
  lastUpdatedAt,
  onReset,
}: {
  hasChanges: boolean;
  isPending: boolean;
  lastUpdatedAt: number;
  onReset: () => void;
}) {
  const updatedText = lastUpdatedAt
    ? new Intl.DateTimeFormat("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdatedAt)
    : "غير متاح";

  return (
    <div className="sticky bottom-4 z-20 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">آخر تحديث للبيانات:</span>
          <span className="font-semibold">{updatedText}</span>
          {hasChanges ? (
            <Badge variant="secondary" className="rounded-full">
              توجد تغييرات غير محفوظة
            </Badge>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={!hasChanges || isPending}
          >
            إلغاء التغييرات
          </Button>
          <Button type="submit" disabled={!hasChanges || isPending}>
            <SaveIcon className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  disabled,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {optional ? <span className="font-normal"> اختياري</span> : null}
      </Label>
      <Input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        dir="ltr"
        className="font-mono"
      />
    </div>
  );
}

function ValidationSummary({ errors }: { errors: string[] }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>راجع الإعدادات قبل الحفظ</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

function validateForm(form: RestaurantHoursForm) {
  const errors: string[] = [];

  if (!timePattern.test(form.restaurant_open_time)) {
    errors.push("وقت الفتح مطلوب ويجب أن يكون بصيغة صحيحة.");
  }
  if (!timePattern.test(form.restaurant_close_time)) {
    errors.push("وقت الإغلاق مطلوب ويجب أن يكون بصيغة صحيحة.");
  }
  if (form.cutoff_time && !timePattern.test(form.cutoff_time)) {
    errors.push("وقت إقفال تعديلات الاشتراك غير صحيح.");
  }

  form.restaurant_hours.forEach((row) => {
    const dayName = dayLabels[row.dayOfWeek]?.ar ?? "اليوم";
    if (row.isClosed) return;
    if (!timePattern.test(row.openTime) || !timePattern.test(row.closeTime)) {
      errors.push(`راجع ساعات العمل في ${dayName}.`);
    }
  });

  const windows = form.delivery_windows.map(toWindowString);
  const duplicates = new Set<string>();
  windows.forEach((window) => {
    if (!windowPattern.test(window)) {
      errors.push("كل نافذة توصيل تحتاج وقت بداية ونهاية صحيحين.");
      return;
    }
    const [start, end] = window.split("-");
    if (start === end) {
      errors.push("لا يمكن أن تبدأ وتنتهي نافذة التوصيل في نفس الوقت.");
    }
    if (duplicates.has(window)) {
      errors.push("لا يمكن تكرار نفس نافذة التوصيل.");
    }
    duplicates.add(window);
  });

  return [...new Set(errors)];
}

function RestaurantHoursSkeleton() {
  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
