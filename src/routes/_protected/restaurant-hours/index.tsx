import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader } from "@/components/global/loader";
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
import { Switch } from "@/components/ui/switch";
import {
  restaurantHoursQueryOptions,
  useUpdateRestaurantHoursMutation,
} from "@/hooks/useRestaurantHoursQuery";
import type {
  RestaurantHoursResponse,
  RestaurantScheduleRow,
} from "@/types/restaurantHoursTypes";

type DayRow = {
  dayOfWeek: number;
  label: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

type HoursFormState = {
  restaurant_open_time: string;
  restaurant_close_time: string;
  cutoff_time: string;
  restaurant_is_open: boolean;
  delivery_windows: string;
  weeklySchedule: DayRow[];
};

const DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const timeFromRow = (row: RestaurantScheduleRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
};

const getDayIndex = (row: RestaurantScheduleRow) => {
  const raw = Number(row.dayOfWeek ?? row.weekday ?? row.day);
  if (!Number.isFinite(raw)) return null;
  return raw === 7 ? 0 : raw;
};

const normalizeSchedule = (
  rows: RestaurantScheduleRow[] | null | undefined,
  fallbackOpen: string,
  fallbackClose: string
): DayRow[] =>
  DAYS.map((label, dayOfWeek) => {
    const row = rows?.find((item) => getDayIndex(item) === dayOfWeek);
    return {
      dayOfWeek,
      label,
      openTime: row
        ? timeFromRow(row, [
            "openTime",
            "restaurant_open_time",
            "opensAt",
            "from",
          ]) || fallbackOpen
        : fallbackOpen,
      closeTime: row
        ? timeFromRow(row, [
            "closeTime",
            "restaurant_close_time",
            "closesAt",
            "to",
          ]) || fallbackClose
        : fallbackClose,
      isClosed: Boolean(row?.isClosed ?? row?.closed ?? false),
    };
  });

const toFormState = (data: RestaurantHoursResponse): HoursFormState => {
  const hours = data.data;
  const openTime = String(hours.restaurant_open_time ?? "00:00");
  const closeTime = String(hours.restaurant_close_time ?? "23:59");
  return {
    restaurant_open_time: openTime,
    restaurant_close_time: closeTime,
    cutoff_time: String(hours.cutoff_time ?? ""),
    restaurant_is_open: Boolean(hours.restaurant_is_open ?? true),
    delivery_windows: Array.isArray(hours.delivery_windows)
      ? hours.delivery_windows.map(String).join("\n")
      : "",
    weeklySchedule: normalizeSchedule(
      Array.isArray(hours.restaurant_hours)
        ? (hours.restaurant_hours as RestaurantScheduleRow[])
        : null,
      openTime,
      closeTime
    ),
  };
};

const parseWindows = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const Route = createFileRoute("/_protected/restaurant-hours/")({
  component: RestaurantHoursPage,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(restaurantHoursQueryOptions),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل ساعات العمل..." />
  ),
});

function RestaurantHoursPage() {
  const { data } = useSuspenseQuery(restaurantHoursQueryOptions);
  const updateHours = useUpdateRestaurantHoursMutation();
  const [form, setForm] = useState<HoursFormState>(() => toFormState(data));

  useEffect(() => {
    setForm(toFormState(data));
  }, [data]);

  const updateDay = (dayOfWeek: number, patch: Partial<DayRow>) => {
    setForm((current) => ({
      ...current,
      weeklySchedule: current.weeklySchedule.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day
      ),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateHours.mutate({
      restaurant_open_time: form.restaurant_open_time,
      restaurant_close_time: form.restaurant_close_time,
      restaurant_is_open: form.restaurant_is_open,
      delivery_windows: parseWindows(form.delivery_windows),
      cutoff_time: form.cutoff_time || undefined,
      weeklySchedule: form.weeklySchedule.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        openTime: day.openTime,
        closeTime: day.closeTime,
        isClosed: day.isClosed,
      })),
    });
  };

  return (
    <form className="space-y-6 px-4 lg:px-6" dir="rtl" onSubmit={handleSubmit}>
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>ساعات العمل</CardTitle>
            <CardDescription>
              مرتبطة بعقد /api/dashboard/settings/restaurant-hours.
            </CardDescription>
          </div>
          <Badge variant={data.data.isOpenNow ? "default" : "destructive"}>
            {data.data.isOpenNow ? "مفتوح الآن" : "مغلق الآن"}
          </Badge>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإعداد العام</CardTitle>
          <CardDescription>الأوقات بتوقيت Asia/Riyadh.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-4">
            <div>
              <Label className="text-base">مفتاح فتح المطعم</Label>
              <p className="text-sm text-muted-foreground">
                يرسل الحقل restaurant_is_open.
              </p>
            </div>
            <Switch
              checked={form.restaurant_is_open}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  restaurant_is_open: checked,
                }))
              }
            />
          </div>
          <TimeField
            id="default-open"
            label="وقت الفتح العام"
            value={form.restaurant_open_time}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                restaurant_open_time: value,
              }))
            }
          />
          <TimeField
            id="default-close"
            label="وقت الإغلاق العام"
            value={form.restaurant_close_time}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                restaurant_close_time: value,
              }))
            }
          />
          <TimeField
            id="cutoff"
            label="وقت الإقفال اليومي"
            value={form.cutoff_time}
            onChange={(value) =>
              setForm((current) => ({ ...current, cutoff_time: value }))
            }
          />
          <div className="space-y-2">
            <Label htmlFor="timezone">المنطقة الزمنية</Label>
            <Input
              id="timezone"
              value={String(data.data.timezone ?? "Asia/Riyadh")}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الجدول الأسبوعي</CardTitle>
          <CardDescription>
            يتم حفظه في weeklySchedule، ويقرأه backend من restaurant_hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.weeklySchedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_160px_160px_120px]"
            >
              <div className="flex items-center">
                <div className="font-medium">{day.label}</div>
              </div>
              <TimeField
                id={`open-${day.dayOfWeek}`}
                label="يفتح"
                value={day.openTime}
                disabled={day.isClosed}
                onChange={(value) =>
                  updateDay(day.dayOfWeek, { openTime: value })
                }
              />
              <TimeField
                id={`close-${day.dayOfWeek}`}
                label="يغلق"
                value={day.closeTime}
                disabled={day.isClosed}
                onChange={(value) =>
                  updateDay(day.dayOfWeek, { closeTime: value })
                }
              />
              <div className="flex items-end justify-between gap-3 pb-2">
                <Label htmlFor={`closed-${day.dayOfWeek}`}>مغلق</Label>
                <Switch
                  id={`closed-${day.dayOfWeek}`}
                  checked={day.isClosed}
                  onCheckedChange={(checked) =>
                    updateDay(day.dayOfWeek, { isClosed: checked })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نوافذ التوصيل</CardTitle>
          <CardDescription>
            هذا endpoint يعيد delivery_windows، ولا يعيد pickup_windows مباشرة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={form.delivery_windows}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                delivery_windows: event.target.value,
              }))
            }
            placeholder="08:00-11:00"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateHours.isPending}>
          {updateHours.isPending ? "جاري الحفظ..." : "حفظ ساعات العمل"}
        </Button>
      </div>
    </form>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
