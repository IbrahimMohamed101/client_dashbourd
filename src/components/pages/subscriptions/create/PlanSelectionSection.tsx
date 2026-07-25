import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePackagesQuery } from "@/hooks/usePackagesQuery";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { buildSubscriptionQuotePayload } from "@/utils/buildSubscriptionCreationPayload";
import { fetchSubscriptionQuote } from "@/utils/fetchSubscriptionsData";
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Package,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateSubscriptionSchemaType } from "@/lib/validations/createSubscriptionSchema";
import type { Package as PackageType, GramsOption, MealOption } from "@/types/packageTypes";

interface PlanSelectionSectionProps {
  form: UseFormReturn<CreateSubscriptionSchemaType>;
  onPriceChange?: (price: { halala: number; currency?: string }) => void;
}

type PromoQuoteResult = {
  code: string;
  discountHalala: number;
  totalHalala: number;
  currency: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed);
  }
  return 0;
}

function readPromoQuoteResult(response: unknown, code: string): PromoQuoteResult {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  const breakdown = asRecord(data?.breakdown);
  const pricing = asRecord(data?.pricing);
  const promo = asRecord(data?.promoCode) || asRecord(data?.appliedPromo);

  return {
    code: String(promo?.code || code).trim().toUpperCase(),
    discountHalala: readNumber(
      breakdown?.discountHalala,
      pricing?.discountHalala,
      promo?.discountAmountHalala
    ),
    totalHalala: readNumber(
      breakdown?.totalHalala,
      pricing?.totalHalala,
      data?.totalHalala
    ),
    currency: String(
      breakdown?.currency || pricing?.currency || data?.currency || "SAR"
    ).toUpperCase(),
  };
}

function formatMoney(halala: number, currency: string): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(halala / 100);
}

export function PlanSelectionSection({
  form,
  onPriceChange,
}: PlanSelectionSectionProps) {
  const { data: packagesResponse } = usePackagesQuery();
  const packages = packagesResponse?.data || [];
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoResult, setPromoResult] = useState<PromoQuoteResult | null>(null);

  const selectedPlanId = form.watch("planId");
  const selectedPackage = packages.find(
    (pkg: PackageType) => (pkg.id || pkg._id) === selectedPlanId
  );

  const gramsOptions =
    selectedPackage?.gramsOptions?.filter((g: GramsOption) => g.isActive) || [];
  const selectedGrams = form.watch("grams");
  const selectedGramsOption = gramsOptions.find(
    (g: GramsOption) => Number(g.grams) === Number(selectedGrams)
  );
  const mealsOptions =
    selectedGramsOption?.mealsOptions?.filter((m: MealOption) => m.isActive) || [];
  const selectedMealsPerDay = form.watch("mealsPerDay");
  const selectedMealOption = mealsOptions.find(
    (m: MealOption) => Number(m.mealsPerDay) === Number(selectedMealsPerDay)
  );

  useEffect(() => {
    onPriceChange?.({
      halala: selectedMealOption?.priceHalala || 0,
      currency: selectedPackage?.currency || "SAR",
    });
  }, [
    onPriceChange,
    selectedMealOption?.priceHalala,
    selectedPackage?.currency,
  ]);

  async function handleApplyPromoCode() {
    const code = String(form.getValues("promoCode") || "").trim().toUpperCase();
    form.setValue("promoCode", code, { shouldDirty: true, shouldValidate: true });
    setPromoResult(null);
    setPromoError("");

    if (!code) {
      setPromoError("اكتب كود الخصم أولاً");
      return;
    }

    const valid = await form.trigger([
      "userId",
      "planId",
      "grams",
      "mealsPerDay",
      "startDate",
      "premiumItems",
      "addons",
      "delivery",
      "promoCode",
    ]);
    if (!valid) {
      setPromoError("أكمل بيانات الاشتراك والتوصيل أولاً ثم طبّق الكود");
      return;
    }

    setIsApplyingPromo(true);
    try {
      const payload = buildSubscriptionQuotePayload(form.getValues());
      const response = await fetchSubscriptionQuote(payload);
      setPromoResult(readPromoQuoteResult(response, code));
    } catch (error) {
      setPromoError(getApiErrorMessage(error));
    } finally {
      setIsApplyingPromo(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="size-4" />
          </div>
          اختيار الباقة
        </CardTitle>
        <CardDescription>اختر الباقة وحدد تفاصيل الاشتراك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">الباقة</Label>
          <Select
            value={selectedPlanId}
            onValueChange={(value) => {
              form.setValue("planId", value, { shouldValidate: true });
              form.setValue("grams", 0);
              form.setValue("mealsPerDay", 0);
              setPromoResult(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الباقة" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg: PackageType) => {
                const id = pkg.id || pkg._id;
                return (
                  <SelectItem key={id} value={id}>
                    {pkg.name?.ar || pkg.name?.en} — {pkg.daysCount} يوم
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {form.formState.errors.planId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.planId.message}
            </p>
          )}
        </div>

        {selectedPackage && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3">
            <CalendarDays className="size-5 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-semibold">{selectedPackage.name?.ar}</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-muted-foreground">{selectedPackage.daysCount} يوم</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">الجرامات</Label>
            <Select
              value={selectedGrams ? String(selectedGrams) : ""}
              onValueChange={(value) => {
                form.setValue("grams", Number(value), { shouldValidate: true });
                form.setValue("mealsPerDay", 0);
                setPromoResult(null);
              }}
              disabled={!selectedPlanId}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الجرامات" />
              </SelectTrigger>
              <SelectContent>
                {gramsOptions.map((g: GramsOption) => (
                  <SelectItem key={g.grams} value={String(g.grams)}>
                    {g.grams} جرام
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.grams && (
              <p className="text-xs text-destructive">
                {form.formState.errors.grams.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">عدد الوجبات في اليوم</Label>
            <Select
              value={selectedMealsPerDay ? String(selectedMealsPerDay) : ""}
              onValueChange={(value) => {
                form.setValue("mealsPerDay", Number(value), { shouldValidate: true });
                setPromoResult(null);
              }}
              disabled={!selectedGrams}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر عدد الوجبات" />
              </SelectTrigger>
              <SelectContent>
                {mealsOptions.map((m: MealOption) => (
                  <SelectItem key={m.mealsPerDay} value={String(m.mealsPerDay)}>
                    {m.mealsPerDay} وجبات — {(m.priceHalala / 100).toFixed(0)} ريال
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.mealsPerDay && (
              <p className="text-xs text-destructive">
                {form.formState.errors.mealsPerDay.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">تاريخ البداية</Label>
          <Input
            type="date"
            dir="ltr"
            {...form.register("startDate", {
              onChange: () => setPromoResult(null),
            })}
            className="text-left"
          />
          {form.formState.errors.startDate && (
            <p className="text-xs text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <BadgePercent className="size-5 text-primary" />
            <div>
              <Label htmlFor="promo-code" className="font-semibold">
                كود الخصم
              </Label>
              <p className="text-xs text-muted-foreground">
                اختياري — يُراجع من الباك إند على حساب العميل والباقـة المختارة
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="promo-code"
              dir="ltr"
              placeholder="مثال: WELCOME20"
              value={form.watch("promoCode") || ""}
              onChange={(event) => {
                form.setValue("promoCode", event.target.value.toUpperCase(), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setPromoResult(null);
                setPromoError("");
              }}
              className="font-mono uppercase"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyPromoCode}
              disabled={isApplyingPromo}
              className="shrink-0 gap-2"
            >
              {isApplyingPromo ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BadgePercent className="size-4" />
              )}
              تطبيق الكود
            </Button>
          </div>

          {form.formState.errors.promoCode?.message ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.promoCode.message}
            </p>
          ) : null}
          {promoError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {promoError}
            </p>
          ) : null}
          {promoResult ? (
            <div className="grid gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm sm:grid-cols-3">
              <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                تم تطبيق {promoResult.code}
              </p>
              <p>
                الخصم: <strong>{formatMoney(promoResult.discountHalala, promoResult.currency)}</strong>
              </p>
              <p>
                الإجمالي بعد الخصم: <strong>{formatMoney(promoResult.totalHalala, promoResult.currency)}</strong>
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
