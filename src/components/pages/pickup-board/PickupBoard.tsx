import  { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { getPickupQueue, executePickupAction } from "@/utils/fetchDashboardOpsData";
import { isOneTimeOrder, type UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isUnsupportedOneTimeOrderAction } from "@/types/oneTimeOrderTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function PickupBoard() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const queryClient = useQueryClient();
  const [fulfillItem, setFulfillItem] = useState<UnifiedQueueItem | null>(null);
  const [pickupCode, setPickupCode] = useState("");

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["pickup-queue", date],
    queryFn: () => getPickupQueue({ date }),
  });

  const actionMutation = useMutation({
    mutationFn: executePickupAction,
    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["pickup-queue"] });
      setFulfillItem(null);
      setPickupCode("");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ["pickup-queue"] });
    },
  });

  const handleAction = (item: UnifiedQueueItem, action: string) => {
    if (action === "fulfill") {
      setFulfillItem(item);
    } else {
      actionMutation.mutate({ item, action });
    }
  };

  const handleFulfillSubmit = () => {
    if (fulfillItem) {
      const isOTO = isOneTimeOrder(fulfillItem);
      actionMutation.mutate({
        item: fulfillItem,
        action: "fulfill",
        pickupCode: isOTO ? undefined : pickupCode,
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لوحة الاستلام</h1>
        <Input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="w-48"
        />
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-gray-500">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {queue.map((item) => {
            const isOTO = isOneTimeOrder(item);
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{item.userName}</h3>
                  <div className="text-sm text-gray-500">{item.status}</div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {item.userPhone && <div>📞 {item.userPhone}</div>}
                  {item.pickup?.pickupCode && (
                    <div className="mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                      رمز الاستلام: {item.pickup.pickupCode}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap mt-4">
                  {item.allowedActions
                    .filter(action => !(isOTO && isUnsupportedOneTimeOrderAction(action)))
                    .map(action => (
                      <Button
                        key={action}
                        variant={action === "fulfill" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAction(item, action)}
                        disabled={actionMutation.isPending}
                      >
                        {action === "fulfill" ? "تسليم" : action}
                      </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!fulfillItem} onOpenChange={(open) => !open && setFulfillItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد تسليم الطلب</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">تأكيد تسليم الطلب للعميل {fulfillItem?.userName}؟</p>
            
            {fulfillItem && !isOneTimeOrder(fulfillItem) && (
              <div>
                <label className="block text-sm mb-1">رمز التحقق (اختياري)</label>
                <Input 
                  value={pickupCode} 
                  onChange={(e) => setPickupCode(e.target.value)} 
                  placeholder="أدخل الرمز إن وجد" 
                />
              </div>
            )}

            {fulfillItem && isOneTimeOrder(fulfillItem) && fulfillItem.pickup?.pickupCode && (
              <div className="bg-purple-50 p-3 rounded-md text-purple-800 text-sm">
                الرجاء التأكد من أن رمز الاستلام لدى العميل مطابق لـ: <strong className="font-mono text-lg">{fulfillItem.pickup.pickupCode}</strong>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFulfillItem(null)}>إلغاء</Button>
            <Button onClick={handleFulfillSubmit} disabled={actionMutation.isPending}>تأكيد التسليم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
