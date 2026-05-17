import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import { getKitchenQueue, executeKitchenAction } from "@/utils/fetchKitchenData";
import { isOneTimeOrder } from "@/types/dashboardOpsTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KitchenOperationsRow } from "@/types/kitchenTypes";

export default function KitchenBoard() {
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["kitchen-queue", date],
    queryFn: () => getKitchenQueue({ date }),
    refetchInterval: 30000,
  });

  const actionMutation = useMutation({
    mutationFn: executeKitchenAction,
    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["kitchen-queue"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ["kitchen-queue"] });
    },
  });

  const pendingItems = queue.filter((item) => ["open", "locked", "confirmed"].includes(item.status));
  const preparingItems = queue.filter((item) => item.status === "in_preparation");
  const readyItems = queue.filter((item) => item.status === "ready_for_pickup");

  const renderCard = (item: KitchenOperationsRow) => {
    const isOTO = isOneTimeOrder(item);
    const isUnpaid = isOTO && item.paymentStatus !== "paid";
    
    return (
      <div 
        key={item.id} 
        className={`bg-white p-4 rounded-lg shadow mb-4 border ${isOTO ? "border-l-4 border-l-purple-500" : ""}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              {item.customer.name}
              {isOTO && <ShoppingBag className="w-4 h-4 text-purple-500" />}
            </h4>
            <p className="text-sm text-gray-500">{item.customer.id} | {item.modeLabel}</p>
          </div>
          <Badge variant={isUnpaid ? "destructive" : "default"}>
            {item.statusLabel}
          </Badge>
        </div>

        {isUnpaid && (
          <div className="bg-red-50 text-red-700 p-2 text-sm rounded-md flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            بانتظار الدفع (لا يمكن تحضير الطلب)
          </div>
        )}

        <div className="text-sm mb-4">
          <ul className="list-disc list-inside">
            {item.items.map((i, idx) => (
              <li key={idx}>{i.name} ({i.kind})</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 flex-wrap">
          {item.actions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant === "primary" ? "default" : "secondary"}
              disabled={!action.enabled || isUnpaid || actionMutation.isPending}
              onClick={() => actionMutation.mutate({ item, action: action.key })}
              size="sm"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">جاري التحميل...</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">لوحة المطبخ ({date})</h1>
      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4 text-gray-700">قيد الانتظار ({pendingItems.length})</h2>
          {pendingItems.map(renderCard)}
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4 text-yellow-600">قيد التحضير ({preparingItems.length})</h2>
          {preparingItems.map(renderCard)}
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4 text-green-600">جاهز ({readyItems.length})</h2>
          {readyItems.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
