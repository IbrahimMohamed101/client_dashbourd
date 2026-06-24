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
import { Info, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
} from "@/hooks/useDeliveryZonesQuery";
import type { DeliveryZone } from "@/types/deliveryZoneTypes";

const zoneSchema = z
  .object({
    nameAr: z.string().optional(),
    nameEn: z.string().optional(),
    deliveryFeeSar: z
      .string()
      .min(1, "يرجى إدخال رسوم التوصيل")
      .refine((value) => Number(value) >= 0, "يرجى إدخال رسوم توصيل صحيحة"),
    sortOrder: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine((value) => value.nameAr?.trim() || value.nameEn?.trim(), {
    path: ["nameAr"],
    message: "أدخل الاسم بالعربية أو الإنجليزية على الأقل",
  });

type ZoneFormValues = z.infer<typeof zoneSchema>;

interface ZoneFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: DeliveryZone;
}

function readApiErrorMessage(error: unknown, fallback: string): string {
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
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  }

  return fallback;
}

function formatFeeInput(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return (value / 100).toString();
}

function toHalala(value: string): number {
  return Math.round(Number(value) * 100);
}

function getZoneId(zone: DeliveryZone): string {
  return zone._id || zone.id || "";
}

function getDefaultValues(zone?: DeliveryZone): ZoneFormValues {
  return {
    nameAr: zone?.name?.ar ?? "",
    nameEn: zone?.name?.en ?? "",
    deliveryFeeSar: formatFeeInput(zone?.deliveryFeeHalala),
    sortOrder: typeof zone?.sortOrder === "number" ? String(zone.sortOrder) : "",
    isActive: zone?.isActive ?? true,
  };
}

export function ZoneFormDialog({
  isOpen,
  onClose,
  zone,
}: ZoneFormDialogProps) {
  const isEditing = !!zone;

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: getDefaultValues(zone),
  });

  const createMutation = useCreateDeliveryZoneMutation();
  const updateMutation = useUpdateDeliveryZoneMutation();

  const onSubmit = async (data: ZoneFormValues) => {
    const payload = {
      name: {
        ar: data.nameAr?.trim() ?? "",
        en: data.nameEn?.trim() ?? "",
      },
      deliveryFeeHalala: toHalala(data.deliveryFeeSar),
      isActive: data.isActive,
      sortOrder: data.sortOrder?.trim()
        ? Math.max(0, Math.floor(Number(data.sortOrder)))
        : 0,
    };

    try {
      if (isEditing && zone) {
        await updateMutation.mutateAsync({ id: getZoneId(zone), data: payload });
        toast.success("تم تحديث المنطقة بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة المنطقة بنجاح");
      }
      onClose();
    } catch (error) {
      toast.error(
        readApiErrorMessage(
          error,
          isEditing
            ? "حدث خطأ أثناء تحديث المنطقة"
            : "حدث خطأ أثناء إضافة المنطقة"
        )
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-2xl"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            {isEditing ? "تعديل منطقة التوصيل" : "إضافة منطقة جديدة"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            هذه الشاشة تدير أسماء المناطق، ترتيبها، تفعيلها ورسوم التوصيل الخاصة بها فقط.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  اكتب رسوم التوصيل بالريال في الواجهة، وسيتم إرسالها للباك اند بالهللة. مثال: 15 ر.س يتم إرسالها كـ 1500.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">
                      الاسم بالعربية
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: وسط الرياض"
                        {...field}
                        value={field.value ?? ""}
                        className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                      />
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
                    <FormLabel className="text-sm font-bold">
                      الاسم بالإنجليزية
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Central Riyadh"
                        {...field}
                        value={field.value ?? ""}
                        className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryFeeSar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">
                      رسوم التوصيل
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="15.00"
                          {...field}
                          value={field.value ?? ""}
                          className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pl-14 pr-4 ring-offset-background transition-all focus:bg-background"
                          dir="ltr"
                        />
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          ر.س
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      سيتم تحويل القيمة إلى هللات قبل الإرسال.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">
                      ترتيب العرض
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
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
                <FormItem>
                  <div className="flex items-center justify-between rounded-2xl border border-muted-foreground/10 bg-muted/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">نشطة</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        المنطقة المعطلة تظل محفوظة ولكن لا تُستخدم كمنطقة متاحة.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="flex-row-reverse gap-2 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 gap-2 rounded-lg px-8 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isLoading
                  ? "جارٍ الحفظ..."
                  : isEditing
                    ? "تحديث المنطقة"
                    : "إضافة المنطقة"}
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