import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Home, Info, Smartphone, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
} from "@/hooks/usePromoCodesQuery";
import type { PromoCodeDTO } from "@/types/financeTypes";
import {
  getDefaultValues,
  promoCodeSchema,
  toPromoCodePayload,
  type PromoCodeFormValues,
} from "@/utils/promoCodeForm";

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

  return "حدث خطأ أثناء حفظ كود الخصم";
}

interface PromoCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: PromoCodeDTO;
}

export function PromoCodeDialog({
  isOpen,
  onClose,
  editData,
}: PromoCodeDialogProps) {
  const isEditing = Boolean(editData);
  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: getDefaultValues(editData),
  });
  const createMutation = useCreatePromoCodeMutation();
  const updateMutation = useUpdatePromoCodeMutation();
  const discountType = form.watch("discountType");
  const appliesTo = form.watch("appliesTo");
  const showInApp = form.watch("showInApp");
  const isLoading = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: PromoCodeFormValues) {
    try {
      const payload = toPromoCodePayload(values);

      if (editData) {
        await updateMutation.mutateAsync({ id: editData.id, data: payload });
        toast.success("تم تحديث كود الخصم بنجاح");
        onClose();
        return;
      }

      await createMutation.mutateAsync(payload);
      toast.success("تم إنشاء كود الخصم بنجاح");
      form.reset(getDefaultValues());
      onClose();
    } catch (error) {
      toast.error(readApiErrorMessage(error));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-2xl"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            {isEditing ? "تعديل كود الخصم" : "إضافة كود جديد"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            أدخل بيانات الكود الأساسية. الحساب النهائي والقيود المتقدمة يقررها
            الباك اند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  المبلغ الثابت يُكتب بالريال، ويتم تحويله إلى هللة فقط عند
                  إرسال البيانات للباك اند.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكود</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        dir="ltr"
                        className="font-mono uppercase"
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appliesTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ينطبق على</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      dir="rtl"
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="subscription">اشتراك</SelectItem>
                        <SelectItem value="addon_plans">
                          خطط الإضافات
                        </SelectItem>
                        <SelectItem value="all">الكل</SelectItem>
                      </SelectContent>
                    </Select>
                    {appliesTo !== "subscription" ? (
                      <FormDescription>
                        الطلبات العادية غير مدعومة، وخصومات الإضافات تحتاج
                        مستهلك تحقق منفصل من الباك اند.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالعربية</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزية</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الخصم</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      dir="rtl"
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">نسبة مئوية</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {discountType === "percentage"
                        ? "نسبة الخصم"
                        : "قيمة الخصم بالريال"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          min="0"
                          step={discountType === "percentage" ? "1" : "0.01"}
                          inputMode={
                            discountType === "percentage"
                              ? "numeric"
                              : "decimal"
                          }
                          dir="ltr"
                          className="pl-12"
                        />
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          {discountType === "percentage" ? "%" : "ر.س"}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {discountType === "percentage"
                        ? "مثال: 10 تعني خصم 10%."
                        : "اكتب المبلغ بالريال السعودي."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usageLimitTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حد الاستخدام الكلي</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="اتركه فارغًا لغير محدود"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usageLimitPerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حد الاستخدام لكل مستخدم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="اتركه فارغًا لغير محدود"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ ووقت البدء</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="datetime-local"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormDescription>
                      يُعرض ويُرسل حسب توقيت الرياض.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ ووقت الانتهاء</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="datetime-local"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormDescription>
                      اتركه فارغًا إذا لم يكن له تاريخ انتهاء.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-2xl border border-muted-foreground/10 bg-muted/20 p-4">
                  <div>
                    <FormLabel>مفعّل</FormLabel>
                    <FormDescription>
                      عند التعطيل لن يكون الكود صالحًا حتى لو كانت باقي الشروط
                      صحيحة.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <FormField
                control={form.control}
                name="showInApp"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Smartphone className="size-5" />
                      </div>
                      <div>
                        <FormLabel>إظهار كود الخصم في تطبيق الجوال</FormLabel>
                        <FormDescription>
                          يظهر الكود للنسخ فقط. التطبيق والتحقق من الخصم يظلان
                          في خطوة إتمام الاشتراك.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {showInApp ? (
                <div className="space-y-4 border-t border-emerald-500/15 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="showOnHome"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border bg-background/70 p-3">
                          <div className="flex items-center gap-2">
                            <Home className="size-4 text-primary" />
                            <FormLabel>الصفحة الرئيسية</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="showOnPlans"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border bg-background/70 p-3">
                          <FormLabel>شاشة باقات الاشتراك</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="displayPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>أولوية العرض</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? "0"}
                            type="number"
                            min="-1000"
                            max="1000"
                            step="1"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription>
                          عند وجود أكثر من عرض صالح، يعرض التطبيق صاحب الأولوية
                          الأعلى.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="appTitleAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان البطاقة بالعربية</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="وفّر على اشتراكك"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="appTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان البطاقة بالإنجليزية</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              dir="ltr"
                              placeholder="Save on your subscription"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="appDescriptionAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وصف البطاقة بالعربية</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="انسخ الكود واستخدمه عند إتمام الاشتراك"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="appDescriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وصف البطاقة بالإنجليزية</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              dir="ltr"
                              placeholder="Copy the code and use it at checkout"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="homeMessageAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رسالة الرئيسية بالعربية</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="اعرض الخطط واحصل على كود الخصم"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="homeMessageEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رسالة الرئيسية بالإنجليزية</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              dir="ltr"
                              placeholder="View plans and copy your promo code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border border-dashed border-emerald-500/30 bg-background/60 p-3 text-xs text-muted-foreground">
                    قيمة الخصم الظاهرة في التطبيق تُنشأ تلقائيًا من نوع وقيمة
                    الخصم أعلاه؛ لا تحتاج إلى كتابتها مرة ثانية.
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="flex-row-reverse gap-2 pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "جاري الحفظ..."
                  : isEditing
                    ? "تحديث كود الخصم"
                    : "إنشاء كود الخصم"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
