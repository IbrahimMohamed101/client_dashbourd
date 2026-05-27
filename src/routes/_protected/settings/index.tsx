import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SaveIcon, SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
} from "@/hooks/useSettingsQuery";

type SettingsForm = {
  restaurant_is_open: boolean;
  cutoff_time: string;
  restaurant_open_time: string;
  restaurant_close_time: string;
  delivery_windows: string;
  skip_allowance: string;
  premium_price: string;
  subscription_delivery_fee_halala: string;
  vat_percentage: string;
  custom_salad_base_price: string;
  custom_meal_base_price: string;
};

const toText = (value: unknown, fallback = "") =>
  value === null || value === undefined ? fallback : String(value);

const toNumberOrUndefined = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const Route = createFileRoute("/_protected/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data, dataUpdatedAt, isLoading, isError } = useSettingsQuery();

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            تعذر تحميل إعدادات لوحة التحكم.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 text-right lg:px-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">
            إدارة إعدادات التشغيل والأسعار الظاهرة من الخادم.
          </p>
        </div>
        <SettingsIcon className="size-6 text-muted-foreground" />
      </div>

      <SettingsFormContent key={dataUpdatedAt} settings={data?.data ?? {}} />
    </div>
  );
}

function SettingsFormContent({ settings }: { settings: Record<string, unknown> }) {
  const updateSettings = useUpdateSettingsMutation();
  const initialForm = useMemo<SettingsForm>(
    () => ({
      restaurant_is_open: Boolean(settings.restaurant_is_open ?? true),
      cutoff_time: toText(settings.cutoff_time, "00:00"),
      restaurant_open_time: toText(settings.restaurant_open_time, "00:00"),
      restaurant_close_time: toText(settings.restaurant_close_time, "23:59"),
      delivery_windows: Array.isArray(settings.delivery_windows)
        ? settings.delivery_windows.join("\n")
        : "",
      skip_allowance: toText(settings.skip_allowance, "3"),
      premium_price: toText(settings.premium_price, "20"),
      subscription_delivery_fee_halala: toText(
        settings.subscription_delivery_fee_halala,
        "0"
      ),
      vat_percentage: toText(settings.vat_percentage, "0"),
      custom_salad_base_price: toText(settings.custom_salad_base_price, "0"),
      custom_meal_base_price: toText(settings.custom_meal_base_price, "0"),
    }),
    [settings]
  );
  const [form, setForm] = useState<SettingsForm>(initialForm);

  const updateField = <K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings.mutate({
      restaurant_is_open: form.restaurant_is_open,
      cutoff_time: form.cutoff_time,
      restaurant_open_time: form.restaurant_open_time,
      restaurant_close_time: form.restaurant_close_time,
      delivery_windows: form.delivery_windows
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
      skip_allowance: toNumberOrUndefined(form.skip_allowance),
      premium_price: toNumberOrUndefined(form.premium_price),
      subscription_delivery_fee_halala: toNumberOrUndefined(
        form.subscription_delivery_fee_halala
      ),
      vat_percentage: toNumberOrUndefined(form.vat_percentage),
      custom_salad_base_price: toNumberOrUndefined(
        form.custom_salad_base_price
      ),
      custom_meal_base_price: toNumberOrUndefined(form.custom_meal_base_price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>حالة المطعم</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                checked={form.restaurant_is_open}
                onCheckedChange={(checked) =>
                  updateField("restaurant_is_open", checked)
                }
              />
              <Label>المطعم مفتوح</Label>
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
            <Field
              label="عدد مرات التخطي المسموح"
              type="number"
              value={form.skip_allowance}
              onChange={(value) => updateField("skip_allowance", value)}
            />
            <Field
              label="نسبة ضريبة القيمة المضافة"
              type="number"
              value={form.vat_percentage}
              onChange={(value) => updateField("vat_percentage", value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأسعار</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field
              label="سعر الوجبة المميزة"
              type="number"
              value={form.premium_price}
              onChange={(value) => updateField("premium_price", value)}
            />
            <Field
              label="رسوم توصيل الاشتراك بالهللة"
              type="number"
              value={form.subscription_delivery_fee_halala}
              onChange={(value) =>
                updateField("subscription_delivery_fee_halala", value)
              }
            />
            <Field
              label="السعر الأساسي للسلطة المخصصة"
              type="number"
              value={form.custom_salad_base_price}
              onChange={(value) => updateField("custom_salad_base_price", value)}
            />
            <Field
              label="السعر الأساسي للوجبة المخصصة"
              type="number"
              value={form.custom_meal_base_price}
              onChange={(value) => updateField("custom_meal_base_price", value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نوافذ التوصيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="delivery-windows">نافذة واحدة في كل سطر</Label>
            <Textarea
              id="delivery-windows"
              value={form.delivery_windows}
              onChange={(event) =>
                updateField("delivery_windows", event.target.value)
              }
              rows={5}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            <SaveIcon className="size-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </form>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: React.HTMLInputTypeAttribute;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
