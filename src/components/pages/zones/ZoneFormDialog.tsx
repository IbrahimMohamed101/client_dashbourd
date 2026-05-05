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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
} from "@/hooks/useDeliveryZonesQuery";
import type { DeliveryZone } from "@/types/deliveryZoneTypes";

function safeStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val == null) return "";
  if (typeof val === "object" && "ar" in (val as Record<string, unknown>))
    return String((val as Record<string, unknown>).ar ?? val);
  return String(val);
}

const zoneSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المنطقة"),
  delivery_fee: z
    .string()
    .min(1, "يرجى إدخال رسوم توصيل صحيحة")
    .refine((v) => Number(v) >= 0, "يرجى إدخال رسوم توصيل صحيحة"),
  coverage_description: z.string().optional(),
  is_active: z.boolean(),
});

type ZoneFormValues = z.infer<typeof zoneSchema>;

interface ZoneFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: DeliveryZone;
}

export function ZoneFormDialog({ isOpen, onClose, zone }: ZoneFormDialogProps) {
  const isEditing = !!zone;

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: safeStr(zone?.name),
      delivery_fee: zone?.delivery_fee?.toString() ?? "",
      coverage_description: safeStr(zone?.coverage_description),
      is_active: zone?.is_active ?? true,
    },
  });

  const createMutation = useCreateDeliveryZoneMutation();
  const updateMutation = useUpdateDeliveryZoneMutation();

  const onSubmit = async (data: ZoneFormValues) => {
    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      delivery_fee: Number(data.delivery_fee),
      is_active: data.is_active,
    };

    if (data.coverage_description?.trim()) {
      payload.coverage_description = data.coverage_description.trim();
    }

    try {
      if (isEditing && zone) {
        await updateMutation.mutateAsync({ id: zone.id, data: payload });
        toast.success("تم تحديث المنطقة بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة المنطقة بنجاح");
      }
      onClose();
    } catch {
      toast.error(
        isEditing
          ? "حدث خطأ أثناء تحديث المنطقة"
          : "حدث خطأ أثناء إضافة المنطقة"
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
              <MapPin className="size-5" />
            </div>
            {isEditing ? "تعديل منطقة التوصيل" : "إضافة منطقة جديدة"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            {isEditing
              ? "قم بتعديل بيانات منطقة التوصيل"
              : "أدخل بيانات منطقة التوصيل الجديدة"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold">
                    اسم المنطقة
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: الرياض - شمال"
                      {...field}
                      className="h-12 rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold">
                    رسوم التوصيل (ر.س)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="مثال: 25"
                      {...field}
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
              name="coverage_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold">
                    وصف التغطية
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="صف الأحياء أو المناطق التي تشملها هذه المنطقة..."
                      {...field}
                      className="h-24 resize-none rounded-lg border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                      dir="rtl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border border-muted-foreground/10 bg-muted/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">
                        تفعيل المنطقة
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        سيتمكن المستخدمون من اختيار هذه المنطقة عند التفعيل
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
                  ? "جاري الحفظ..."
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
