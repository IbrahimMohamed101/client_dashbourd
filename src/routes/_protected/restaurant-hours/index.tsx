import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { ClockIcon, SaveIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useRestaurantHoursQuery,
  useUpdateRestaurantHoursMutation,
} from "@/hooks/useSettingsQuery";

const windowPattern = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

const dayLabels = [
  { dayOfWeek: 0, ar: "الأحد" },
  { dayOfWeek: 1, ar: "الاثنين" },
  { dayOfWeek: 2, ar: "الثلاثاء" },
  { dayOfWeek: 3, ar: "الأربعاء" },
  { dayOfWeek: 4, ar: "الخميس" },
  { dayOfWeek: 5, ar: "الجمعة" },
  { dayOfWeek: 6, ar: "السبت" },
];

type ScheduleRow = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

type RestaurantHoursForm = {
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  cutoff_time: string;
  delivery_windows: string[];
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

export const Route = createFileRoute("/_protected/restaurant-hours/")({
  component: RestaurantHoursPage,
});

function RestaurantHoursPage() {
  const { data, dataUpdatedAt, isLoading, isError } = useRestaurantHoursQuery();

  if (isLoading) return <RestaurantHoursSkeleton />;

  if (isError) {
    return (
      <div className="px-4 lg:px-6" dir="rtl">
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            تعذر تحميل ساعات عمل المطعم.
          </CardContent>
        </Card>
      </div>
    );
  }

  const hours = (data?.data ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6 px-4 lg:px-6" dir="rtl">
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background text-foreground shadow-none">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner">
              <ClockIcon className="size-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">
                ساعات عمل المطعم
              </h1>
              <p className="text-sm text-muted-foreground">
                إدارة أوقات الفتح والإغلاق، الجدول الأسبوعي، نوافذ التوصيل، وقت الإقفال، والإغلاق المؤقت.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full px-4 py-1.5">
            {toText(hours.timezone, "Asia/Riyadh")}
          </Badge>
        </CardContent>
      </Card>

      <StatusStrip hours={hours} />
      <RestaurantHoursFormContent key={dataUpdatedAt} hours={hours} />
    </div>
  );
}

function StatusStrip({ hours }: { hours: Record<string, unknown> }) {
  const isOpenNow = typeof hours.isOpenNow === "boolean" ? hours.isOpenNow : false;
  const restaurantIsOpen = typeof hours.restaurant_is_open === "boolean" ? hours.restaurant_is_open : true;
  const closureActive = readClosure(hours.temporary_closure ?? hours.temporaryClosure);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <StatusCard label="مفتوح الآن" value={isOpenNow ? "نعم" : "لا"} badge={<Badge variant={isOpenNow ? "default" : "secondary"}>isOpenNow</Badge>} />
      <StatusCard label="استقبال الطلبات" value={restaurantIsOpen ? "مفعّل" : "متوقف"} />
      <StatusCard label="إغلاق مؤقت" value={closureActive ? "مفعل" : "غير مفعل"} />
      <StatusCard label="المنطقة الزمنية" value={toText(hours.timezone, "Asia/Riyadh")} />
    </div>
  );
}

function StatusCard({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-black tracking-normal">{value}</p>
        </div>
        {badge}
      </CardContent>
    </Card>
  );
}

function RestaurantHoursFormContent({ hours }: { hours: Record<string, unknown> }) {
  const updateHours = useUpdateRestaurantHoursMutation();
  const initialForm = useMemo<RestaurantHoursForm>(() => ({
    restaurant_open_time: toText(hours.restaurant_open_time, "10:00"),
    restaurant_close_time: toText(hours.restaurant_close_time, "23:00"),
    restaurant_is_open: typeof hours.restaurant_is_open === "boolean" ? hours.restaurant_is_open : true,
    cutoff_time: toText(hours.cutoff_time),
    delivery_windows: Array.isArray(hours.delivery_windows) ? hours.delivery_windows.map(String) : [],
    restaurant_hours: buildSchedule(hours),
    temporary_closure: readClosure(hours.temporary_closure ?? hours.temporaryClosure),
  }), [hours]);

  const [form, setForm] = useState<RestaurantHoursForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof RestaurantHoursForm>(key: K, value: RestaurantHoursForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateScheduleRow = (dayOfWeek: number, patch: Partial<ScheduleRow>) => setForm((current) => ({ ...current, restaurant_hours: current.restaurant_hours.map((row) => row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row) }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const windows = form.delivery_windows.filter(Boolean);
    if (new Set(windows).size !== windows.length) {
      setFormError("لا يمكن تكرار نفس نافذة التوصيل.");
      return;
    }
    if (windows.some((window) => !windowPattern.test(window))) {
      setFormError("راجع تنسيق نوافذ التوصيل (HH:mm-HH:mm).");
      return;
    }

    updateHours.mutate({
      restaurant_open_time: form.restaurant_open_time,
      restaurant_close_time: form.restaurant_close_time,
      restaurant_is_open: form.restaurant_is_open,
      cutoff_time: form.cutoff_time || undefined,
      delivery_windows: windows,
      restaurant_hours: form.restaurant_hours,
      temporary_closure: { isActive: form.temporary_closure },
    } as never);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle>التحكم العام</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
            <Label>المطعم مفتوح</Label>
            <Switch checked={form.restaurant_is_open} onCheckedChange={(checked) => updateField("restaurant_is_open", checked)} />
          </div>
          <Field label="وقت فتح المطعم" value={form.restaurant_open_time} onChange={(value) => updateField("restaurant_open_time", value)} />
          <Field label="وقت إغلاق المطعم" value={form.restaurant_close_time} onChange={(value) => updateField("restaurant_close_time", value)} />
          <Field label="وقت إقفال تعديلات الاشتراك" value={form.cutoff_time} onChange={(value) => updateField("cutoff_time", value)} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle>الجدول الأسبوعي</CardTitle></CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {form.restaurant_hours.map((row) => (
            <div key={row.dayOfWeek} className="grid gap-3 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center">
              <div><p className="font-black">{dayLabels[row.dayOfWeek]?.ar}</p><p className="text-xs text-muted-foreground">dayOfWeek: {row.dayOfWeek}</p></div>
              <Input type="time" value={row.openTime} disabled={row.isClosed} onChange={(event) => updateScheduleRow(row.dayOfWeek, { openTime: event.target.value })} dir="ltr" />
              <Input type="time" value={row.closeTime} disabled={row.isClosed} onChange={(event) => updateScheduleRow(row.dayOfWeek, { closeTime: event.target.value })} dir="ltr" />
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">مغلق</span><Switch checked={row.isClosed} onCheckedChange={(checked) => updateScheduleRow(row.dayOfWeek, { isClosed: checked })} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle>نوافذ التوصيل والإغلاق المؤقت</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Label>نوافذ التوصيل</Label>
            <Textarea value={form.delivery_windows.join("\n")} onChange={(event) => updateField("delivery_windows", event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))} rows={5} placeholder="12:00-14:00" dir="ltr" />
            <p className="text-xs text-muted-foreground">كل نافذة في سطر مستقل بصيغة HH:mm-HH:mm.</p>
          </div>
          <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4">
            <div><Label>إغلاق مؤقت</Label><p className="text-xs text-muted-foreground">يرسل temporary_closure.isActive فقط.</p></div>
            <Switch checked={form.temporary_closure} onCheckedChange={(checked) => updateField("temporary_closure", checked)} />
          </div>
        </CardContent>
      </Card>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <div className="flex justify-end"><Button type="submit" disabled={updateHours.isPending}><SaveIcon className="size-4" />{updateHours.isPending ? "جاري الحفظ..." : "حفظ ساعات العمل"}</Button></div>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type="time" value={value} onChange={(event) => onChange(event.target.value)} dir="ltr" /></div>;
}

function RestaurantHoursSkeleton() {
  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}