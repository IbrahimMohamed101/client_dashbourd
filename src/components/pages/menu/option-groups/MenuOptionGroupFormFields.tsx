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
import { Layers } from "lucide-react";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type {
  MenuOptionGroupSchemaInput,
  MenuOptionGroupSchemaType,
} from "@/lib/validations/menuOptionGroupSchema";

interface Props {
  form: UseFormReturn<
    MenuOptionGroupSchemaInput,
    unknown,
    MenuOptionGroupSchemaType
  >;
  isEdit?: boolean;
}

const DISPLAY_STYLES = [
  { value: "chips", label: "شرائح" },
  { value: "radio_cards", label: "بطاقات اختيار مفرد" },
  { value: "checkbox_grid", label: "شبكة اختيارات متعددة" },
  { value: "dropdown", label: "قائمة منسدلة" },
  { value: "stepper", label: "عداد" },
];

export function MenuOptionGroupFormFields({ form, isEdit }: Props) {
  const isActive = form.watch("isActive") ?? true;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4" />
            </span>
            مجموعة الخيارات
          </CardTitle>
          <CardDescription>
            أدخل تفاصيل مجموعة الخيارات مثل البروتينات أو الصلصات.
          </CardDescription>
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
              سيتم توليد المفتاح تلقائياً من الخادم بعد إنشاء مجموعة الخيارات.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="الاسم بالعربية"
              placeholder="مثال: البروتينات"
              error={form.formState.errors.name?.ar?.message}
              inputProps={form.register("name.ar")}
            />
            <Field
              label="الاسم بالإنجليزية"
              placeholder="e.g. Proteins"
              dir="ltr"
              error={form.formState.errors.name?.en?.message}
              inputProps={form.register("name.en")}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TextAreaField
              label="الوصف بالعربية"
              placeholder="وصف..."
              inputProps={form.register("description.ar")}
            />
            <TextAreaField
              label="الوصف بالإنجليزية"
              placeholder="Description..."
              dir="ltr"
              inputProps={form.register("description.en")}
            />
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
              <Label>طريقة عرض المجموعة</Label>
              <Controller
                control={form.control}
                name="ui.displayStyle"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="min-w-full" dir="rtl">
                      <SelectValue placeholder="اختر طريقة العرض" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPLAY_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
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
          <CardDescription>
            تحكم في تفعيل وظهور مجموعة الخيارات في التطبيق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleCard
            label="نشط"
            note={isActive ? "مجموعة الخيارات مفعلة" : "مجموعة الخيارات معطلة"}
            name="isActive"
            form={form}
            className="data-[state=checked]:bg-green-500"
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

function ToggleCard({
  label,
  note,
  name,
  form,
  className,
}: {
  label: string;
  note: string;
  name: "isActive";
  form: UseFormReturn<
    MenuOptionGroupSchemaInput,
    unknown,
    MenuOptionGroupSchemaType
  >;
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
            onCheckedChange={(checked) => {
              field.onChange(checked);
              form.setValue("isAvailable", checked, { shouldDirty: true });
              form.setValue("isVisible", checked, { shouldDirty: true });
            }}
          />
        )}
      />
    </div>
  );
}
