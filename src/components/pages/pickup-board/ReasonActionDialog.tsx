import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChefHat, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

const reasonSchema = z.object({
  reason: z.string().min(1, "السبب مطلوب"),
  notes: z.string().optional(),
});

type ReasonFormValues = z.infer<typeof reasonSchema>;

export interface ReasonDialogState {
  open: boolean;
  item: UnifiedQueueItem | null;
  action: string;
  actionLabel: string;
  isDangerous: boolean;
}

interface ReasonActionDialogProps {
  dialogState: ReasonDialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ReasonFormValues) => void;
  isPending: boolean;
}

export const ReasonActionDialog: React.FC<ReasonActionDialogProps> = ({
  dialogState,
  onOpenChange,
  onSubmit,
  isPending,
}) => {
  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "", notes: "" },
  });

  React.useEffect(() => {
    if (dialogState.open) {
      form.reset({ reason: "", notes: "" });
    }
  }, [dialogState.open, form]);

  return (
    <AlertDialog open={dialogState.open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-xl">
                {dialogState.isDangerous ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <ChefHat className="h-5 w-5 text-primary" />
                )}
                تأكيد: {dialogState.actionLabel}
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-base">
                يرجى إدخال سبب هذا الإجراء للحفاظ على سجل تدقيق واضح.
              </AlertDialogDescription>
              <div className="mt-4 space-y-3 text-right">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        السبب <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="اكتب السبب..."
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات اختيارية</FormLabel>
                      <FormControl>
                        <Input placeholder="أي تفاصيل إضافية..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2 sm:gap-4">
              <AlertDialogCancel type="button">إلغاء</AlertDialogCancel>
              <Button
                type="submit"
                disabled={isPending}
                className={
                  dialogState.isDangerous
                    ? "bg-red-600 px-8 font-bold hover:bg-red-700"
                    : "bg-primary px-8 font-bold"
                }
              >
                تأكيد {dialogState.actionLabel}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
