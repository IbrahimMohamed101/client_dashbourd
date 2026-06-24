import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useValidatePromoCodeMutation } from "@/hooks/usePromoCodesQuery";
import type {
  PromoCodeDTO,
  PromoCodeValidationResult,
} from "@/types/financeTypes";
import {
  formatHalala,
  formatPromoCodeDiscount,
  getPromoCodeName,
} from "./promo-codes-columns";
import { Calculator, TicketCheck } from "lucide-react";
import { toast } from "sonner";

interface PromoCodeValidationDialogProps {
  promoCode: PromoCodeDTO | null;
  onClose: () => void;
}

function readApiErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "object" &&
      data.error !== null &&
      "message" in data.error &&
      typeof data.error.message === "string"
    ) {
      return data.error.message;
    }
  }

  return "تعذر التحقق من كود الخصم. راجع البيانات وحاول مرة أخرى.";
}

function toHalalaInput(value: string): number | undefined {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return Math.round(parsed * 100);
}

function formatBreakdownValue(key: string, value: unknown): string {
  if (typeof value === "number" && key.toLowerCase().includes("halala")) {
    return formatHalala(value);
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("ar-SA").format(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  if (value === null || value === undefined) {
    return "غير محدد";
  }

  return JSON.stringify(value) ?? "غير محدد";
}

const breakdownLabels: Record<string, string> = {
  basePlanPriceHalala: "سعر الخطة الأساسي",
  premiumTotalHalala: "إجمالي الوجبات المميزة",
  addonsTotalHalala: "إجمالي الإضافات",
  deliveryFeeHalala: "رسوم التوصيل",
  discountAmountHalala: "قيمة الخصم",
  vatPercentage: "ضريبة القيمة المضافة",
  subtotalHalala: "الإجمالي قبل الخصم",
  totalHalala: "الإجمالي",
};

export function PromoCodeValidationDialog({
  promoCode,
  onClose,
}: PromoCodeValidationDialogProps) {
  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [daysCount, setDaysCount] = useState("");
  const [subtotalSar, setSubtotalSar] = useState("");
  const [vatPercentage, setVatPercentage] = useState("15");
  const [result, setResult] = useState<PromoCodeValidationResult | null>(null);
  const mutation = useValidatePromoCodeMutation();
  const promoName = promoCode ? getPromoCodeName(promoCode) : "";

  useEffect(() => {
    if (!promoCode) return;

    setResult(null);
    setUserId("");
    setPlanId("");
    setDaysCount("");
    setSubtotalSar("");
    setVatPercentage("15");
  }, [promoCode]);

  const breakdownEntries = useMemo(() => {
    if (!result?.breakdown) return [];

    return Object.entries(result.breakdown).filter(([, value]) => {
      if (typeof value === "object" && value !== null) return false;
      return true;
    });
  }, [result?.breakdown]);

  async function handleValidate() {
    if (!promoCode) return;

    const subtotalHalala = toHalalaInput(subtotalSar);

    if (subtotalSar && subtotalHalala === undefined) {
      toast.error("أدخل مبلغًا صحيحًا بالريال السعودي");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        promoCode: promoCode.code,
      };

      if (userId.trim()) payload.userId = userId.trim();
      if (planId.trim()) payload.planId = planId.trim();
      if (daysCount.trim()) payload.daysCount = Number(daysCount);
      if (subtotalHalala !== undefined) payload.subtotalHalala = subtotalHalala;
      if (vatPercentage.trim()) payload.vatPercentage = Number(vatPercentage);

      const validationResult = await mutation.mutateAsync(payload);
      setResult(validationResult);
      toast.success("تم التحقق من الكود من خلال الباك اند");
    } catch (error) {
      setResult(null);
      toast.error(readApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={Boolean(promoCode)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-3xl"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calculator className="size-5" />
            </div>
            معاينة التحقق من كود الخصم
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            هذه المعاينة تسأل الباك اند عن صلاحية الكود وقيمة الخصم. الداشبورد لا يحسب الخصم النهائي محليًا.
          </DialogDescription>
        </DialogHeader>

        {promoCode ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-black tracking-wider uppercase" dir="ltr">
                    {promoCode.code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {promoName || "بدون اسم"}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1" dir="ltr">
                  {formatPromoCodeDiscount(promoCode)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-user-id">معرّف العميل</Label>
                <Input
                  id="promo-user-id"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="اختياري"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-plan-id">معرّف الخطة</Label>
                <Input
                  id="promo-plan-id"
                  value={planId}
                  onChange={(event) => setPlanId(event.target.value)}
                  placeholder="اختياري"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-days-count">عدد الأيام</Label>
                <Input
                  id="promo-days-count"
                  value={daysCount}
                  onChange={(event) => setDaysCount(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="مثال: 20"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-subtotal">قيمة الاشتراك بالريال</Label>
                <Input
                  id="promo-subtotal"
                  value={subtotalSar}
                  onChange={(event) => setSubtotalSar(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="مثال: 1000"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="promo-vat">نسبة الضريبة</Label>
                <Input
                  id="promo-vat"
                  value={vatPercentage}
                  onChange={(event) => setVatPercentage(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15"
                  dir="ltr"
                />
              </div>
            </div>

            {result ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="mb-4 flex items-center gap-2 font-bold text-emerald-600">
                  <TicketCheck className="size-5" />
                  الكود صالح حسب نتيجة الباك اند
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-muted-foreground/10 bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">قيمة الخصم المطبقة</p>
                    <p className="mt-1 font-black" dir="ltr">
                      {formatHalala(result.promo?.discountAmountHalala)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-muted-foreground/10 bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">هل تم التطبيق؟</p>
                    <p className="mt-1 font-black">
                      {result.promo?.isApplied ? "نعم" : "لا"}
                    </p>
                  </div>
                  {breakdownEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-muted-foreground/10 bg-background/70 p-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        {breakdownLabels[key] ?? key}
                      </p>
                      <p className="mt-1 font-black" dir="ltr">
                        {formatBreakdownValue(key, value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="flex-row-reverse gap-2 pt-2">
          <Button type="button" onClick={handleValidate} disabled={mutation.isPending}>
            {mutation.isPending ? "جاري التحقق..." : "تحقق من الكود"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}