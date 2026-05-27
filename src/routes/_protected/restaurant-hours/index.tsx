import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClockIcon, SaveIcon } from "lucide-react";

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

type RestaurantHoursForm = {
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  cutoff_time: string;
  delivery_windows: string;
  restaurant_hours: string;
  temporary_closure: string;
};

const stringifyJson = (value: unknown) =>
  value === undefined || value === null ? "" : JSON.stringify(value, null, 2);

const parseJsonField = (value: string) => {
  if (!value.trim()) return null;
  return JSON.parse(value);
};

export const Route = createFileRoute("/_protected/restaurant-hours/")({
  component: RestaurantHoursPage,
});

function RestaurantHoursPage() {
  const { data, dataUpdatedAt, isLoading, isError } = useRestaurantHoursQuery();

  if (isLoading) return <RestaurantHoursSkeleton />;

  if (isError) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            تعذر تحميل ساعات العمل.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 text-right lg:px-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            ساعات العمل
          </h1>
          <p className="text-sm text-muted-foreground">
            تحديث أوقات التشغيل ونوافذ التوصيل وحالة الإغلاق المؤقت.
          </p>
        </div>
        <ClockIcon className="size-6 text-muted-foreground" />
      </div>

      <RestaurantHoursFormContent key={dataUpdatedAt} hours={data?.data ?? {}} />
    </div>
  );
}

function RestaurantHoursFormContent({
  hours,
}: {
  hours: Record<string, unknown>;
}) {
  const updateHours = useUpdateRestaurantHoursMutation();
  const initialForm = useMemo<RestaurantHoursForm>(
    () => ({
      restaurant_open_time: String(hours.restaurant_open_time ?? "00:00"),
      restaurant_close_time: String(hours.restaurant_close_time ?? "23:59"),
      restaurant_is_open: Boolean(hours.restaurant_is_open ?? true),
      cutoff_time: String(hours.cutoff_time ?? ""),
      delivery_windows: Array.isArray(hours.delivery_windows)
        ? hours.delivery_windows.join("\n")
        : "",
      restaurant_hours: stringifyJson(hours.restaurant_hours),
      temporary_closure: stringifyJson(hours.temporary_closure),
    }),
    [hours]
  );

  const [form, setForm] = useState<RestaurantHoursForm>(initialForm);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const updateField = <K extends keyof RestaurantHoursForm>(
    key: K,
    value: RestaurantHoursForm[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJsonError(null);

    try {
      updateHours.mutate({
        restaurant_open_time: form.restaurant_open_time,
        restaurant_close_time: form.restaurant_close_time,
        restaurant_is_open: form.restaurant_is_open,
        cutoff_time: form.cutoff_time || undefined,
        delivery_windows: form.delivery_windows
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        weekly_schedule: parseJsonField(form.restaurant_hours),
        temporary_closure: parseJsonField(form.temporary_closure),
      });
    } catch {
      setJsonError("جدول الأسبوع أو بيانات الإغلاق المؤقت ليست بصيغة JSON صحيحة.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>جدول التشغيل الحالي</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                checked={form.restaurant_is_open}
                onCheckedChange={(checked) =>
                  updateField("restaurant_is_open", checked)
                }
              />
              <Label>مفتوح لاستقبال الطلبات</Label>
            </div>
            <Field
              label="وقت الفتح"
              value={form.restaurant_open_time}
              onChange={(value) => updateField("restaurant_open_time", value)}
            />
            <Field
              label="وقت الإغلاق"
              value={form.restaurant_close_time}
              onChange={(value) => updateField("restaurant_close_time", value)}
            />
            <Field
              label="آخر وقت لقبول الطلب"
              value={form.cutoff_time}
              onChange={(value) => updateField("cutoff_time", value)}
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="delivery-windows">نوافذ التوصيل</Label>
              <Textarea
                id="delivery-windows"
                value={form.delivery_windows}
                onChange={(event) =>
                  updateField("delivery_windows", event.target.value)
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الجدول المتقدمة</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekly-schedule">جدول الأسبوع بصيغة JSON</Label>
              <Textarea
                id="weekly-schedule"
                value={form.restaurant_hours}
                onChange={(event) =>
                  updateField("restaurant_hours", event.target.value)
                }
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temporary-closure">الإغلاق المؤقت بصيغة JSON</Label>
              <Textarea
                id="temporary-closure"
                value={form.temporary_closure}
                onChange={(event) =>
                  updateField("temporary_closure", event.target.value)
                }
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {jsonError ? (
          <p className="text-sm text-destructive">{jsonError}</p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={updateHours.isPending}>
            <SaveIcon className="size-4" />
            حفظ ساعات العمل
          </Button>
        </div>
      </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function RestaurantHoursSkeleton() {
  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
