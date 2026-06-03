import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Package } from "lucide-react";
import { Controller } from "react-hook-form";
import type {
  FieldPath,
  UseFormRegisterReturn,
  UseFormReturn,
} from "react-hook-form";
import type {
  MenuProductSchemaInput,
  MenuProductSchemaType,
} from "@/lib/validations/menuProductSchema";
import {
  useMenuCategoriesQuery,
  useMenuCategoryDetailQuery,
} from "@/hooks/useMenuQuery";
import {
  DEFAULT_MENU_AVAILABLE_FOR,
  MENU_ITEM_TYPE_OPTIONS,
  type MenuAvailableChannel,
} from "@/constants/menuCatalog";
import type { MenuCategory } from "@/types/menuTypes";

const CARD_VARIANTS = [
  { value: "standard", label: "قياسي" },
  { value: "premium", label: "مميز" },
  { value: "large_salad", label: "سلطة كبيرة" },
  { value: "addon", label: "إضافة" },
];

interface Props {
  form: UseFormReturn<MenuProductSchemaInput, unknown, MenuProductSchemaType>;
  isEdit?: boolean;
}

export function MenuProductFormFields({ form, isEdit }: Props) {
  const pricingModel = form.watch("pricingModel");
  const selectedCategoryId = form.watch("categoryId") ?? "";
  const isActive = form.watch("isActive") ?? true;
  const isAvailable = form.watch("isAvailable") ?? true;
  const isVisible = form.watch("isVisible") ?? true;
  const availableFor =
    form.watch("availableFor") ?? [...DEFAULT_MENU_AVAILABLE_FOR];
  const numberInput = (
    name: FieldPath<MenuProductSchemaInput>
  ): UseFormRegisterReturn =>
    form.register(name, {
      setValueAs: (value) => (value === "" ? undefined : Number(value)),
    });

  
// Directly use itemType from form watch; ensure it's set via schema defaults
// No additional normalization needed
  const normalizeChannels = (channels: string[]): MenuAvailableChannel[] =>
    channels.map((item) => (item === "order" ? "one_time" : item)) as MenuAvailableChannel[];

  const setChannel = (channel: MenuAvailableChannel, checked: boolean) => {
    const current = normalizeChannels(availableFor);
    const next = checked
      ? Array.from(new Set([...current, channel]))
      : current.filter((item) => item !== channel);

    form.setValue("availableFor", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("availableForSubscription", next.includes("subscription"), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const { data: catsData } = useMenuCategoriesQuery({ limit: 100 });
  const { data: selectedCatData } = useMenuCategoryDetailQuery(selectedCategoryId);
  
  const categories = mergeCategoriesWithSelected(
    catsData?.data?.items || [],
    selectedCatData?.data,
    selectedCategoryId
  )
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </span>
            المعلومات الأساسية
          </CardTitle>
          <CardDescription>أدخل تفاصيل المنتج</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEdit ? (
            <div className="space-y-2">
              <Label>المفتاح</Label>
              <Input dir="ltr" {...form.register("key")} disabled />
              <p className="text-xs text-muted-foreground">
                يتم توليد المفتاح من الخادم ولا يمكن تعديله.
              </p>
            </div>
          ) : (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              سيتم توليد المفتاح تلقائياً من الخادم بعد إنشاء المنتج.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>التصنيف</Label>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className="min-w-full" dir="rtl">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name.ar || category.name.en || category.key || category.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
            </div>

            <div className="space-y-2">
              <Label>نوع العنصر</Label>
                <Controller
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "product"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="min-w-full" dir="rtl">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        {MENU_ITEM_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              {form.formState.errors.itemType ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.itemType.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="الاسم بالعربية"
              placeholder="مثال: دجاج مشوي"
              error={form.formState.errors.name?.ar?.message}
              inputProps={form.register("name.ar")}
            />
            <Field
              label="الاسم بالإنجليزية"
              placeholder="e.g. Grilled Chicken"
              dir="ltr"
              error={form.formState.errors.name?.en?.message}
              inputProps={form.register("name.en")}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TextAreaField
              label="الوصف بالعربية"
              placeholder="وصف المنتج..."
              inputProps={form.register("description.ar")}
            />
            <TextAreaField
              label="الوصف بالإنجليزية"
              placeholder="Product description..."
              dir="ltr"
              inputProps={form.register("description.en")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>صورة المنتج</Label>
            <div className="flex items-center gap-3">
              {(form.watch("imageFile") || form.watch("imageUrl")) && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
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
              <Input
                type="file"
                accept="image/*"
                dir="ltr"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  form.setValue("imageFile", file, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات العرض في التطبيق</CardTitle>
          <CardDescription>حقول `ui` المطلوبة من عقد القائمة في الخادم</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>شكل بطاقة المنتج</Label>
            <Controller
              control={form.control}
              name="ui.cardVariant"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="min-w-full" dir="rtl">
                    <SelectValue placeholder="اختر شكل البطاقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_VARIANTS.map((variant) => (
                      <SelectItem key={variant.value} value={variant.value}>
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Field
            label="شارة المنتج"
            placeholder="مثال: جديد"
            inputProps={form.register("ui.badge")}
          />
          <Field
            label="نص زر الإجراء"
            placeholder="مثال: أضف للسلة"
            inputProps={form.register("ui.ctaLabel")}
          />
          <Field
            label="نسبة الصورة"
            placeholder="مثال: 4/3"
            dir="ltr"
            inputProps={form.register("ui.imageRatio")}
          />
        </CardContent>
      </Card>

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
                    <SelectTrigger dir="rtl" className="min-w-full">
                      <SelectValue placeholder="اختر نوع التسعير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">سعر ثابت</SelectItem>
                      <SelectItem value="per_100g">بالوزن لكل 100 جم</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Field
              label="السعر (ر.س)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              error={form.formState.errors.priceSar?.message}
              inputProps={form.register("priceSar")}
            />
          </div>

          {pricingModel === "per_100g" ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
              <Field label="وحدة الوزن (جم)" type="number" min="1" inputProps={numberInput("baseUnitGrams")} />
              <Field label="الوزن الافتراضي" type="number" min="0" inputProps={numberInput("defaultWeightGrams")} />
              <Field label="الحد الأدنى" type="number" min="0" inputProps={numberInput("minWeightGrams")} />
              <Field label="الحد الأقصى" type="number" min="0" inputProps={numberInput("maxWeightGrams")} />
              <Field label="خطوة الوزن" type="number" min="1" inputProps={numberInput("weightStepGrams")} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحالة والظهور</CardTitle>
          <CardDescription>تحكم في ترتيب وتفعيل وظهور المنتج في التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field
            label="ترتيب العرض"
            type="number"
            min="0"
            placeholder="0"
            error={form.formState.errors.sortOrder?.message}
            inputProps={form.register("sortOrder")}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ChannelToggle
              label="قناة الطلب الفردي"
              note="يظهر في طلبات المرة الواحدة"
              checked={normalizeChannels(availableFor).includes("one_time")}
              onChange={(checked) => setChannel("one_time", checked)}
            />
            <ChannelToggle
              label="قناة الاشتراكات"
              note="يظهر في منشئ الاشتراك"
              checked={availableFor.includes("subscription")}
              onChange={(checked) => setChannel("subscription", checked)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ToggleCard
              label="نشط"
              note={isActive ? "المنتج مفعل" : "المنتج معطل"}
              name="isActive"
              form={form}
              className="data-[state=checked]:bg-green-500"
            />
            <ToggleCard
              label="متوفر"
              note={isAvailable ? "متاح للطلب" : "غير متوفر حالياً"}
              name="isAvailable"
              form={form}
              className="data-[state=checked]:bg-emerald-500"
            />
            <ToggleCard
              label="الظهور"
              note={isVisible ? "مرئي للعملاء" : "مخفي عن العملاء"}
              name="isVisible"
              form={form}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function mergeCategoriesWithSelected(
  categories: MenuCategory[],
  selectedCategory: MenuCategory | undefined,
  selectedCategoryId: string
): MenuCategory[] {
  const byId = new Map<string, MenuCategory>();
  categories.forEach((category) => {
    if (category.id) byId.set(category.id, category);
  });

  if (selectedCategory?.id) {
    byId.set(selectedCategory.id, selectedCategory);
  } else if (selectedCategoryId && !byId.has(selectedCategoryId)) {
    byId.set(selectedCategoryId, {
      id: selectedCategoryId,
      key: selectedCategoryId,
      name: { ar: selectedCategoryId, en: selectedCategoryId },
      isActive: true,
      isAvailable: true,
      isVisible: true,
      sortOrder: 0,
    });
  }

  return Array.from(byId.values());
}

function Field({
  label,
  error,
  inputProps,
  dir,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  inputProps: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input dir={dir} {...props} {...inputProps} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function TextAreaField({
  label,
  inputProps,
  dir,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string;
  inputProps: ReturnType<UseFormReturn["register"]>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea dir={dir} className="resize-none" {...props} {...inputProps} />
    </div>
  );
}

function ChannelToggle({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
      <div className="space-y-0.5">
        <Label className="text-base font-bold">{label}</Label>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Switch type="button" checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ToggleCard({
  label,
  note,
  name,
  form,
  className,
}: {
  label: string;
  note: string;
  name: "isActive" | "isAvailable" | "isVisible";
  form: UseFormReturn<MenuProductSchemaInput, unknown, MenuProductSchemaType>;
  className: string;
}) {
  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
      <div className="space-y-0.5">
        <Label className="text-base font-bold">{label}</Label>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Switch
            type="button"
            checked={field.value ?? true}
            className={className}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
