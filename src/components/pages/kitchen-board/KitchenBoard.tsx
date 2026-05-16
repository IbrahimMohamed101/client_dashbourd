import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/apis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ChefHat,
  Clock,
  CheckCircle2,
  ListTodo,
  ShoppingBag,
  Store,
  XCircle,
  RotateCcw,
  Truck,
  Bell,
} from "lucide-react";
import { Loader } from "@/components/global/loader";
import { isUnsupportedOneTimeOrderAction } from "@/types/oneTimeOrderTypes";

// ── Unified queue item that handles both subscription days and one-time orders ──
// Use source and entityType to choose the correct UI and action endpoints.
// Do NOT assume every row is a subscription_day.
// Do NOT call subscription actions for one-time orders.

interface KitchenQueueItem {
  // Shared fields
  id: string;
  status: string;
  method: "delivery" | "pickup";
  allowedActions: string[];
  notes?: string;
  userName: string;
  userPhone: string;

  // Discriminator fields
  source?: "subscription" | "one_time_order";
  entityType?: "subscription_day" | "order";

  // Subscription-specific fields (only when source=subscription / entityType=subscription_day)
  subscriptionDayId?: string;
  mealSlots?: {
    slot: string;
    items: { name: string; quantity: number; notes?: string }[];
  }[];

  // One-time order-specific fields (only when source=one_time_order / entityType=order)
  entityId?: string;
  orderNumber?: string;
  items?: { id: string; name: string; quantity: number; notes?: string }[];
  paymentStatus?: string;
  fulfillmentMethod?: "pickup" | "delivery";
  pickup?: {
    branchId: string;
    branchName?: string;
    window?: string;
    pickupCode?: string;
  };
}

interface KitchenQueueResponse {
  data: {
    items: KitchenQueueItem[];
  };
}

// ── Reason dialog state ──
interface ReasonDialogState {
  open: boolean;
  item: KitchenQueueItem | null;
  action: string;
  actionLabel: string;
  isDangerous: boolean;
}

const reasonSchema = z.object({
  reason: z.string().min(1, "السبب مطلوب"),
  notes: z.string().optional(),
});

type ReasonFormValues = z.infer<typeof reasonSchema>;

export const KitchenBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>({
    open: false,
    item: null,
    action: "",
    actionLabel: "",
    isDangerous: false,
  });

  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "", notes: "" },
  });

  const { data: queueData, isLoading } = useQuery<KitchenQueueResponse>({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await api.get(
        `/api/dashboard/kitchen/queue?date=${today}&status=open,locked,confirmed,in_preparation,ready_for_pickup,out_for_delivery&method=all&q=&zoneId=&branchId=`
      );
      return data;
    },
    refetchInterval: 30000,
  });

  // ── Helper: check if this is a one-time order ──
  const isOneTimeOrder = (item: KitchenQueueItem): boolean => {
    return item.source === "one_time_order" || item.entityType === "order";
  };

  // ── Unified action mutation ──
  // Uses entityType and source to determine the correct endpoint.
  // One-time orders use /api/dashboard/orders/:orderId/actions/:action
  // Subscription days use /api/dashboard/kitchen/actions/:action
  const updateStatus = useMutation({
    mutationFn: async ({
      item,
      action,
      reason: actionReason,
      notes: actionNotes,
    }: {
      item: KitchenQueueItem;
      action: string;
      reason?: string;
      notes?: string;
    }) => {
      // Block unsupported actions for pickup-only one-time orders
      if (
        isOneTimeOrder(item) &&
        isUnsupportedOneTimeOrderAction(action)
      ) {
        throw new Error(
          `Action "${action}" is not supported for pickup-only one-time orders`
        );
      }

      if (isOneTimeOrder(item)) {
        // One-Time Order: use order-specific action endpoint
        // Do NOT send subscription day identifiers for one-time orders
        const orderId = item.entityId || item.id;
        const { data } = await api.post(
          `/api/dashboard/orders/${orderId}/actions/${action}`,
          {
            reason: actionReason || `Kitchen action: ${action}`,
            notes: actionNotes || item.notes,
          }
        );
        return data;
      } else {
        // Subscription Day: use unified kitchen action endpoint
        // POST /api/dashboard/kitchen/actions/:action
        const { data } = await api.post(
          `/api/dashboard/kitchen/actions/${action}`,
          {
            entityId: item.subscriptionDayId || item.id,
            entityType: "subscription_day",
            payload: {
              reason: actionReason || `Kitchen action: ${action}`,
              notes: actionNotes || item.notes,
            },
          }
        );
        return data;
      }
    },
    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
      // Refresh data after errors – another staff member may have already acted
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  // ── Open reason dialog before executing action ──
  const requestAction = (
    item: KitchenQueueItem,
    action: string,
    actionLabel: string,
    isDangerous: boolean = false
  ) => {
    form.reset({ reason: "", notes: "" });
    setReasonDialog({
      open: true,
      item,
      action,
      actionLabel,
      isDangerous,
    });
  };

  const onConfirmSubmit = (values: ReasonFormValues) => {
    if (!reasonDialog.item) return;
    updateStatus.mutate({
      item: reasonDialog.item,
      action: reasonDialog.action,
      reason: values.reason.trim(),
      notes: values.notes?.trim() || undefined,
    });
    setReasonDialog({
      open: false,
      item: null,
      action: "",
      actionLabel: "",
      isDangerous: false,
    });
  };

  if (isLoading) return <Loader label="جاري تحميل طلبات المطبخ..." />;

  const orders = queueData?.data?.items || [];

  // ── Sections include "confirmed" for one-time orders ──
  const sections = [
    {
      statuses: ["open", "locked", "confirmed"],
      label: "بانتظار التحضير",
      icon: <ListTodo className="h-5 w-5" />,
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      primaryAction: "prepare" as const,
      primaryActionLabel: "بدء التحضير",
    },
    {
      statuses: ["in_preparation"],
      label: "جاري التحضير",
      icon: <ChefHat className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      primaryAction: "ready_for_pickup" as const,
      primaryActionLabel: "إكمال التحضير",
    },
    {
      statuses: ["ready_for_pickup"],
      label: "جاهز للتسليم",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-600 border-green-200",
      primaryAction: "dispatch" as const,
      primaryActionLabel: "إرسال للمندوب",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">لوحة المطبخ</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex gap-2 px-3 py-1">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-3">
        {sections.map((section) => {
          const sectionOrders = orders.filter((o) =>
            section.statuses.includes(o.status)
          );
          return (
            <div
              key={section.label}
              className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-sm"
            >
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 ${section.color}`}
              >
                {section.icon}
                <h2 className="text-lg font-bold">{section.label}</h2>
                <Badge variant="secondary" className="mr-auto font-mono">
                  {sectionOrders.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {sectionOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    لا توجد طلبات
                  </p>
                ) : (
                  sectionOrders.map((order) => {
                    const isOTO = isOneTimeOrder(order);
                    const itemKey = isOTO
                      ? order.entityId || order.id
                      : order.subscriptionDayId || order.id;

                    // Do not prepare unpaid one-time orders
                    const isNonOperational =
                      isOTO &&
                      (order.paymentStatus !== "paid" ||
                        order.status === "pending_payment");

                    const canPrimary =
                      section.primaryAction &&
                      order.allowedActions?.includes(section.primaryAction) &&
                      !isNonOperational;
                    const canCancel =
                      order.allowedActions?.includes("cancel") &&
                      (!isOTO || !isUnsupportedOneTimeOrderAction("cancel"));
                    const canReopen =
                      order.allowedActions?.includes("reopen") &&
                      (!isOTO || !isUnsupportedOneTimeOrderAction("reopen"));
                    const canDispatch =
                      order.allowedActions?.includes("dispatch") &&
                      (!isOTO || !isUnsupportedOneTimeOrderAction("dispatch"));
                    const canNotifyArrival =
                      order.allowedActions?.includes("notify_arrival") &&
                      (!isOTO || !isUnsupportedOneTimeOrderAction("notify_arrival"));

                    return (
                      <Card
                        key={itemKey}
                        className={`group border-border transition-all duration-200 hover:shadow-md ${
                          isOTO ? "border-purple-500/20" : ""
                        }`}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="flex items-center gap-1.5 text-base font-bold">
                                {order.userName}
                                {isOTO && (
                                  <ShoppingBag className="h-3.5 w-3.5 text-purple-500" />
                                )}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {order.userPhone}
                              </p>
                              {isOTO && order.orderNumber && (
                                <p className="font-mono text-xs text-purple-500">
                                  {order.orderNumber}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isOTO
                                  ? "border-purple-500/20 bg-purple-500/10 text-purple-600"
                                  : "bg-primary/5 text-primary"
                              }`}
                            >
                              {isOTO ? (
                                <>
                                  <Store className="ml-1 h-3 w-3" />
                                  استلام
                                </>
                              ) : order.method === "delivery" ? (
                                "توصيل"
                              ) : (
                                "استلام"
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 pt-0">
                          {/* Items: one-time orders use items[], subscriptions use mealSlots */}
                          {isOTO && order.items && order.items.length > 0 && (
                            <div className="space-y-1 rounded-md bg-muted/50 p-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {!isOTO &&
                            order.mealSlots &&
                            order.mealSlots.length > 0 && (
                              <div className="space-y-1 rounded-md bg-muted/50 p-2">
                                {order.mealSlots.map((slot) =>
                                  slot.items.map((item) => (
                                    <div
                                      key={`${slot.slot}-${item.name}`}
                                      className="flex justify-between text-sm"
                                    >
                                      <span className="font-medium">
                                        {item.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        x{item.quantity}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}

                          {/* Pickup info for one-time orders */}
                          {isOTO && order.pickup && (
                            <div className="space-y-0.5 rounded-md bg-purple-500/5 p-2 text-xs">
                              {order.pickup.branchName && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    الفرع
                                  </span>
                                  <span className="font-medium">
                                    {order.pickup.branchName}
                                  </span>
                                </div>
                              )}
                              {order.pickup.window && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    النافذة
                                  </span>
                                  <span className="font-medium">
                                    {order.pickup.window}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Non-operational warning */}
                          {isNonOperational && (
                            <p className="text-xs font-medium text-amber-600">
                              طلب غير مدفوع – لا يمكن التحضير
                            </p>
                          )}

                          {/* Primary action button */}
                          {canPrimary && (
                            <Button
                              className="h-8 w-full text-xs"
                              onClick={() =>
                                requestAction(
                                  order,
                                  section.primaryAction!,
                                  section.primaryActionLabel!,
                                  false
                                )
                              }
                              disabled={updateStatus.isPending}
                            >
                              {section.primaryActionLabel}
                            </Button>
                          )}

                          {/* Cancel, Reopen, Dispatch, Notify Arrival actions */}
                          <div className="flex flex-wrap gap-2">
                            {canDispatch && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 flex-1 border-blue-300 text-xs text-blue-600 hover:bg-blue-50"
                                onClick={() =>
                                  requestAction(
                                    order,
                                    "dispatch",
                                    "إرسال للموصّل",
                                    false
                                  )
                                }
                                disabled={updateStatus.isPending}
                              >
                                <Truck className="ml-1 h-3 w-3" />
                                إرسال للموصّل
                              </Button>
                            )}
                            {canNotifyArrival && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 flex-1 border-teal-300 text-xs text-teal-600 hover:bg-teal-50"
                                onClick={() =>
                                  requestAction(
                                    order,
                                    "notify_arrival",
                                    "وصول قريب",
                                    false
                                  )
                                }
                                disabled={updateStatus.isPending}
                              >
                                <Bell className="ml-1 h-3 w-3" />
                                وصول قريب
                              </Button>
                            )}
                            {canCancel && !isNonOperational && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 flex-1 text-xs"
                                onClick={() =>
                                  requestAction(order, "cancel", "إلغاء", true)
                                }
                                disabled={updateStatus.isPending}
                              >
                                <XCircle className="ml-1 h-3 w-3" />
                                إلغاء
                              </Button>
                            )}
                            {canReopen && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 flex-1 text-xs"
                                onClick={() =>
                                  requestAction(
                                    order,
                                    "reopen",
                                    "إعادة فتح",
                                    false
                                  )
                                }
                                disabled={updateStatus.isPending}
                              >
                                <RotateCcw className="ml-1 h-3 w-3" />
                                إعادة فتح
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reason confirmation dialog */}
      <AlertDialog
        open={reasonDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setReasonDialog({
              open: false,
              item: null,
              action: "",
              actionLabel: "",
              isDangerous: false,
            });
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onConfirmSubmit)}>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-xl">
                  {reasonDialog.isDangerous ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <ChefHat className="h-5 w-5 text-primary" />
                  )}
                  تأكيد: {reasonDialog.actionLabel}
                </AlertDialogTitle>
                <AlertDialogDescription className="pt-2 text-base">
                  يرجى إدخال سبب هذا الإجراء للحفاظ على سجل التدقيق.
                </AlertDialogDescription>
                <div className="mt-4 space-y-3">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السبب <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل سبب الإجراء..." {...field} autoFocus />
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
                        <FormLabel>ملاحظات (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="ملاحظات إضافية..." {...field} />
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
                  disabled={updateStatus.isPending}
                  className={
                    reasonDialog.isDangerous
                      ? "bg-red-600 px-8 font-bold hover:bg-red-700"
                      : "bg-primary px-8 font-bold"
                  }
                >
                  تأكيد {reasonDialog.actionLabel}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
