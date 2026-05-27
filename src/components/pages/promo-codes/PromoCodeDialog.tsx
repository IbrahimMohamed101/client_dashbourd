import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
} from "@/hooks/usePromoCodesQuery";
import type { PromoCodeDTO, PromoCodePayload } from "@/types/financeTypes";

const promoCodeSchema = z.object({
  code: z.string().min(1, "مطلوب"),
  nameAr: z.string().optional(),
  nameEn: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z
    .string()
    .min(1, "مطلوب")
    .refine((value) => Number(value) > 0, "قيمة غير صحيحة"),
  usageLimitTotal: z.string().optional(),
  usageLimitPerUser: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  appliesTo: z.string().optional(),
  isActive: z.boolean(),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

function formatDateInputValue(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function getDefaultValues(editData?: PromoCodeDTO): PromoCodeFormValues {
  return {
    code: editData?.code ?? "",
    nameAr: editData?.name?.ar ?? "",
    nameEn: editData?.name?.en ?? "",
    discountType:
      editData?.discountType === "fixed"
        ? "fixed_amount"
        : editData?.discountType ?? "percentage",
    discountValue: editData?.discountValue?.toString() ?? "",
    usageLimitTotal: editData?.usageLimitTotal?.toString() ?? "",
    usageLimitPerUser: editData?.usageLimitPerUser?.toString() ?? "",
    startsAt: formatDateInputValue(editData?.startsAt),
    expiresAt: formatDateInputValue(editData?.expiresAt),
    appliesTo: editData?.appliesTo ?? "subscriptions",
    isActive: editData?.isActive ?? true,
  };
}

function toPromoCodePayload(values: PromoCodeFormValues): PromoCodePayload {
  const usageLimitTotal = values.usageLimitTotal
    ? Number(values.usageLimitTotal)
    : null;

  return {
    code: values.code.trim().toUpperCase(),
    name: {
      ar: values.nameAr?.trim() ?? "",
      en: values.nameEn?.trim() ?? "",
    },
    discountType: values.discountType,
    discountValue: Number(values.discountValue),
    usageLimitTotal,
    usageLimit: usageLimitTotal,
    usageLimitPerUser: values.usageLimitPerUser
      ? Number(values.usageLimitPerUser)
      : null,
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
    endsAt: values.expiresAt
      ? new Date(values.expiresAt).toISOString()
      : null,
    appliesTo: values.appliesTo?.trim() || "subscriptions",
    isActive: values.isActive,
  };
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
    } catch {
      toast.error("حدث خطأ أثناء حفظ كود الخصم");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            {isEditing ? "تعديل كود الخصم" : "إضافة كود جديد"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            أدخل بيانات كود الخصم الأساسية فقط.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكود</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" />
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
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">خصم مئوي</SelectItem>
                        <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
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
                    <FormLabel>قيمة الخصم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min="0"
                        step={discountType === "percentage" ? "1" : "0.01"}
                        dir="ltr"
                      />
                    </FormControl>
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
                    <FormLabel>تاريخ البدء</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="date"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="date"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-muted-foreground/10 p-3">
                  <FormLabel>مفعّل</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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
