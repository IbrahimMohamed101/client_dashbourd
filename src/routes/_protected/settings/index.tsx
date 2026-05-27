import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader } from "@/components/global/loader";
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
  settingsQueryOptions,
  useUpdateSettingsMutation,
} from "@/hooks/useSettingsQuery";
import type { DashboardSettings } from "@/types/settingsTypes";

type SettingsFormState = {
  restaurant_is_open: boolean;
  delivery_windows: string;
  skip_allowance: string;
  premium_price: string;
  subscription_delivery_fee_halala: string;
  vat_percentage: string;
  custom_salad_base_price: string;
  custom_meal_base_price: string;
};

const toFormState = (settings: DashboardSettings): SettingsFormState => ({
  restaurant_is_open: settings.restaurant_is_open ?? true,
  delivery_windows: (settings.delivery_windows ?? []).join("\n"),
  skip_allowance: String(settings.skip_allowance ?? 3),
  premium_price: String(settings.premium_price ?? 20),
  subscription_delivery_fee_halala: String(
    settings.subscription_delivery_fee_halala ?? 0
  ),
  vat_percentage: String(settings.vat_percentage ?? 0),
  custom_salad_base_price: String(settings.custom_salad_base_price ?? 0),
  custom_meal_base_price: String(settings.custom_meal_base_price ?? 0),
});

const parseWindows = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const Route = createFileRoute("/_protected/settings/")({
  component: SettingsPage,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(settingsQueryOptions),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل الإعدادات..." />
  ),
});

function SettingsPage() {
  const { data } = useSuspenseQuery(settingsQueryOptions);
  const updateSettings = useUpdateSettingsMutation();
  const [form, setForm] = useState<SettingsFormState>(() =>
    toFormState(data.data)
  );

  useEffect(() => {
    setForm(toFormState(data.data));
  }, [data.data]);

  const updateField = <K extends keyof SettingsFormState>(
    key: K,
    value: SettingsFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings.mutate({
      restaurant_is_open: form.restaurant_is_open,
      delivery_windows: parseWindows(form.delivery_windows),
      skip_allowance: Number(form.skip_allowance),
      premium_price: Number(form.premium_price),
      subscription_delivery_fee_halala: Number(
        form.subscription_delivery_fee_halala
      ),
      vat_percentage: Number(form.vat_percentage),
      custom_salad_base_price: Number(form.custom_salad_base_price),
      custom_meal_base_price: Number(form.custom_meal_base_price),
    });
  };

  return (
    <form className="space-y-6 px-4 lg:px-6" dir="rtl" onSubmit={handleSubmit}>
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader>
          <CardTitle>الإعدادات العامة</CardTitle>
          <CardDescription>
            مرتبطة بعقد backend المؤكد لـ /api/dashboard/settings.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>التشغيل والتوصيل</CardTitle>
            <CardDescription>
              القيم المحفوظة عبر PATCH /api/dashboard/settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="text-base">المطعم مفتوح</Label>
                <p className="text-sm text-muted-foreground">
                  يتحكم في مفتاح التشغيل العام.
                </p>
              </div>
              <Switch
                checked={form.restaurant_is_open}
                onCheckedChange={(checked) =>
                  updateField("restaurant_is_open", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-windows">نوافذ التوصيل</Label>
              <textarea
                id="delivery-windows"
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={form.delivery_windows}
                onChange={(event) =>
                  updateField("delivery_windows", event.target.value)
                }
                placeholder="08:00-11:00"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="skip-allowance"
                label="أيام التخطي"
                value={form.skip_allowance}
                onChange={(value) => updateField("skip_allowance", value)}
              />
              <NumberField
                id="vat-percentage"
                label="نسبة الضريبة"
                value={form.vat_percentage}
                onChange={(value) => updateField("vat_percentage", value)}
                step="0.01"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأسعار</CardTitle>
            <CardDescription>
              الأسعار هنا تحفظ بنفس الوحدات التي يعيدها backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="premium-price"
              label="سعر الإضافة المميزة"
              value={form.premium_price}
              onChange={(value) => updateField("premium_price", value)}
            />
            <NumberField
              id="subscription-delivery-fee"
              label="رسوم توصيل الاشتراك بالهللة"
              value={form.subscription_delivery_fee_halala}
              onChange={(value) =>
                updateField("subscription_delivery_fee_halala", value)
              }
            />
            <NumberField
              id="custom-salad-base-price"
              label="سعر السلطة المخصصة"
              value={form.custom_salad_base_price}
              onChange={(value) =>
                updateField("custom_salad_base_price", value)
              }
            />
            <NumberField
              id="custom-meal-base-price"
              label="سعر الوجبة المخصصة"
              value={form.custom_meal_base_price}
              onChange={(value) =>
                updateField("custom_meal_base_price", value)
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  step = "1",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
