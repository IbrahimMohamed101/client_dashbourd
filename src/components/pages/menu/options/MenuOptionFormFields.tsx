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

interface Props {
  form: UseFormReturn<MenuOptionSchemaInput, unknown, MenuOptionSchemaType>;
  isEdit?: boolean;
}

export function MenuOptionFormFields({ form, isEdit }: Props) {
  const isActive = form.watch("isActive") ?? true;
  const isAvailable = form.watch("isAvailable") ?? true;
  const isVisible = form.watch("isVisible") ?? true;
  const { data: groupsData } = useMenuOptionGroupsQuery({});
  const groups = groupsData?.data?.items || [];

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
            <div className="space-y-1.5">
              <Label>المفتاح (Key)</Label>
              <Input
                dir="ltr"
                placeholder="e.g. salmon"
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
              <Label>المجموعة</Label>
              <Controller
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
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
                placeholder="e.g. Salmon"
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
            <Label>رابط الصورة</Label>
            <Input
              dir="ltr"
              placeholder="https://..."
              {...form.register("imageUrl")}
            />
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                {...form.register("extraWeightPriceSar")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
