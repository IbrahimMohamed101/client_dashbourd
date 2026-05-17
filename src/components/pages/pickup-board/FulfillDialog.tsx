import React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isOneTimeOrder } from "@/hooks/usePickupBoard";

const fulfillSchema = z.object({
  pickupCode: z.string().optional(),
});

type FulfillFormValues = z.infer<typeof fulfillSchema>;

interface FulfillDialogProps {
  item: UnifiedQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FulfillFormValues) => void;
  isPending: boolean;
}

export const FulfillDialog: React.FC<FulfillDialogProps> = ({
  item,
  onOpenChange,
  onSubmit,
  isPending,
}) => {
  const form = useForm<FulfillFormValues>({
    resolver: zodResolver(fulfillSchema),
    defaultValues: { pickupCode: "" },
  });

  React.useEffect(() => {
    if (item) {
      form.reset({ pickupCode: "" });
    }
  }, [item, form]);

  const isOTO = item ? isOneTimeOrder(item) : false;

  return (
    <AlertDialog open={!!item} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                تأكيد استلام العميل للطلب
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-base">
                يرجى التأكد من أن العميل قد استلم الطلب فعلاً من الفرع.
                {item?.pickup?.pickupCode && (
                  <span className="mt-2 block text-sm">
                    رمز الاستلام المتوقع:{" "}
                    <strong dir="ltr">{item.pickup.pickupCode}</strong>
                  </span>
                )}
              </AlertDialogDescription>
              {/* Render input field ONLY if it is NOT a one-time order */}
              {!isOTO && (
                <div className="mt-4 space-y-2">
                  <FormField
                    control={form.control}
                    name="pickupCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رمز الاستلام</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            {...field}
                            className="h-12 border-2 text-center text-2xl font-bold tracking-[0.5em] focus-visible:ring-primary"
                            dir="ltr"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
              <AlertDialogCancel type="button">إلغاء</AlertDialogCancel>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 px-8 font-bold hover:bg-emerald-700"
              >
                تأكيد الاستلام
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
