import { useState } from "react";
import { toast } from "sonner";
import { Search, Minus, User, Phone, Calendar, Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useSearchSubscriptionsByPhoneQuery,
  useManualDeductSubscriptionMutation,
} from "@/hooks/useSubscriptionsQuery";
import type { Subscription } from "@/types/subscriptionTypes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender, getCoreRowModel, useReactTable, createColumnHelper } from "@tanstack/react-table";

const searchSchema = z.object({
  phone: z.string().min(8, "الرجاء إدخال رقم هاتف صحيح (8 أرقام على الأقل)"),
});

const deductionSchema = z.object({
  regularMeals: z.coerce.number().min(0, "الرقم غير صحيح"),
  premiumMeals: z.coerce.number().min(0, "الرقم غير صحيح"),
  reason: z.string().min(1, "الرجاء إدخال سبب الخصم"),
  notes: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;
type DeductionFormValues = z.infer<typeof deductionSchema>;

const columnHelper = createColumnHelper<Subscription>();

export default function ManualDeductionPage() {
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const {
    data: searchResponse,
    isLoading: isSearching,
    error: searchError,
  } = useSearchSubscriptionsByPhoneQuery(searchPhone);

  const deductMutation = useManualDeductSubscriptionMutation();
  const subscriptions: Subscription[] = searchResponse?.data ?? [];

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { phone: "" },
  });

  const deductionForm = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema) as any,
    defaultValues: { regularMeals: 0, premiumMeals: 0, reason: "", notes: "" },
  });

  const onSearchSubmit = (values: SearchFormValues) => {
    setSearchPhone(values.phone.trim());
    setSelectedSubscription(null);
    deductionForm.reset();
  };

  const handleSelectSubscription = (sub: Subscription) => {
    setSelectedSubscription(sub);
    deductionForm.reset();
  };

  const onDeductionSubmit = async (values: DeductionFormValues) => {
    if (!selectedSubscription) return;

    if (
      selectedSubscription.deliveryMode === "delivery" &&
      selectedSubscription.hasDeliveryDeductionToday
    ) {
      toast.error("لا يمكن الخصم: تم خصم وجبة توصيل اليوم لهذا الاشتراك");
      return;
    }

    if (values.regularMeals === 0 && values.premiumMeals === 0) {
      deductionForm.setError("regularMeals", {
        type: "manual",
        message: "الرجاء إدخال عدد الوجبات المراد خصمها",
      });
      return;
    }

    if (values.regularMeals > selectedSubscription.remainingMeals) {
      toast.error(`عدد الوجبات العادية يتجاوز الرصيد (${selectedSubscription.remainingMeals})`);
      return;
    }

    if (values.premiumMeals > (selectedSubscription.premiumRemaining || 0)) {
      toast.error(`عدد الوجبات المميزة يتجاوز الرصيد (${selectedSubscription.premiumRemaining || 0})`);
      return;
    }

    try {
      await deductMutation.mutateAsync({
        id: selectedSubscription.id,
        data: {
          regularMeals: values.regularMeals,
          premiumMeals: values.premiumMeals,
          reason: values.reason.trim(),
          notes: values.notes?.trim() || undefined,
        },
      });

      toast.success("تم خصم الوجبات بنجاح");
      deductionForm.reset();
      
      // Refresh search
      const currentPhone = searchPhone;
      setSearchPhone("");
      setTimeout(() => setSearchPhone(currentPhone), 50);
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const message = errorObj?.response?.data?.message || errorObj?.message || "حدث خطأ أثناء الخصم";
      toast.error(message);
    }
  };

  const columns = [
    columnHelper.accessor((row) => row.userName || row.user?.fullName || "—", {
      id: "userName",
      header: "العميل",
      cell: (info) => (
        <div className="flex items-center gap-2 font-semibold">
          <User className="h-4 w-4 text-muted-foreground" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.user?.phone || "—", {
      id: "userPhone",
      header: "الهاتف",
      cell: (info) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.planName || row.plan?.name || "—", {
      id: "planName",
      header: "الخطة",
      cell: (info) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("remainingMeals", {
      header: "الرصيد",
      cell: (info) => <Badge variant="outline">{info.getValue()} وجبة</Badge>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleSelectSubscription(info.row.original)}
        >
          اختيار
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">خصم يدوي من الاشتراك</h1>
          <p className="text-muted-foreground">ابحث عن العميل بالهاتف ثم اختر الاشتراك وقم بالخصم</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            البحث بالهاتف
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="flex items-start gap-3">
              <FormField
                control={searchForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="أدخل رقم الهاتف..."
                        {...field}
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage className="pt-2" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? "جاري البحث..." : "بحث"}
              </Button>
            </form>
          </Form>

          {searchError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                حدث خطأ أثناء البحث. تأكد من الرقم وأعد المحاولة.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {searchPhone && !isSearching && subscriptions.length > 0 && !selectedSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">اختر الاشتراك</CardTitle>
            <CardDescription>
              تم العثور على {subscriptions.length} اشتراك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-right py-3 font-semibold">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-right py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {searchPhone && !isSearching && subscriptions.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>لم يتم العثور على اشتراكات مرتبطة بهذا الرقم</AlertDescription>
        </Alert>
      )}

      {selectedSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Minus className="h-5 w-5" />
              تفاصيل الخصم
            </CardTitle>
            <CardDescription>
              {selectedSubscription.userName} — {selectedSubscription.planName || selectedSubscription.plan?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <BalanceCard
                label="الوجبات العادية"
                value={selectedSubscription.remainingMeals}
                icon={<Package className="h-4 w-4" />}
              />
              <BalanceCard
                label="الوجبات المميزة"
                value={selectedSubscription.premiumRemaining || 0}
                icon={<Package className="h-4 w-4" />}
              />
              <BalanceCard
                label="تاريخ البداية"
                value={new Date(selectedSubscription.startDate).toLocaleDateString("ar-EG")}
                icon={<Calendar className="h-4 w-4" />}
              />
              <BalanceCard
                label="تاريخ النهاية"
                value={new Date(selectedSubscription.endDate).toLocaleDateString("ar-EG")}
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>

            <Separator />

            <Form {...deductionForm}>
              <form onSubmit={deductionForm.handleSubmit(onDeductionSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={deductionForm.control as any}
                    name="regularMeals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوجبات العادية المراد خصمها</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={selectedSubscription.remainingMeals} {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          الرصيد المتاح: {selectedSubscription.remainingMeals}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={deductionForm.control as any}
                    name="premiumMeals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوجبات المميزة المراد خصمها</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={selectedSubscription.premiumRemaining || 0} {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          الرصيد المتاح: {selectedSubscription.premiumRemaining || 0}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={deductionForm.control as any}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سبب الخصم *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: استلام يدوي، تصحيح خطأ، إلخ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deductionForm.control as any}
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
                    disabled={deductMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {deductMutation.isPending ? "جاري الخصم..." : "تأكيد الخصم"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedSubscription(null);
                      deductionForm.reset();
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
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
