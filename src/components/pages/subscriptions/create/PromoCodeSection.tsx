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
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { CreateSubscriptionSchemaType } from "@/lib/validations/createSubscriptionSchema";
import { buildSubscriptionQuotePayload } from "@/utils/buildSubscriptionCreationPayload";
import { fetchSubscriptionQuote } from "@/utils/fetchSubscriptionsData";
import { BadgePercent, CheckCircle2, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

export type PromoQuoteResult = {
  code: string;
  discountHalala: number;
  beforeDiscountHalala: number;
  totalHalala: number;
  currency: string;
};

interface PromoCodeSectionProps {
  form: UseFormReturn<CreateSubscriptionSchemaType>;
  onQuoteChange?: (result: PromoQuoteResult | null) => void;
}

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

export function readPromoQuoteResult(
  response: unknown,
  fallbackCode: string
): PromoQuoteResult {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  const breakdown = asRecord(data?.breakdown);
  const pricing = asRecord(data?.pricing);
  const checkoutSummary = asRecord(data?.checkoutSummary);
  const checkoutPricing = asRecord(checkoutSummary?.pricing);
  const promo = asRecord(data?.appliedPromo) || asRecord(data?.promoCode);

  const discountHalala = readNumber(
    breakdown?.discountHalala,
    pricing?.discountHalala,
    checkoutPricing?.discountHalala,
    promo?.discountAmountHalala
  );
  const totalHalala = readNumber(
    breakdown?.totalHalala,
    pricing?.totalHalala,
    checkoutPricing?.totalHalala,
    data?.totalHalala
  );
  const beforeDiscountHalala = readNumber(
    breakdown?.grossTotalHalala,
    pricing?.grossTotalHalala,
    checkoutPricing?.grossTotalHalala,
    totalHalala + discountHalala
  );

  return {
    code: String(promo?.code || fallbackCode).trim().toUpperCase(),
    discountHalala,
    beforeDiscountHalala,
    totalHalala,
    currency: String(
      breakdown?.currency ||
        pricing?.currency ||
        checkoutPricing?.currency ||
        data?.currency ||
        "SAR"
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

export function PromoCodeSection({
  form,
  onQuoteChange,
}: PromoCodeSectionProps) {
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoResult, setPromoResult] = useState<PromoQuoteResult | null>(null);

  useEffect(() => {
    const subscription = form.watch((_values, { name }) => {
      if (!name || name === "promoCode" || name === "paymentMethod") return;
      setPromoResult(null);
      setPromoError("");
      onQuoteChange?.(null);
    });
    return () => subscription.unsubscribe();
  }, [form, onQuoteChange]);

  function clearPromoResult() {
    setPromoResult(null);
    setPromoError("");
    onQuoteChange?.(null);
  }

  async function handleApplyPromoCode() {
    const code = String(form.getValues("promoCode") || "").trim().toUpperCase();
    form.setValue("promoCode", code, { shouldDirty: true, shouldValidate: true });
    clearPromoResult();

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
      const result = readPromoQuoteResult(response, code);
      setPromoResult(result);
      onQuoteChange?.(result);
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
            <BadgePercent className="size-4" />
          </div>
          كود الخصم
        </CardTitle>
        <CardDescription>
          اختياري — يُراجع من الباك إند على حساب العميل والباقة والخيارات المحددة.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="promo-code" className="sr-only">
              كود الخصم
            </Label>
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
                clearPromoResult();
              }}
              className="font-mono uppercase"
            />
          </div>
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
              الخصم:{" "}
              <strong>
                {formatMoney(promoResult.discountHalala, promoResult.currency)}
              </strong>
            </p>
            <p>
              الإجمالي بعد الخصم:{" "}
              <strong>
                {formatMoney(promoResult.totalHalala, promoResult.currency)}
              </strong>
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
