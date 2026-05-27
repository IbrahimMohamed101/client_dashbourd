import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "lucide-react";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type {
  MenuProductSchemaInput,
  MenuProductSchemaType,
} from "@/lib/validations/menuProductSchema";
import { useMenuCategoriesQuery } from "@/hooks/useMenuQuery";

const ITEM_TYPES = [
  { value: "basic_salad", label: "سلطة أساسية" },
  { value: "basic_meal", label: "وجبة أساسية" },
  { value: "fruit_salad", label: "سلطة فواكه" },
  { value: "greek_yogurt", label: "زبادي يوناني" },
  { value: "drink", label: "مشروب" },
  { value: "sandwich", label: "ساندويتش" },
  { value: "dessert", label: "حلويات" },
  { value: "juice", label: "عصير" },
  { value: "ice_cream", label: "آيس كريم" },
];

interface Props {
  form: UseFormReturn<MenuProductSchemaInput, unknown, MenuProductSchemaType>;
  isEdit?: boolean;
}

export function MenuProductFormFields({ form, isEdit }: Props) {
  const pricingModel = form.watch("pricingModel");
  const isActive = form.watch("isActive") ?? true;
  const isAvailable = form.watch("isAvailable") ?? true;
  const isVisible = form.watch("isVisible") ?? true;
  const availableFor = form.watch("availableFor") ?? ["order", "subscription"];
  const { data: catsData } = useMenuCategoriesQuery({});
  const categories = catsData?.data?.items || [];

  const setChannel = (channel: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...availableFor, channel]))
      : availableFor.filter((item) => item !== channel);

    form.setValue("availableFor", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("availableForSubscription", next.includes("subscription"), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </div>
            المعلومات الأساسية
          </CardTitle>
          <CardDescription>أدخل تفاصيل المنتج</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key + Category + ItemType */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>المفتاح (Key)</Label>
              <Input
                dir="ltr"
                placeholder="e.g. grilled_chicken"
                {...form.register("key")}
                disabled={isEdit}
              />
              {form.formState.errors.key && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.key.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="min-w-full" dir="rlt">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name.ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>نوع العنصر</Label>
              <Controller
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="min-w-full" dir="rtl">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.itemType && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.itemType.message}
                </p>
              )}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم (عربي)</Label>
              <Input
                placeholder="مثال: دجاج مشوي"
                {...form.register("name.ar")}
              />
              {form.formState.errors.name?.ar && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.ar.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي)</Label>
              <Input
                dir="ltr"
                placeholder="e.g. Grilled Chicken"
                {...form.register("name.en")}
              />
              {form.formState.errors.name?.en && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.en.message}
                </p>
              )}
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>الوصف (عربي)</Label>
              <Textarea
                placeholder="وصف المنتج..."
                className="resize-none"
                {...form.register("description.ar")}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                placeholder="Product description..."
                className="resize-none"
                {...form.register("description.en")}
              />
            </div>
          </div>
          <div className="flex flex-col justify-end space-y-1.5">
            <Label className="text-sm font-medium">صورة المنتج (Image)</Label>
            <div className="flex items-center gap-3">
              {(form.watch("imageFile") || form.watch("imageUrl")) && (
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                  <img
                    src={
                      form.watch("imageFile")
                        ? URL.createObjectURL(
                            form.watch("imageFile") as unknown as File
                          )
                        : form.watch("imageUrl")!
                    }
                    alt="Preview"
                    className="size-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  dir="ltr"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      form.setValue("imageFile", file, {
                        shouldValidate: true,
                      });
                    } else {
                      form.setValue("imageFile", undefined, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  aria-invalid={!!form.formState.errors.imageFile}
                />
              </div>
            </div>
            {form.formState.errors.imageFile && (
              <p className="text-xs text-destructive">
                {form.formState.errors.imageFile.message as string}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Pricing ── */}
      <Card>
        <CardHeader>
          <CardTitle>التسعير</CardTitle>
          <CardDescription>حدد نوع التسعير والسعر</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>نوع التسعير</Label>
              <Controller
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <Select value={field.value ?? "fixed"} onValueChange={field.onChange}>
                    <SelectTrigger dir="rlt" className="min-w-full">
                      <SelectValue placeholder="اختر نوع التسعير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">سعر ثابت (Fixed)</SelectItem>
                      <SelectItem value="per_100g">
                        بالوزن (Per 100g)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>السعر (ر.س)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("priceSar")}
              />
              {form.formState.errors.priceSar && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.priceSar.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                أدخل بالريال السعودي — يتم التحويل تلقائياً
              </p>
            </div>
          </div>

          {pricingModel === "per_100g" && (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
              <div className="space-y-2">
                <Label>وحدة الوزن (غ)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  {...form.register("baseUnitGrams")}
                />
                {form.formState.errors.baseUnitGrams && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.baseUnitGrams.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الوزن الافتراضي</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("defaultWeightGrams")}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("minWeightGrams")}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("maxWeightGrams")}
                />
              </div>
              <div className="space-y-2">
                <Label>خطوة الوزن</Label>
                <Input
                  type="number"
                  min="1"
                  {...form.register("weightStepGrams")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Settings ── */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحالة والظهور</CardTitle>
          <CardDescription>تحكم في ترتيب وتفعيل وظهور المنتج في التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...form.register("sortOrder")}
                aria-invalid={!!form.formState.errors.sortOrder}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Order channel</Label>
                <p className="text-xs text-muted-foreground">
                  Visible for one-time ordering
                </p>
              </div>
              <Switch
                type="button"
                checked={availableFor.includes("order")}
                onCheckedChange={(checked) => setChannel("order", checked)}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Subscription channel</Label>
                <p className="text-xs text-muted-foreground">
                  Visible in subscription builder
                </p>
              </div>
              <Switch
                type="button"
                checked={availableFor.includes("subscription")}
                onCheckedChange={(checked) => setChannel("subscription", checked)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">نشط</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? "المنتج مفعل" : "المنتج معطل"}
                </p>
              </div>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    type="button"
                    checked={field.value ?? true}
                    className="data-[state=checked]:bg-green-500"
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">متوفر</Label>
                <p className="text-xs text-muted-foreground">
                  {isAvailable ? "متاح للطلب" : "غير متوفر حالياً"}
                </p>
              </div>
              <Controller
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <Switch
                    type="button"
                    checked={field.value ?? true}
                    className="data-[state=checked]:bg-emerald-500"
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">الظهور</Label>
                <p className="text-xs text-muted-foreground">
                  {isVisible ? "مرئي للعملاء" : "مخفي عن العملاء"}
                </p>
              </div>
              <Controller
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <Switch
                    type="button"
                    checked={field.value ?? true}
                    className="data-[state=checked]:bg-blue-500"
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
