import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { SaveIcon, SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
} from "@/hooks/useSettingsQuery";

type SettingsForm = {
  vat_percentage: string;
  skip_allowance: string;
  premium_price: string;
  subscription_delivery_fee_halala: string;
  custom_salad_base_price: string;
  custom_meal_base_price: string;
};

type SettingsField = {
  key: keyof SettingsForm;
  label: string;
  hint: string;
  suffix?: string;
};

const settingsFields: SettingsField[] = [
  {
    key: "vat_percentage",
    label: "VAT percentage",
    hint: "Backend value from vat_percentage",
    suffix: "%",
  },
  {
    key: "skip_allowance",
    label: "Skip allowance",
    hint: "Allowed subscription skips",
  },
  {
    key: "premium_price",
    label: "Premium meal price",
    hint: "Premium add-on price",
  },
  {
    key: "subscription_delivery_fee_halala",
    label: "Subscription delivery fee",
    hint: "Stored in halala",
  },
  {
    key: "custom_salad_base_price",
    label: "Custom salad base price",
    hint: "Base price for custom salads",
  },
  {
    key: "custom_meal_base_price",
    label: "Custom meal base price",
    hint: "Base price for custom meals",
  },
];

const toText = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const toNumberOrUndefined = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toPayload = (form: SettingsForm) =>
  Object.fromEntries(
    Object.entries(form)
      .map(([key, value]) => [key, toNumberOrUndefined(value)] as const)
      .filter(([, value]) => value !== undefined)
  );

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
            Unable to load dashboard settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Contract-backed pricing and policy values from the dashboard
            settings API.
          </p>
        </div>
        <SettingsIcon className="size-6 text-muted-foreground" />
      </div>

      <SettingsFormContent key={dataUpdatedAt} settings={data?.data ?? {}} />
    </div>
  );
}

function SettingsFormContent({
  settings,
}: {
  settings: Record<string, unknown>;
}) {
  const updateSettings = useUpdateSettingsMutation();
  const initialForm = useMemo<SettingsForm>(
    () => ({
      vat_percentage: toText(settings.vat_percentage),
      skip_allowance: toText(settings.skip_allowance),
      premium_price: toText(settings.premium_price),
      subscription_delivery_fee_halala: toText(
        settings.subscription_delivery_fee_halala
      ),
      custom_salad_base_price: toText(settings.custom_salad_base_price),
      custom_meal_base_price: toText(settings.custom_meal_base_price),
    }),
    [settings]
  );
  const [form, setForm] = useState<SettingsForm>(initialForm);

  const updateField = (key: keyof SettingsForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings.mutate(toPayload(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Core Values</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingsFields.map((field) => (
            <div
              key={field.key}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                </div>
                {field.suffix ? (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {field.suffix}
                  </span>
                ) : null}
              </div>
              <Input
                id={field.key}
                type="number"
                inputMode="decimal"
                value={form[field.key]}
                onChange={(event) =>
                  updateField(field.key, event.target.value)
                }
                placeholder="Fetched value"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          <SaveIcon className="size-4" />
          Save settings
        </Button>
      </div>
    </form>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 px-4 lg:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
