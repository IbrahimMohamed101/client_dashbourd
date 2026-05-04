import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/apis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { Loader } from "@/components/global/loader";

interface KitchenQueueItem {
  subscriptionDayId: string;
  userId: string;
  userName: string;
  userPhone: string;
  status: string;
  method: "delivery" | "pickup";
  mealSlots: { slot: string; items: { name: string; quantity: number; notes?: string }[] }[];
  allowedActions: string[];
  notes?: string;
}

interface KitchenQueueResponse {
  data: KitchenQueueItem[];
}

export const KitchenBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: queueData, isLoading } = useQuery<KitchenQueueResponse>({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get(`/api/dashboard/kitchen/queue?date=${today}&status=open,locked,in_preparation,ready_for_pickup,out_for_delivery&method=all`);
      return data;
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { data } = await api.post(`/api/dashboard/kitchen/actions/${action}`, {
        entityType: "subscription_day",
        entityId: id,
        payload: {}
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  if (isLoading) return <Loader label="جاري تحميل طلبات المطبخ..." />;

  const orders = queueData?.data || [];

  const sections = [
    {
      status: "open",
      label: "بانتظار التحضير",
      icon: <ListTodo className="h-5 w-5" />,
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      action: "prepare" as const,
      actionLabel: "بدء التحضير",
    },
    {
      status: "locked",
      label: "مقفل",
      icon: <Clock className="h-5 w-5" />,
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      action: "prepare" as const,
      actionLabel: "بدء التحضير",
    },
    {
      status: "in_preparation",
      label: "جاري التحضير",
      icon: <ChefHat className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      action: "ready_for_pickup" as const,
      actionLabel: "إكمال التحضير",
    },
    {
      status: "ready_for_pickup",
      label: "جاهز للتسليم",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-600 border-green-200",
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

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => {
          const sectionOrders = orders.filter((o) => o.status === section.status);
          return (
            <div
              key={section.status}
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
                  sectionOrders.map((order) => (
                    <Card
                      key={order.subscriptionDayId}
                      className="group border-border transition-all duration-200 hover:shadow-md"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-bold">
                              {order.userName}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {order.userPhone}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-primary/5 text-xs text-primary"
                          >
                            {order.method === "delivery" ? "توصيل" : "استلام"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-4 pt-0">
                        {order.mealSlots?.length > 0 && (
                          <div className="space-y-1 rounded-md bg-muted/50 p-2">
                            {order.mealSlots.map((slot) =>
                              slot.items.map((item) => (
                                <div
                                  key={`${slot.slot}-${item.name}`}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {section.action && order.allowedActions?.includes(section.action) && (
                          <Button
                            className="h-8 w-full text-xs"
                            onClick={() =>
                              updateStatus.mutate({
                                id: order.subscriptionDayId,
                                action: section.action,
                              })
                            }
                          >
                            {section.actionLabel}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
