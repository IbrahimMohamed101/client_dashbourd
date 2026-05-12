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
  const { data: catsData } = useMenuCategoriesQuery({});
  const categories = catsData?.data?.items || [];

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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>نوع العنصر</Label>
              <Controller
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label>الوصف (عربي)</Label>
              <Textarea
                placeholder="وصف المنتج..."
                className="resize-none"
                {...form.register("description.ar")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                placeholder="Product description..."
                className="resize-none"
                {...form.register("description.en")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>رابط الصورة</Label>
            <Input
              dir="ltr"
              placeholder="https://..."
              {...form.register("imageUrl")}
            />
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
            <div className="space-y-1.5">
              <Label>نوع التسعير</Label>
              <Controller
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
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
            <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label>الوزن الافتراضي</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("defaultWeightGrams")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الحد الأدنى</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("minWeightGrams")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الحد الأقصى</Label>
                <Input
                  type="number"
                  min="0"
                  {...form.register("maxWeightGrams")}
                />
              </div>
              <div className="space-y-1.5">
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

      {/* ── Toggles ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...form.register("sortOrder")}
              />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-3">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      type="button"
                      checked={field.value ?? true}
                      className="cursor-pointer data-[state=checked]:bg-green-500"
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm font-bold">
                  {isActive ? "نشط" : "غير نشط"}
                </span>
              </div>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-3">
                <Controller
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <Switch
                      type="button"
                      checked={field.value ?? true}
                      className="cursor-pointer data-[state=checked]:bg-emerald-500"
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm font-bold">
                  {isAvailable ? "متوفر" : "غير متوفر"}
                </span>
              </div>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-3">
                <Controller
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <Switch
                      type="button"
                      checked={field.value ?? true}
                      className="cursor-pointer data-[state=checked]:bg-blue-500"
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm font-bold">
                  {isVisible ? "مرئي للعملاء" : "مخفي"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
