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

type RestaurantHoursForm = {
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  cutoff_time: string;
  delivery_windows: string;
  weekly_schedule: string;
  temporary_closure: string;
};

const toText = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const stringifyJson = (value: unknown) =>
  value === undefined || value === null ? "" : JSON.stringify(value, null, 2);

const parseJsonField = (value: string) => {
  if (!value.trim()) return null;
  return JSON.parse(value);
};

const readSchedule = (hours: Record<string, unknown>) =>
  hours.weekly_schedule ?? hours.restaurant_hours;

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
            Unable to load restaurant hours.
          </CardContent>
        </Card>
      </div>
    );
  }

  const hours = data?.data ?? {};

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Restaurant Hours
          </h1>
          <p className="text-sm text-muted-foreground">
            Operating state, cutoff time, and delivery windows from the backend
            restaurant-hours contract.
          </p>
        </div>
        <ClockIcon className="size-6 text-muted-foreground" />
      </div>

      <StatusStrip hours={hours} />
      <RestaurantHoursFormContent key={dataUpdatedAt} hours={hours} />
    </div>
  );
}

function StatusStrip({ hours }: { hours: Record<string, unknown> }) {
  const isOpenNow =
    typeof hours.isOpenNow === "boolean" ? hours.isOpenNow : null;
  const restaurantIsOpen =
    typeof hours.restaurant_is_open === "boolean"
      ? hours.restaurant_is_open
      : null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <StatusCard
        label="Open now"
        value={
          isOpenNow === null ? "Not provided" : isOpenNow ? "Open" : "Closed"
        }
        badge={
          <Badge variant={isOpenNow ? "default" : "secondary"}>
            Backend isOpenNow
          </Badge>
        }
      />
      <StatusCard
        label="Accepting orders"
        value={
          restaurantIsOpen === null
            ? "Not provided"
            : restaurantIsOpen
              ? "Enabled"
              : "Paused"
        }
      />
      <StatusCard label="Timezone" value={toText(hours.timezone) || "-"} />
    </div>
  );
}

function StatusCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-normal">{value}</p>
        </div>
        {badge}
      </CardContent>
    </Card>
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
      restaurant_open_time: toText(hours.restaurant_open_time),
      restaurant_close_time: toText(hours.restaurant_close_time),
      restaurant_is_open: hours.restaurant_is_open === true,
      cutoff_time: toText(hours.cutoff_time),
      delivery_windows: Array.isArray(hours.delivery_windows)
        ? hours.delivery_windows.map(String).join("\n")
        : "",
      weekly_schedule: stringifyJson(readSchedule(hours)),
      temporary_closure: stringifyJson(hours.temporary_closure),
    }),
    [hours]
  );

  const [form, setForm] = useState<RestaurantHoursForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof RestaurantHoursForm>(
    key: K,
    value: RestaurantHoursForm[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!form.restaurant_open_time.trim() || !form.restaurant_close_time.trim()) {
      setFormError("Open and close time are required by the backend contract.");
      return;
    }

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
        weekly_schedule: parseJsonField(form.weekly_schedule),
        temporary_closure: parseJsonField(form.temporary_closure),
      });
    } catch {
      setFormError("Schedule or temporary closure JSON is invalid.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Operating Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={form.restaurant_is_open}
              onCheckedChange={(checked) =>
                updateField("restaurant_is_open", checked)
              }
            />
            <Label>Accept orders</Label>
          </div>
          <Field
            label="Open time"
            value={form.restaurant_open_time}
            onChange={(value) => updateField("restaurant_open_time", value)}
          />
          <Field
            label="Close time"
            value={form.restaurant_close_time}
            onChange={(value) => updateField("restaurant_close_time", value)}
          />
          <Field
            label="Order cutoff"
            value={form.cutoff_time}
            onChange={(value) => updateField("cutoff_time", value)}
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="delivery-windows">Delivery windows</Label>
            <Textarea
              id="delivery-windows"
              value={form.delivery_windows}
              onChange={(event) =>
                updateField("delivery_windows", event.target.value)
              }
              rows={4}
              placeholder="One backend delivery window per line"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Schedule Payload</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weekly-schedule">weekly_schedule JSON</Label>
            <Textarea
              id="weekly-schedule"
              value={form.weekly_schedule}
              onChange={(event) =>
                updateField("weekly_schedule", event.target.value)
              }
              rows={12}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temporary-closure">temporary_closure JSON</Label>
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

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={updateHours.isPending}>
          <SaveIcon className="size-4" />
          Save restaurant hours
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
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
