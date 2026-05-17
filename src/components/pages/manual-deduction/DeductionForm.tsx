import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Calendar, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Subscription } from "@/types/subscriptionTypes";

const deductionSchema = z.object({
  regularMeals: z.coerce.number().min(0, "الرقم غير صحيح"),
  premiumMeals: z.coerce.number().min(0, "الرقم غير صحيح"),
  reason: z.string().min(1, "الرجاء إدخال سبب الخصم"),
  notes: z.string().optional(),
});

export type DeductionFormValues = z.infer<typeof deductionSchema>;

interface DeductionFormProps {
  subscription: Subscription;
  onSubmit: (values: DeductionFormValues, form: any) => void;
  onCancel: () => void;
  isPending: boolean;
}

function BalanceCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

export const DeductionForm: React.FC<DeductionFormProps> = ({
  subscription,
  onSubmit,
  onCancel,
  isPending,
}) => {
  const form = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema) as any,
    defaultValues: { regularMeals: 0, premiumMeals: 0, reason: "", notes: "" },
  });

  const handleSubmit = (values: DeductionFormValues) => {
    onSubmit(values, form);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Minus className="h-5 w-5" />
          تفاصيل الخصم
        </CardTitle>
        <CardDescription>
          {subscription.userName} —{" "}
          {subscription.planName || subscription.plan?.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <BalanceCard
            label="الوجبات العادية"
            value={subscription.remainingMeals}
            icon={<Package className="h-4 w-4" />}
          />
          <BalanceCard
            label="الوجبات المميزة"
            value={subscription.premiumRemaining || 0}
            icon={<Package className="h-4 w-4" />}
          />
          <BalanceCard
            label="تاريخ البداية"
            value={new Date(subscription.startDate).toLocaleDateString("ar-EG")}
            icon={<Calendar className="h-4 w-4" />}
          />
          <BalanceCard
            label="تاريخ النهاية"
            value={new Date(subscription.endDate).toLocaleDateString("ar-EG")}
            icon={<Calendar className="h-4 w-4" />}
          />
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control as any}
                name="regularMeals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوجبات العادية المراد خصمها</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={subscription.remainingMeals}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      الرصيد المتاح: {subscription.remainingMeals}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="premiumMeals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوجبات المميزة المراد خصمها</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={subscription.premiumRemaining || 0}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      الرصيد المتاح: {subscription.premiumRemaining || 0}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سبب الخصم *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: استلام يدوي، تصحيح خطأ، إلخ"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="أي ملاحظات إضافية..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="min-w-[120px]"
              >
                {isPending ? "جاري الخصم..." : "تأكيد الخصم"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
