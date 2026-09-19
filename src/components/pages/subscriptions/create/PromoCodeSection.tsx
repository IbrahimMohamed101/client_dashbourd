import { BadgePercent, CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateSubscriptionSchemaType } from "@/lib/validations/createSubscriptionSchema";
import type { AppliedPromoQuote } from "@/utils/subscriptionPromoQuote";
import type { PromoCodeDTO } from "@/types/financeTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  form: UseFormReturn<CreateSubscriptionSchemaType>;
  appliedPromo: AppliedPromoQuote | null;
  error: string | null;
  isApplying: boolean;
  formatMoney: (halala: number, currency: string) => string;
  availablePromoCodes: PromoCodeDTO[];
  onApply: () => void;
  onUseCode: (code: string) => void;
};

function discountLabel(promo: PromoCodeDTO) {
  if (promo.discountType === "percentage") {
    return `${promo.discountValue}% خصم`;
  }

  return `${promo.discountValue} خصم`;
}

export function PromoCodeSection({
  form,
  appliedPromo,
  error,
  isApplying,
  formatMoney,
  availablePromoCodes,
  onApply,
  onUseCode,
}: Props) {
  const promoCode = form.watch("promoCode");

  return (
    <section
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
      data-testid="promo-code-section"
    >
      <div className="flex items-start gap-3 border-b px-4 py-4 sm:px-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BadgePercent className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">كود الخصم</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            اختر كودًا جاهزًا بالأسفل ليتم تعبئته وتطبيقه تلقائيًا، أو أدخل الكود يدويًا.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {availablePromoCodes.length > 0 ? (
          <div
            className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-4"
            data-testid="available-promo-codes"
          >
            <div className="mb-3 flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">أكواد الخصم المتاحة</p>
                <p className="text-xs text-muted-foreground">
                  اضغط «استخدام الكود» لتعبئته وتطبيقه مباشرة.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {availablePromoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="rounded-md bg-muted px-2 py-1 text-sm font-bold tracking-wide">
                        {promo.code}
                      </code>
                      <span className="text-sm font-semibold text-primary">
                        {discountLabel(promo)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {promo.appliesTo === "all"
                        ? "جميع الاستخدامات"
                        : "اشتراك"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => onUseCode(promo.code)}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    استخدام الكود
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            {...form.register("promoCode")}
            aria-label="كود الخصم"
            autoComplete="off"
            className="font-mono uppercase"
            dir="ltr"
            placeholder="WELCOME20"
            onChange={(event) => {
              form.setValue("promoCode", event.target.value.toUpperCase(), {
                shouldDirty: true,
              });
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={isApplying || !promoCode?.trim()}
            onClick={onApply}
            className="shrink-0 gap-2"
          >
            {isApplying && <Loader2 className="size-4 animate-spin" />}
            تطبيق الكود
          </Button>
        </div>

        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {appliedPromo ? (
          <div
            className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"
            role="status"
          >
            <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
              تم تطبيق {appliedPromo.code}
            </p>
            <p>
              الخصم:{" "}
              {formatMoney(appliedPromo.discountHalala, appliedPromo.currency)}
            </p>
            <p>
              الإجمالي بعد الخصم:{" "}
              {formatMoney(appliedPromo.totalHalala, appliedPromo.currency)}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
