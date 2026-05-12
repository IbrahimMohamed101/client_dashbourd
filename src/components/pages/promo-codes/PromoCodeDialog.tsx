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
import type { PromoCodeDTO } from "@/types/financeTypes";

const promoCodeSchema = z.object({
  code: z.string().min(1, "يرجى إدخال كود الخصم"),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z
    .string()
    .min(1, "يرجى إدخال قيمة صحيحة")
    .refine((v) => Number(v) > 0, "يرجى إدخال قيمة صحيحة"),
  maxUsage: z.string().optional(),
  expiryDate: z.string().min(1, "يرجى تحديد تاريخ الانتهاء"),
  status: z.enum(["active", "expired", "disabled"]),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

function formatExpiryDate(date?: string): string {
  if (!date || isNaN(new Date(date).getTime())) return "";
  return new Date(date).toISOString().split("T")[0];
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
  const isEditing = !!editData;

  // No useEffect needed — parent uses key={editData?.id ?? "new"}
  // which remounts this component with fresh defaultValues
  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: editData?.code ?? "",
      discountType: editData?.discountType ?? "percentage",
      discountValue: editData?.discountValue?.toString() ?? "",
      maxUsage: editData?.maxUsage?.toString() ?? "",
      expiryDate: formatExpiryDate(editData?.expiryDate),
      status: editData?.status ?? "active",
    },
  });

  const createMutation = useCreatePromoCodeMutation();
  const updateMutation = useUpdatePromoCodeMutation();

  const onSubmit = async (data: PromoCodeFormValues) => {
    const payload: Record<string, unknown> = {
      code: data.code.trim().toUpperCase(),
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
      status: data.status,
    };

    if (data.maxUsage) {
      payload.maxUsage = Number(data.maxUsage);
    }

    try {
      if (isEditing && editData) {
        await updateMutation.mutateAsync({ id: editData.id, data: payload });
        toast.success("تم تحديث الكوبون بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إنشاء الكوبون بنجاح");
      }
      onClose();
    } catch {
      toast.error(
        isEditing
          ? "حدث خطأ أثناء تحديث الكوبون"
          : "حدث خطأ أثناء إنشاء الكوبون"
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            {isEditing ? "تعديل كوبون الخصم" : "إضافة كوبون جديد"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            {isEditing
              ? "قم بتعديل بيانات كوبون الخصم"
              : "أدخل بيانات كوبون الخصم الجديد"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold">كود الخصم</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: SUMMER2024"
                      {...field}
                      value={field.value ?? ""}
                      className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                      dir="rtl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">
                      نوع الخصم
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      dir="rtl"
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full rounded-lg border-muted-foreground/10 bg-muted/30 transition-all focus:bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-lg border-muted-foreground/10">
                        <SelectItem value="percentage" className="rounded-lg">
                          خصم مئوي %
                        </SelectItem>
                        <SelectItem value="fixed_amount" className="rounded-lg">
                          مبلغ ثابت ر.س
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => {
                  const discountType = form.watch("discountType");
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-bold">
                        القيمة
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step={discountType === "percentage" ? "1" : "0.01"}
                          placeholder={
                            discountType === "percentage" ? "مثال: 20" : "مثال: 50"
                          }
                          {...field}
                          value={field.value ?? ""}
                          className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">
                      الحد الأقصى للاستخدام
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="اتركه فارغاً = بلا حد"
                        {...field}
                        value={field.value ?? ""}
                        className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">
                      تاريخ الانتهاء
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">الحالة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      dir="rtl"
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full rounded-lg border-muted-foreground/10 bg-muted/30 transition-all focus:bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-lg border-muted-foreground/10">
                        <SelectItem value="active" className="rounded-lg">
                          نشط
                        </SelectItem>
                        <SelectItem value="expired" className="rounded-lg">
                          منتهي
                        </SelectItem>
                        <SelectItem value="disabled" className="rounded-lg">
                          معطل
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex-row-reverse gap-2 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 gap-2 rounded-lg px-8 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isLoading
                  ? "جاري الحفظ..."
                  : isEditing
                    ? "تحديث الكوبون"
                    : "إنشاء الكوبون"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-lg border-muted-foreground/10 px-6 hover:bg-muted/50"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
