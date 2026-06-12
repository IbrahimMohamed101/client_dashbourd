import { useState } from "react";
import { toast } from "sonner";
import { User, Phone, Package, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useSearchSubscriptionsByPhoneQuery,
  useManualDeductSubscriptionMutation,
} from "@/hooks/useSubscriptionsQuery";
import { useQueryClient } from "@tanstack/react-query";
import type { Subscription } from "@/types/subscriptionTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";

import { CustomerSearch } from "./CustomerSearch";
import { DeductionForm } from "./DeductionForm";
import type { DeductionFormValues } from "./DeductionForm";
import type { UseFormReturn } from "react-hook-form";

const columnHelper = createColumnHelper<Subscription>();

type ManualDeductionSubscription = Subscription & {
  remainingPremiumMeals?: number;
  remainingRegularMeals?: number;
  fulfillmentMethod?: string;
};

type ManualDeductionResult = {
  data?: {
    remaining?: {
      regularMeals?: number;
      premiumMeals?: number;
      totalMeals?: number;
    };
    fulfillmentMethod?: string;
  };
};

export default function ManualDeductionPage() {
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const queryClient = useQueryClient();

  const {
    data: searchResponse,
    isLoading: isSearching,
    error: searchError,
  } = useSearchSubscriptionsByPhoneQuery(searchPhone);

  const deductMutation = useManualDeductSubscriptionMutation();

  const rawData = searchResponse?.data;
  const rawSubscriptions = rawData?.subscriptions ?? [];
  const customer = rawData?.customer;
  const today = rawData?.today;

  const subscriptions: Subscription[] = rawSubscriptions.map(
    (sub: ManualDeductionSubscription) => {
      const totalRemaining = sub.remainingMeals ?? 0;
      const premiumRemaining =
        sub.remainingPremiumMeals ?? sub.premiumRemaining ?? 0;
      const regularRemaining =
        sub.remainingRegularMeals ??
        Math.max(0, totalRemaining - premiumRemaining);

      return {
        ...sub,
        userName: customer?.name,
        user: { fullName: customer?.name, phone: customer?.phone },
        remainingMeals: totalRemaining,
        remainingRegularMeals: regularRemaining,
        remainingPremiumMeals: premiumRemaining,
        premiumRemaining,
        hasDeliveryDeductionToday: today?.hasDeliveryDeductionToday ?? false,
        deliveryMode: sub.fulfillmentMethod ?? "delivery",
      };
    }
  );

  const handleSearch = (phone: string) => {
    setSearchPhone(phone);
    setSelectedSubscription(null);
  };

  const handleSelectSubscription = (sub: Subscription) => {
    setSelectedSubscription(sub);
  };

  const handleCancelDeduction = () => {
    setSelectedSubscription(null);
  };

  const onDeductionSubmit = async (
    values: DeductionFormValues,
    form: UseFormReturn<DeductionFormValues>
  ) => {
    if (!selectedSubscription) return;

    if (
      selectedSubscription.deliveryMode === "delivery" &&
      selectedSubscription.hasDeliveryDeductionToday
    ) {
      toast.error("لا يمكن الخصم: تم خصم وجبة توصيل اليوم لهذا الاشتراك");
      return;
    }

    if (values.regularMeals === 0 && values.premiumMeals === 0) {
      form.setError("regularMeals", {
        type: "manual",
        message: "الرجاء إدخال عدد الوجبات المراد خصمها",
      });
      return;
    }

    const regularRemaining =
      selectedSubscription.remainingRegularMeals ??
      selectedSubscription.remainingMeals;
    const premiumRemaining =
      selectedSubscription.remainingPremiumMeals ??
      selectedSubscription.premiumRemaining ??
      0;

    if (values.regularMeals > regularRemaining) {
      toast.error(`عدد الوجبات العادية يتجاوز الرصيد (${regularRemaining})`);
      return;
    }

    if (values.premiumMeals > premiumRemaining) {
      toast.error(`عدد الوجبات المميزة يتجاوز الرصيد (${premiumRemaining})`);
      return;
    }

    try {
      const result = await deductMutation.mutateAsync({
        id: selectedSubscription.id,
        data: {
          regularMeals: values.regularMeals,
          premiumMeals: values.premiumMeals,
          reason: values.reason.trim(),
          notes: values.notes?.trim() || undefined,
        },
      });

      toast.success("تم خصم الوجبات بنجاح");
      form.reset();

      const remaining = (result as ManualDeductionResult)?.data?.remaining;
      if (remaining) {
        setSelectedSubscription((current) =>
          current
            ? {
                ...current,
                remainingMeals: remaining.totalMeals ?? current.remainingMeals,
                remainingRegularMeals:
                  remaining.regularMeals ?? current.remainingRegularMeals,
                remainingPremiumMeals:
                  remaining.premiumMeals ?? current.remainingPremiumMeals,
                premiumRemaining:
                  remaining.premiumMeals ?? current.premiumRemaining,
                hasDeliveryDeductionToday:
                  current.deliveryMode === "delivery"
                    ? true
                    : current.hasDeliveryDeductionToday,
              }
            : current
        );
      }

      // Refresh search
      await queryClient.invalidateQueries({
        queryKey: ["subscriptions-search", searchPhone],
      });
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        "حدث خطأ أثناء الخصم";
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
      header: "الرصيد الكلي",
      cell: (info) => <Badge variant="outline">{info.getValue()} وجبة</Badge>,
    }),
    columnHelper.accessor(
      (row) => row.remainingRegularMeals ?? row.remainingMeals,
      {
        id: "remainingRegularMeals",
        header: "العادي",
        cell: (info) => (
          <Badge variant="secondary">{info.getValue()} وجبة</Badge>
        ),
      }
    ),
    columnHelper.accessor(
      (row) => row.remainingPremiumMeals ?? row.premiumRemaining ?? 0,
      {
        id: "remainingPremiumMeals",
        header: "المميز",
        cell: (info) => <Badge variant="outline">{info.getValue()} وجبة</Badge>,
      }
    ),
    columnHelper.accessor("deliveryMode", {
      header: "طريقة الاستلام",
      cell: (info) => {
        const isDelivery = info.getValue() === "delivery";
        return (
          <Badge variant={isDelivery ? "secondary" : "outline"}>
            {isDelivery ? "توصيل" : "استلام"}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const row = info.row.original;
        const blocked =
          row.deliveryMode === "delivery" && row.hasDeliveryDeductionToday;

        return (
          <Button
            variant="outline"
            size="sm"
            disabled={blocked}
            title={blocked ? "تم خصم توصيل اليوم لهذا الاشتراك" : undefined}
            onClick={() => handleSelectSubscription(row)}
          >
            {blocked ? "تم الخصم اليوم" : "اختيار"}
          </Button>
        );
      },
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
          <h1 className="text-2xl font-bold text-foreground">
            خصم يدوي من الاشتراك
          </h1>
          <p className="text-muted-foreground">
            ابحث عن العميل بالهاتف ثم اختر الاشتراك وقم بالخصم
          </p>
        </div>
      </div>

      <CustomerSearch
        onSearch={handleSearch}
        isSearching={isSearching}
        error={searchError}
      />

      {searchPhone &&
        !isSearching &&
        subscriptions.length > 0 &&
        !selectedSubscription && (
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
                          <TableHead
                            key={header.id}
                            className="py-3 text-right font-semibold"
                          >
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
                          <TableCell key={cell.id} className="py-3 text-right">
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

      {searchPhone &&
        !isSearching &&
        !searchError &&
        subscriptions.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              لم يتم العثور على اشتراكات مرتبطة بهذا الرقم
            </AlertDescription>
          </Alert>
        )}

      {selectedSubscription && (
        <DeductionForm
          subscription={selectedSubscription}
          onSubmit={onDeductionSubmit}
          onCancel={handleCancelDeduction}
          isPending={deductMutation.isPending}
        />
      )}
    </div>
  );
}
