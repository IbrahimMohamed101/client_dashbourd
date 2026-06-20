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
import { Settings2 } from "lucide-react";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type {
  MenuOptionSchemaInput,
  MenuOptionSchemaType,
} from "@/lib/validations/menuOptionSchema";
import { useMenuOptionGroupsQuery } from "@/hooks/useMenuQuery";
import type { MenuOptionGroup } from "@/types/menuTypes";

interface Props {
  form: UseFormReturn<MenuOptionSchemaInput, unknown, MenuOptionSchemaType>;
  isEdit?: boolean;
}

export function MenuOptionFormFields({ form, isEdit }: Props) {
  const isActive = form.watch("isActive") ?? true;
  const isAvailable = form.watch("isAvailable") ?? true;
  const isVisible = form.watch("isVisible") ?? true;
  const { data: groupsData } = useMenuOptionGroupsQuery({});
  const responseData = groupsData?.data;
  const groups = (
    Array.isArray(responseData) ? responseData : responseData?.items || []
  ) as MenuOptionGroup[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings2 className="size-4" />
            </div>
            بيانات الخيار
          </CardTitle>
          <CardDescription>
            أدخل تفاصيل الخيار (مثال: سمك السلمون، أفوكادو...)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {isEdit ? (
              <div className="space-y-1.5">
                <Label>المفتاح (Key)</Label>
                <Input dir="ltr" {...form.register("key")} disabled />
                <p className="text-xs text-muted-foreground">
                  يتم توليد المفتاح من الخادم ولا يمكن تعديله.
                </p>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground flex items-center">
                سيتم توليد المفتاح تلقائياً من الخادم بعد إنشاء الخيار.
              </div>
            )}
            <div className="space-y-1.5">
              <Label>المجموعة</Label>
              <Controller
                control={form.control}
                name="groupId"
                render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="min-w-36">
                        <SelectValue placeholder="اختر المجموعة" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                )}
              />
              {form.formState.errors.groupId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.groupId.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الاسم (عربي)</Label>
              <Input
                placeholder="مثال: سمك السلمون"
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
                placeholder="مثال: سمك السلمون"
                {...form.register("name.en")}
              />
              {form.formState.errors.name?.en && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.en.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الوصف (عربي)</Label>
              <Textarea
                className="resize-none"
                {...form.register("description.ar")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                className="resize-none"
                {...form.register("description.en")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>صورة الخيار</Label>
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
          <CardTitle>التسعير الإضافي</CardTitle>
          <CardDescription>
            الأسعار الإضافية عند اختيار هذا الخيار
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>السعر الإضافي (ر.س)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("extraPriceSar")}
              />
              <p className="text-xs text-muted-foreground">
                يتم التحويل تلقائياً للهللة
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>رسوم اشتراك إضافية (ر.س)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("extraFeeSar")}
              />
              <p className="text-xs text-muted-foreground">
                الرسوم الإضافية للاشتراكات (Extra Fee)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>وحدة الوزن الإضافية (غ)</Label>
              <Input
                type="number"
                min="0"
                {...form.register("extraWeightUnitGrams")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>سعر الوزن الإضافي (ر.س)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("extraWeightPriceSar")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحالة والظهور</CardTitle>
          <CardDescription>تحكم في ترتيب الخيار وتفعيله في التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(180px,220px))]">
            <div className="space-y-1.5">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...form.register("sortOrder")}
              />
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">نشط</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? "الخيار مفعل" : "الخيار معطل"}
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
            <ToggleCard
              label="متوفر"
              note={isAvailable ? "متاح للاختيار" : "غير متاح حاليا"}
              name="isAvailable"
              form={form}
              className="data-[state=checked]:bg-emerald-500"
            />
            <ToggleCard
              label="ظاهر"
              note={isVisible ? "يظهر للعملاء" : "مخفي عن العملاء"}
              name="isVisible"
              form={form}
              className="data-[state=checked]:bg-sky-500"
            />
          </div>
        </CardContent>
      </Card>
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
  name: "isAvailable" | "isVisible";
  form: UseFormReturn<MenuOptionSchemaInput, unknown, MenuOptionSchemaType>;
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
