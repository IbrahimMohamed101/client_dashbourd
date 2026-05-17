import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { getCourierQueue, executeCourierAction } from "@/utils/fetchDashboardOpsData";
import { Button } from "@/components/ui/button";

export default function CourierBoard() {
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["courier-queue", date],
    queryFn: () => getCourierQueue({ date, method: "delivery" }),
  });

  const actionMutation = useMutation({
    mutationFn: executeCourierAction,
    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["courier-queue"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ["courier-queue"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_preparation": return "border-t-yellow-400";
      case "out_for_delivery": return "border-t-blue-500";
      case "fulfilled": return "border-t-green-500";
      default: return "border-t-gray-300";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة التوصيل</h1>
      
      {isLoading ? (
        <div className="text-center p-8 text-gray-500">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {queue.map((item) => (
            <div key={item.id} className={`bg-white p-4 rounded-xl shadow border-t-4 ${getStatusColor(item.status)}`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg">{item.userName}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{item.status}</span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <div>📞 {item.userPhone}</div>
                {item.notes && <div>📝 {item.notes}</div>}
              </div>

              <div className="flex gap-2 mt-4">
                {item.allowedActions.includes("dispatch") && (
                  <Button size="sm" onClick={() => actionMutation.mutate({ item, action: "dispatch" })} disabled={actionMutation.isPending}>
                    إرسال مع المندوب
                  </Button>
                )}
                {item.allowedActions.includes("fulfill") && (
                  <Button size="sm" variant="default" onClick={() => actionMutation.mutate({ item, action: "fulfill" })} disabled={actionMutation.isPending}>
                    تأكيد التوصيل
                  </Button>
                )}
                {item.allowedActions.includes("cancel") && (
                  <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ item, action: "cancel" })} disabled={actionMutation.isPending}>
                    إلغاء التوصيل
                  </Button>
                )}
                
                <Button size="sm" variant="outline" className="mr-auto text-blue-600" onClick={() => toast.info("سيتم تفعيل الخريطة قريباً")}>
                  <MapPin className="w-4 h-4 ml-1" />
                  الموقع
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
