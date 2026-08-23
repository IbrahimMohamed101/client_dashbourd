import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Save,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePromoCodeAppSelectionQuery,
  useUpdatePromoCodeAppSelectionMutation,
} from "@/hooks/usePromoCodesQuery";
import type { PromoCodeDTO } from "@/types/financeTypes";
import {
  formatPromoCodeDiscount,
  getPromoCodeName,
  getPromoCodeStatus,
} from "./promo-codes-columns";

const NO_PROMO_VALUE = "__no_app_promo__";

const issueLabels: Record<string, string> = {
  PROMO_NOT_FOUND: "كود الخصم المحدد غير موجود",
  PROMO_ARCHIVED: "كود الخصم مؤرشف",
  PROMO_INACTIVE: "كود الخصم غير مفعّل",
  PROMO_NOT_APPLICABLE_TO_SUBSCRIPTIONS: "الكود لا ينطبق على الاشتراكات",
  PROMO_APP_DISPLAY_DISABLED: "عرض الكود داخل التطبيق غير مفعّل",
  PROMO_HAS_NO_APP_PLACEMENT: "لم يتم اختيار موضع لعرض الكود",
  PROMO_NOT_STARTED: "موعد بدء العرض لم يأتِ بعد",
  PROMO_EXPIRED: "انتهت صلاحية كود الخصم",
  PROMO_USAGE_LIMIT_REACHED: "وصل كود الخصم إلى حد الاستخدام",
};

function readApiErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "object" &&
    error.response.data.error !== null &&
    "message" in error.response.data.error &&
    typeof error.response.data.error.message === "string"
  ) {
    return error.response.data.error.message;
  }
  return "تعذر حفظ كود الخصم المعروض في التطبيق";
}

interface AppPromoSelectionCardProps {
  promos: PromoCodeDTO[];
}

export function AppPromoSelectionCard({ promos }: AppPromoSelectionCardProps) {
  const { data: selection, isLoading } = usePromoCodeAppSelectionQuery();
  const updateMutation = useUpdatePromoCodeAppSelectionMutation();
  const [draftValue, setDraftValue] = useState<string>();
  const selectedValue = draftValue ?? selection?.promoCodeId ?? NO_PROMO_VALUE;

  const eligiblePromos = useMemo(
    () =>
      promos.filter(
        (promo) =>
          !promo.state?.isDeleted &&
          (promo.appliesTo === "subscription" || promo.appliesTo === "all")
      ),
    [promos]
  );
  const selectedPromo = selection?.promoCode || null;
  const hasChanges =
    selectedValue !== (selection?.promoCodeId || NO_PROMO_VALUE);

  async function handleSave() {
    try {
      await updateMutation.mutateAsync(
        selectedValue === NO_PROMO_VALUE ? null : selectedValue
      );
      setDraftValue(undefined);
      toast.success(
        selectedValue === NO_PROMO_VALUE
          ? "تم إيقاف عرض البرومو كود في التطبيق"
          : "تم تحديد البرومو كود المعروض في التطبيق"
      );
    } catch (error) {
      toast.error(readApiErrorMessage(error));
    }
  }

  return (
    <Card className="gap-4 border-primary/20 bg-gradient-to-l from-primary/5 via-card to-card py-5 shadow-sm">
      <CardHeader className="gap-2 px-5 sm:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Smartphone className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base font-black">
              البرومو كود المعروض في التطبيق
              <Badge variant="secondary" className="font-bold">
                اختيار واحد فقط
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl leading-6">
              اختر الكود الذي سيراه العميل في الرئيسية وصفحة الخطط ليتمكن من
              نسخه. الباك إند يعيد هذا الاختيار فقط، ولا يختار كودًا آخر حسب
              الأولوية.
            </CardDescription>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 sm:mt-0 sm:justify-end">
          {selectedPromo && selection?.isPubliclyDisplayable ? (
            <Badge className="h-7 bg-emerald-500/15 px-3 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 /> ظاهر الآن
            </Badge>
          ) : selectedPromo ? (
            <Badge variant="destructive" className="h-7 px-3">
              <AlertTriangle /> يحتاج مراجعة
            </Badge>
          ) : (
            <Badge variant="outline" className="h-7 px-3">
              غير محدد
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-2">
          <label className="text-sm font-black" htmlFor="app-promo-selection">
            الكود الحالي
          </label>
          <Select
            value={selectedValue}
            onValueChange={setDraftValue}
            disabled={isLoading || updateMutation.isPending}
          >
            <SelectTrigger id="app-promo-selection" className="h-11 w-full">
              <SelectValue placeholder="اختر برومو كود للاشتراكات" />
            </SelectTrigger>
            <SelectContent
              dir="rtl"
              position="popper"
              align="start"
              sideOffset={6}
              className="max-h-80 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
            >
              <SelectGroup>
                <SelectItem
                  value={NO_PROMO_VALUE}
                  className="min-h-10 text-foreground"
                >
                  لا تعرض أي برومو كود حاليًا
                </SelectItem>
                {eligiblePromos.map((promo) => {
                  const promoName =
                    getPromoCodeName(promo) || formatPromoCodeDiscount(promo);
                  const readinessLabel =
                    getPromoCodeStatus(promo.state) !== "active"
                      ? " (غير جاهز الآن)"
                      : "";

                  return (
                    <SelectItem
                      key={promo.id}
                      value={promo.id}
                      textValue={`${promo.code} — ${promoName}${readinessLabel}`}
                      className="min-h-11 text-foreground"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-foreground">
                        <span
                          className="shrink-0 font-mono font-black text-foreground"
                          dir="ltr"
                        >
                          {promo.code}
                        </span>
                        <span className="truncate text-muted-foreground">
                          — {promoName}
                          {readinessLabel}
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            عند الحفظ يتم تفعيل إعداد العرض داخل التطبيق لهذا الكود. تظل شروط
            الصلاحية والاستخدام وأهلية كل عميل مطبقة من الباك إند.
          </p>
        </div>

        <Button
          type="button"
          className="h-11 min-w-36"
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending || isLoading}
        >
          {updateMutation.isPending ? (
            "جاري الحفظ..."
          ) : (
            <>
              <Save />
              حفظ الاختيار
            </>
          )}
        </Button>

        {selectedPromo ? (
          <div className="rounded-xl border border-primary/15 bg-background/70 p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-black">المعاينة الحالية</span>
              <Badge className="font-mono text-sm" dir="ltr">
                {selectedPromo.code}
              </Badge>
              <Badge variant="outline">
                {selection?.promoOffer?.discountLabel?.ar ||
                  formatPromoCodeDiscount(selectedPromo)}
              </Badge>
            </div>
            {selection?.issues?.length ? (
              <ul className="mt-3 grid gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                {selection.issues.map((issue) => (
                  <li key={issue} className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5" />
                    {issueLabels[issue] || issue}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                الإعداد صالح للعرض. سيختفي العرض تلقائيًا عن أي عميل لا تنطبق
                عليه شروط هذا الكود.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
