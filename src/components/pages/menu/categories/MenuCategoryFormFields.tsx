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

export function MenuCategoryFormFields({ form, isEdit }: Props) {
  const isActive = form.watch("isActive") ?? true;
  const isAvailable = form.watch("isAvailable") ?? true;
  const isVisible = form.watch("isVisible") ?? true;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="size-4" />
            </div>
            المعلومات الأساسية
          </CardTitle>
          <CardDescription>أدخل تفاصيل تصنيف القائمة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">المفتاح (Key)</Label>
            <Input
              dir="ltr"
              placeholder="e.g. salads"
              {...form.register("key")}
              disabled={isEdit}
              aria-invalid={!!form.formState.errors.key}
            />
            {form.formState.errors.key && (
              <p className="text-xs text-destructive">
                {form.formState.errors.key.message}
              </p>
            )}
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                حروف إنجليزية صغيرة وأرقام و _ فقط. لا يمكن تغييره لاحقاً.
              </p>
            )}
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الاسم (عربي)</Label>
              <Input
                placeholder="مثال: سلطات"
                {...form.register("name.ar")}
                aria-invalid={!!form.formState.errors.name?.ar}
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
                placeholder="e.g. Salads"
                {...form.register("name.en")}
                aria-invalid={!!form.formState.errors.name?.en}
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
                placeholder="وصف التصنيف..."
                className="resize-none"
                {...form.register("description.ar")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                placeholder="Category description..."
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...form.register("sortOrder")}
                aria-invalid={!!form.formState.errors.sortOrder}
              />
              {form.formState.errors.sortOrder && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.sortOrder.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحالة والظهور</CardTitle>
          <CardDescription>تحكم في تفعيل وظهور التصنيف في التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">نشط</Label>
              <p className="text-xs text-muted-foreground">
                {isActive ? "التصنيف مفعل" : "التصنيف معطل"}
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
        </CardContent>
      </Card>
    </div>
  );
}
