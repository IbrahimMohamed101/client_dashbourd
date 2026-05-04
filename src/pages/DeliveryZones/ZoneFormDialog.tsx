import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateDeliveryZone, useUpdateDeliveryZone } from "@/hooks/useDeliveryZones";
import { DeliveryZone } from "@/types/deliveryZoneTypes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "اسم المنطقة يجب أن يكون حرفين على الأقل"),
  delivery_fee: z.coerce.number().min(0, "رسوم التوصيل لا يمكن أن تكون سالبة"),
  coverage_description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: DeliveryZone | null;
}

export function ZoneFormDialog({ open, onOpenChange, zone }: ZoneFormDialogProps) {
  const createMutation = useCreateDeliveryZone();
  const updateMutation = useUpdateDeliveryZone();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      delivery_fee: 0,
      coverage_description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (zone) {
      form.reset({
        name: zone.name,
        delivery_fee: zone.delivery_fee,
        coverage_description: zone.coverage_description || "",
        is_active: zone.is_active,
      });
    } else {
      form.reset({
        name: "",
        delivery_fee: 0,
        coverage_description: "",
        is_active: true,
      });
    }
  }, [zone, form, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (zone) {
        await updateMutation.mutateAsync({ id: zone.id, zone: values });
        toast.success("تم تحديث المنطقة بنجاح");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("تم إضافة المنطقة بنجاح");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{zone ? "تعديل منطقة" : "إضافة منطقة جديدة"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنطقة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: الرياض - شمال" {...field} />
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
                  <FormLabel>رسوم التوصيل (ر.س)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <FormLabel>وصف التغطية</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="صف الأحياء أو المناطق التي تشملها هذه المنطقة..." 
                      className="resize-none h-24"
                      {...field} 
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>تفعيل المنطقة</FormLabel>
                    <div className="text-[12px] text-muted-foreground">
                      سيتمكن المستخدمون من اختيار هذه المنطقة عند التفعيل.
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

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="min-w-[100px]">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
