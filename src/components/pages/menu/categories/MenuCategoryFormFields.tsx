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
import { FolderOpen } from "lucide-react";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type {
  MenuCategorySchemaInput,
  MenuCategorySchemaType,
} from "@/lib/validations/menuCategorySchema";

interface Props {
  form: UseFormReturn<MenuCategorySchemaInput, unknown, MenuCategorySchemaType>;
  isEdit?: boolean;
}

const CARD_VARIANTS = [
  { value: "meal_builder", label: "منشئ الوجبات" },
  { value: "light_collection", label: "مجموعة خفيفة" },
  { value: "sandwich_collection", label: "مجموعة ساندويتشات" },
  { value: "addon_collection", label: "مجموعة إضافات" },
];

export function MenuCategoryFormFields({ form, isEdit }: Props) {
  const isActive = form.watch("isActive") ?? true;
  const isAvailable = form.watch("isAvailable") ?? true;
  const isVisible = form.watch("isVisible") ?? true;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="size-4" />
            </span>
            المعلومات الأساسية
          </CardTitle>
          <CardDescription>أدخل تفاصيل تصنيف القائمة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEdit ? (
            <div className="space-y-1.5">
              <Label>المفتاح</Label>
              <Input dir="ltr" {...form.register("key")} disabled />
              <p className="text-xs text-muted-foreground">
                يتم توليد المفتاح من الخادم ولا يمكن تعديله.
              </p>
            </div>
          ) : (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              سيتم توليد المفتاح تلقائياً من الخادم بعد إنشاء التصنيف.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="الاسم بالعربية"
              placeholder="مثال: سلطات"
              error={form.formState.errors.name?.ar?.message}
              inputProps={form.register("name.ar")}
            />
            <Field
              label="الاسم بالإنجليزية"
              placeholder="e.g. Salads"
              dir="ltr"
              error={form.formState.errors.name?.en?.message}
              inputProps={form.register("name.en")}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الوصف بالعربية</Label>
              <Textarea
                placeholder="وصف التصنيف..."
                className="resize-none"
                {...form.register("description.ar")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف بالإنجليزية</Label>
              <Textarea
                dir="ltr"
                placeholder="Category description..."
                className="resize-none"
                {...form.register("description.en")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>صورة التصنيف</Label>
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="ترتيب العرض"
              type="number"
              min="0"
              placeholder="0"
              error={form.formState.errors.sortOrder?.message}
              inputProps={form.register("sortOrder")}
            />
            <div className="space-y-1.5">
              <Label>شكل بطاقة التصنيف</Label>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحالة والظهور</CardTitle>
          <CardDescription>تحكم في ظهور وتفعيل التصنيف في التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ToggleCard
            label="نشط"
            note={isActive ? "التصنيف مفعل" : "التصنيف معطل"}
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
        </CardContent>
      </Card>
    </div>
  );
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
  inputProps: ReturnType<UseFormReturn["register"]>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input dir={dir} {...props} {...inputProps} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
  form: UseFormReturn<MenuCategorySchemaInput, unknown, MenuCategorySchemaType>;
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
