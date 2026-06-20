import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  Addon,
  AddonCategoryOption,
  AddonPlanWritePayload,
  BasePlanPickerItem,
  MenuProductPickerItem,
} from "@/types/addonTypes";
import {
  ensurePriceRows,
  localizedName,
  planToForm,
  uniqueIds,
  upsertPriceRow,
  validateAndBuildPayload,
  type PlanFormState,
  type PriceRowState,
} from "./addon-plan-form-utils";

type AddonPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Addon | null;
  products: MenuProductPickerItem[];
  basePlans: BasePlanPickerItem[];
  categories: AddonCategoryOption[];
  isSaving: boolean;
  serverError?: string | null;
  onSubmit: (payload: AddonPlanWritePayload) => void;
};

export function AddonPlanDialog({
  open,
  onOpenChange,
  plan,
  products,
  basePlans,
  categories,
  isSaving,
  serverError,
  onSubmit,
}: AddonPlanDialogProps) {
  const [form, setForm] = useState<PlanFormState>(() =>
    planToForm(plan, basePlans)
  );
  const [productSearch, setProductSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;

    return products.filter((product) => {
      const haystack = [
        product.key,
        product.category,
        product.name.ar,
        product.name.en,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [productSearch, products]);

  const selectedProducts = useMemo(
    () =>
      products.filter((product) => form.menuProductIds.includes(product.id)),
    [form.menuProductIds, products]
  );

  const activePriceRows = useMemo(
    () => ensurePriceRows(form.prices, basePlans).filter((price) => price.isActive),
    [basePlans, form.prices]
  );

  const updateForm = <K extends keyof PlanFormState>(
    key: K,
    value: PlanFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
  };

  const setProductSelected = (productId: string, selected: boolean) => {
    setForm((current) => {
      const currentIds = uniqueIds(current.menuProductIds);
      return {
        ...current,
        menuProductIds: selected
          ? uniqueIds([...currentIds, productId])
          : currentIds.filter((id) => id !== productId),
      };
    });
    setFormError(null);
  };

  const toggleProductFromRow = (productId: string) => {
    setForm((current) => {
      const currentIds = uniqueIds(current.menuProductIds);
      const exists = currentIds.includes(productId);

      return {
        ...current,
        menuProductIds: exists
          ? currentIds.filter((id) => id !== productId)
          : [...currentIds, productId],
      };
    });
    setFormError(null);
  };

  const updatePrice = (
    basePlanId: string,
    patch: Partial<Pick<PriceRowState, "priceHalala" | "isActive">>
  ) => {
    setForm((current) => ({
      ...current,
      prices: upsertPriceRow(current.prices, basePlanId, patch),
    }));
    setFormError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const result = validateAndBuildPayload(form, basePlans);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    onSubmit(result.payload);
  };

  const shownError = formError || serverError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid max-h-[92dvh] w-[calc(100%-1rem)] max-w-[72rem] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[72rem] [&_*]:min-w-0"
        dir="rtl"
      >
        <DialogHeader className="border-b px-5 py-4 text-right">
          <DialogTitle>
            {plan ? "تعديل باقة إضافة" : "إنشاء باقة إضافة"}
          </DialogTitle>
          <DialogDescription>
            اربط منتجات موجودة مسبقا، ثم أدخل أسعار الباقة بالهللة لكل خطة
            اشتراك أساسية.
          </DialogDescription>
        </DialogHeader>

        <form
          id="addon-plan-form"
          className="min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <section className="space-y-4 rounded-lg border bg-muted/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <h3 className="text-sm font-semibold">بيانات الباقة</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="الاسم بالعربي"
                  value={form.nameAr}
                  onChange={(value) => updateForm("nameAr", value)}
                  required
                />
                <Field
                  label="الاسم بالإنجليزي"
                  value={form.nameEn}
                  onChange={(value) => updateForm("nameEn", value)}
                  required
                  dir="ltr"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem_9rem] md:items-end">
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => updateForm("category", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.key} value={category.key}>
                          {localizedName(category.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Field
                  label="الحد اليومي"
                  type="number"
                  value={form.maxPerDay}
                  onChange={(value) => updateForm("maxPerDay", value)}
                  required
                />
                <div className="flex h-10 items-center justify-between gap-3 rounded-md border bg-background px-3">
                  <Label>نشطة</Label>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      updateForm("isActive", checked)
                    }
                  />
                </div>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] xl:items-start">
              <section className="space-y-3 rounded-lg border bg-muted/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">مصفوفة الأسعار</h3>
                    <p className="text-xs text-muted-foreground">
                      أدخل السعر بالهللة لكل خطة أساسية، ويمكن تعطيل أي صف بدون حذفه.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {activePriceRows.length.toLocaleString("ar-EG")} نشطة
                  </Badge>
                </div>
                {basePlans.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                    لا توجد خطط أساسية من الخادم.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {basePlans.map((basePlan) => {
                      const row = form.prices.find(
                        (price) => price.basePlanId === basePlan.id
                      );

                      return (
                        <div
                          key={basePlan.id}
                          className="rounded-lg border bg-background p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold leading-6">
                                {basePlan.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {basePlan.daysCount ?? "-"} يوم ·{" "}
                                {basePlan.mealsCount ?? "-"} وجبة
                              </p>
                            </div>
                            <Switch
                              checked={row?.isActive ?? true}
                              onCheckedChange={(checked) =>
                                updatePrice(basePlan.id, {
                                  isActive: checked,
                                })
                              }
                            />
                          </div>
                          <div className="mt-3 space-y-2">
                            <Label className="text-xs">السعر بالهللة</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={row?.priceHalala ?? "0"}
                              onChange={(event) =>
                                updatePrice(basePlan.id, {
                                  priceHalala: event.target.value,
                                })
                              }
                              className="h-10 text-right"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="space-y-4">
                <section className="space-y-3 rounded-lg border bg-muted/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">ربط المنتجات</h3>
                      <p className="text-xs text-muted-foreground">
                        اختر من منتجات المنيو المتاحة للاشتراكات فقط.
                      </p>
                    </div>
                    <Badge variant="outline">
                      {form.menuProductIds.length.toLocaleString("ar-EG")} مختارة
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      className="pr-9"
                      placeholder="ابحث باسم المنتج أو الكود"
                    />
                  </div>
                  <div className="max-h-[19rem] overflow-y-auto overflow-x-hidden rounded-lg border bg-background">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        لا توجد منتجات مطابقة.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {filteredProducts.map((product) => {
                          const checked = form.menuProductIds.includes(product.id);
                          const checkboxId = `addon-product-${product.id}`;

                          return (
                            <div
                              key={product.id}
                              role="button"
                              tabIndex={0}
                              className="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-right transition hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                              onClick={() => toggleProductFromRow(product.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  toggleProductFromRow(product.id);
                                }
                              }}
                            >
                              <Checkbox
                                id={checkboxId}
                                checked={checked}
                                onCheckedChange={(value) =>
                                  setProductSelected(product.id, value === true)
                                }
                                onClick={(event) => event.stopPropagation()}
                              />
                              <label
                                htmlFor={checkboxId}
                                className="min-w-0 flex-1 cursor-pointer"
                                onClick={(event) => event.preventDefault()}
                              >
                                <span className="block truncate text-sm font-medium">
                                  {localizedName(product.name)}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {product.key || product.category || product.id}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-2 rounded-lg border bg-muted/10 p-4">
                  <h3 className="text-sm font-semibold">المنتجات المختارة</h3>
                  {selectedProducts.length === 0 ? (
                    <p className="rounded-md border border-dashed bg-background p-3 text-sm text-muted-foreground">
                      اختر منتجا واحدا على الأقل.
                    </p>
                  ) : (
                    <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto overflow-x-hidden">
                      {selectedProducts.map((product) => (
                        <Badge key={product.id} variant="secondary">
                          {localizedName(product.name)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </section>

                {shownError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {shownError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="border-t bg-background px-5 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button type="submit" form="addon-plan-form" disabled={isSaving}>
            حفظ الباقة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  required?: boolean;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
